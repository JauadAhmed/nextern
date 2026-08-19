import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';
import { AdminSupportNotificationSchema } from '@/lib/validations';
import { User } from '@/models/User';
import { Message, type SupportMessageType } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { createNotification } from '@/lib/notify';
import { pusherServer, PUSHER_EVENTS, userChannel } from '@/lib/pusher';

function makeThreadId(a: string, b: string) {
  return [a, b].sort().join('-');
}

function messageTypeLabel(type: SupportMessageType) {
  if (type === 'admin_message') return 'admin message';
  if (type === 'system_message') return 'system message';
  return 'support message';
}

async function createSupportMessage(params: {
  adminId: string;
  userId: string;
  content: string;
  messageType: SupportMessageType;
}) {
  const message = await Message.create({
    senderId: params.adminId,
    receiverId: params.userId,
    threadId: makeThreadId(params.adminId, params.userId),
    threadType: 'direct',
    content: params.content,
    messageType: params.messageType,
    isRead: false,
    isFlagged: false,
  });

  const populated = await Message.findById(message._id)
    .populate('senderId', 'name role image companyName')
    .lean();

  try {
    await pusherServer.trigger(userChannel(params.userId), PUSHER_EVENTS.NEW_MESSAGE, populated);
  } catch (error) {
    console.error('[ADMIN SUPPORT MESSAGE PUSHER ERROR]', error);
  }

  return populated;
}

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
    const { limit } = parsePagination(searchParams, { defaultLimit: 12, maxLimit: 50 });

    await connectDB();

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
    const notificationQuery: Record<string, unknown> = {};

    if (typeof flaggedOnly === 'boolean') messageQuery.isFlagged = flaggedOnly;
    if (typeof unreadOnly === 'boolean') notificationQuery.isRead = !unreadOnly ? undefined : false;
    if (type && type !== 'all') notificationQuery.type = type;

    if (searchRegex) {
      messageQuery.$or = [
        { content: searchRegex },
        { flagReason: searchRegex },
        ...(matchedUserIds.length > 0
          ? [{ senderId: { $in: matchedUserIds } }, { receiverId: { $in: matchedUserIds } }]
          : []),
      ];
      notificationQuery.$or = [
        { title: searchRegex },
        { body: searchRegex },
        ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
      ];
    }

    if (notificationQuery.isRead === undefined) {
      delete notificationQuery.isRead;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [messages, notifications, flaggedMessages, unreadNotifications, notificationsToday] =
      await Promise.all([
        Message.find(messageQuery)
          .populate('senderId', 'name email role companyName university')
          .populate('receiverId', 'name email role companyName university')
          .populate('relatedJobId', 'title companyName')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Notification.find(notificationQuery)
          .populate('userId', 'name email role companyName university')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Message.countDocuments({ isFlagged: true }),
        Notification.countDocuments({ isRead: false }),
        Notification.countDocuments({ createdAt: { $gte: today } }),
      ]);

    return NextResponse.json({
      messages,
      notifications,
      summary: {
        flaggedMessages,
        unreadNotifications,
        notificationsToday,
      },
    });
  } catch (error) {
    console.error('[ADMIN SUPPORT ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch support data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AdminSupportNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const recipient = await User.findById(parsed.data.userId).select('_id').lean();
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const shouldNotify = parsed.data.sendType !== 'support_message';
    const shouldMessage = parsed.data.sendType !== 'notification';
    const results: {
      notification?: { success: boolean; error?: string };
      supportMessage?: { success: boolean; error?: string };
    } = {};

    if (shouldNotify) {
      try {
        const notification = await createNotification({
          userId: parsed.data.userId,
          type: parsed.data.type!,
          title: parsed.data.title,
          body: parsed.data.body,
          link: parsed.data.link || undefined,
          meta: {
            createdBy: session.user.id,
            source: 'admin_support_center',
          },
        });
        results.notification = notification
          ? { success: true }
          : { success: false, error: 'Notification could not be created' };
      } catch (error) {
        console.error('[ADMIN SUPPORT NOTIFICATION ERROR]', error);
        results.notification = { success: false, error: 'Notification could not be created' };
      }
    }

    if (shouldMessage) {
      try {
        await createSupportMessage({
          adminId: session.user.id,
          userId: parsed.data.userId,
          content: parsed.data.supportMessage,
          messageType: parsed.data.messageType,
        });
        results.supportMessage = { success: true };
      } catch (error) {
        console.error('[ADMIN SUPPORT MESSAGE ERROR]', error);
        results.supportMessage = { success: false, error: 'Support message could not be sent' };
      }
    }

    const outcomes = Object.values(results);
    const successful = outcomes.filter((result) => result.success).length;
    if (successful === 0) {
      return NextResponse.json(
        { error: 'Support communication could not be sent', results },
        { status: 500 }
      );
    }

    const isPartial = successful !== outcomes.length;
    return NextResponse.json(
      {
        message: isPartial
          ? 'Only part of the support communication was sent.'
          : parsed.data.sendType === 'both'
            ? `Notification and ${messageTypeLabel(parsed.data.messageType)} sent successfully.`
            : parsed.data.sendType === 'support_message'
              ? `${messageTypeLabel(parsed.data.messageType).replace(/^./, (character) => character.toUpperCase())} sent successfully.`
              : 'Support notification sent successfully.',
        results,
        partial: isPartial,
      },
      { status: isPartial ? 207 : 201 }
    );
  } catch (error) {
    console.error('[ADMIN SUPPORT SEND ERROR]', error);
    return NextResponse.json({ error: 'Failed to send support notification' }, { status: 500 });
  }
}
