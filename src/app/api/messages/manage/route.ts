import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import { EditMessageSchema } from '@/lib/validations';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// ── PATCH: Edit Message ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const body = await req.json().catch(() => ({}));
  const parsed = EditMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { messageId, content } = parsed.data;

  const message = await Message.findById(messageId);
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  // Ensure user owns the message
  if (message.senderId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Ensure edit limit
  if ((message.editCount || 0) >= 5) {
    return NextResponse.json({ error: 'Edit limit reached' }, { status: 400 });
  }

  message.content = content;
  message.editCount = (message.editCount || 0) + 1;
  await message.save();

  // Populate to broadcast
  const populated = await Message.findById(message._id)
    .populate('senderId', 'name role image companyName')
    .lean();

  // Notify both sender and receiver channels safely about the edit
  try {
    await pusher.trigger(`user-${message.receiverId}`, 'message-edited', populated);
    await pusher.trigger(`user-${message.senderId}`, 'message-edited', populated);
  } catch (err) {
    console.error('Pusher trigger failed:', err);
  }

  return NextResponse.json({ message: populated });
}

// ── DELETE: Delete Message ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');
  const forEveryone = searchParams.get('forEveryone') === 'true';

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return NextResponse.json({ error: 'Valid messageId is required' }, { status: 400 });
  }

  const message = await Message.findById(messageId);
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  const userId = session.user.id;
  const isSender = message.senderId.toString() === userId;
  const isReceiver = message.receiverId.toString() === userId;

  if (!isSender && !isReceiver) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (forEveryone) {
    // Only sender can delete for everyone
    if (!isSender) {
      return NextResponse.json(
        { error: 'Only the sender can delete for everyone' },
        { status: 403 }
      );
    }

    // Check time period context? User asked: "delete mesege for everyone or only me within certain time period".
    // Wait, the user said "within certain time period". Let's enforce 15 minutes limit for 'everyone'.
    const messageAgeMinutes =
      (new Date().getTime() - new Date(message.createdAt).getTime()) / 60000;
    if (messageAgeMinutes > 15) {
      return NextResponse.json(
        { error: 'Cannot delete messages older than 15 minutes for everyone' },
        { status: 400 }
      );
    }

    message.isDeletedForEveryone = true;
    message.content = '*This message was deleted*'; // scrub content
    message.attachments = []; // scrub attachments
  } else {
    // Delete for me
    if (!message.deletedFor) message.deletedFor = [];
    if (!message.deletedFor.includes(new mongoose.Types.ObjectId(userId))) {
      message.deletedFor.push(new mongoose.Types.ObjectId(userId));
    }
  }

  await message.save();

  try {
    // Determine the broadcast payload
    const broadcastPayload = {
      messageId: message._id,
      threadId: message.threadId,
      forEveryone,
      deletedForMeBy: !forEveryone ? userId : null,
      content: message.content, // the scrubbed content
    };

    if (forEveryone) {
      await pusher.trigger(`user-${message.receiverId}`, 'message-deleted', broadcastPayload);
      await pusher.trigger(`user-${message.senderId}`, 'message-deleted', broadcastPayload);
    } else {
      await pusher.trigger(`user-${userId}`, 'message-deleted', broadcastPayload);
    }
  } catch (err) {
    console.error('Pusher trigger failed:', err);
  }

  return NextResponse.json({ ok: true });
}
