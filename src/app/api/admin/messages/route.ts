import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';
import { User } from '@/models/User';
import { Message } from '@/models/Message';
import mongoose from 'mongoose';

// ── GET /api/admin/messages ────────────────────────────────────────────────
// Fetch all messages with filters for the admin Messages section.
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const searchRegex = buildSearchRegex(searchParams.get('search'));
    const flaggedOnly = parseBooleanParam(searchParams.get('flaggedOnly'));
    const unreadOnly = parseBooleanParam(searchParams.get('unreadOnly'));
    const type = searchParams.get('type');
    const { limit } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 100 });

    await connectDB();

    // Build user id list if searching
    let matchedUserIds: unknown[] = [];
    if (searchRegex) {
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { companyName: searchRegex }],
      })
        .select('_id')
        .lean();
      matchedUserIds = matchedUsers.map((item) => item._id);
    }

    const messageQuery: Record<string, unknown> = {};

    if (typeof flaggedOnly === 'boolean') messageQuery.isFlagged = flaggedOnly;
    if (unreadOnly === true) messageQuery.isRead = false;

    if (type === 'support') {
      const adminIds = await User.find({ role: 'admin' }).distinct('_id');
      messageQuery.senderId = { $in: adminIds };
    } else if (['support_message', 'admin_message', 'system_message'].includes(type ?? '')) {
      messageQuery.messageType = type;
    }

    if (searchRegex) {
      messageQuery.$or = [
        { content: searchRegex },
        { flagReason: searchRegex },
        ...(matchedUserIds.length > 0
          ? [{ senderId: { $in: matchedUserIds } }, { receiverId: { $in: matchedUserIds } }]
          : []),
      ];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      messages,
      totalMessages,
      flaggedMessages,
      messagesToday,
      unreadMessages,
      supportMessages,
    ] = await Promise.all([
      Message.find(messageQuery)
        .populate('senderId', 'name email role companyName image university studentId')
        .populate('receiverId', 'name email role companyName image university studentId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Message.countDocuments({}),
      Message.countDocuments({ isFlagged: true }),
      Message.countDocuments({ createdAt: { $gte: today } }),
      Message.countDocuments({ isRead: false }),
      User.find({ role: 'admin' })
        .distinct('_id')
        .then((adminIds) => Message.countDocuments({ senderId: { $in: adminIds } })),
    ]);

    return NextResponse.json({
      messages,
      summary: {
        totalMessages,
        flaggedMessages,
        messagesToday,
        unreadMessages,
        supportMessages,
      },
    });
  } catch (error) {
    console.error('[ADMIN MESSAGES GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// ── PATCH /api/admin/messages ──────────────────────────────────────────────
// Flag or unflag a message.
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { messageId, isFlagged, flagReason } = await req.json();
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Valid messageId is required' }, { status: 400 });
    }

    await connectDB();

    const update: Record<string, unknown> = { isFlagged: Boolean(isFlagged) };
    if (flagReason !== undefined) update.flagReason = flagReason;

    const message = await Message.findByIdAndUpdate(messageId, update, { new: true }).lean();
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message updated', data: message });
  } catch (error) {
    console.error('[ADMIN MESSAGES PATCH ERROR]', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// ── DELETE /api/admin/messages ─────────────────────────────────────────────
// Soft-delete a message for everyone.
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Valid message id is required' }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isDeletedForEveryone: true },
      { new: true }
    ).lean();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message deleted for everyone' });
  } catch (error) {
    console.error('[ADMIN MESSAGES DELETE ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
