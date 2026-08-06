// src/app/api/notifications/route.ts
// GET    /api/notifications          — fetch user's notifications (paginated)
// PATCH  /api/notifications         — mark all as read
// PATCH  /api/notifications?id=xxx  — mark one as read
// DELETE /api/notifications         — delete all notifications permanently
// DELETE /api/notifications?id=xxx  — delete a single notification permanently

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';
import { pusherServer, userChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { parsePaginationParams } from '@/lib/pagination';
import mongoose from 'mongoose';

const ALLOWED_TYPES = new Set([
  'job_match',
  'deadline_reminder',
  'status_update',
  'recommendation_request',
  'message_received',
  'badge_earned',
  'score_update',
  'advisor_note',
  'application_received',
  'assessment_assigned',
  'interview_scheduled',
  'mentorship_request',
  'mentorship_accepted',
  'review_received',
  'freelance_order',
  'payment_received',
]);

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    await connectDB();

    // ── Build query ──────────────────────────────────────────────────────
    const query: Record<string, unknown> = { userId: session.user.id };

    if (unreadOnly) {
      query.isRead = false;
    }

    // Only apply type filter if it's a known, safe type
    if (type === 'mentorship') {
      query.type = {
        $in: ['mentorship_request', 'mentorship_accepted', 'message_received', 'review_received'],
      };
    } else if (type && type !== 'all' && ALLOWED_TYPES.has(type)) {
      query.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      // Always count ALL unread regardless of current filter
      Notification.countDocuments({ userId: session.user.id, isRead: false }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GET NOTIFICATIONS ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notifId = searchParams.get('id');

    if (notifId && !mongoose.Types.ObjectId.isValid(notifId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    await connectDB();

    if (notifId) {
      // Mark single notification as read
      await Notification.findOneAndUpdate(
        { _id: notifId, userId: session.user.id },
        { $set: { isRead: true } }
      );
    } else {
      // Mark ALL notifications as read
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true } }
      );
    }

    // Count remaining unread after update
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    // Push updated unread count to client via Pusher
    await pusherServer
      .trigger(userChannel(session.user.id), PUSHER_EVENTS.NOTIFICATION_READ, { unreadCount })
      .catch(() => {}); // non-critical — never crash the response

    return NextResponse.json({ message: 'Updated', unreadCount });
  } catch (err) {
    console.error('[PATCH NOTIFICATIONS ERROR]', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notifId = searchParams.get('id');

    if (notifId && !mongoose.Types.ObjectId.isValid(notifId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    await connectDB();

    if (notifId) {
      // Delete single notification
      await Notification.deleteOne({ _id: notifId, userId: session.user.id });
    } else {
      // Delete ALL notifications for this user
      await Notification.deleteMany({ userId: session.user.id });
    }

    // Count remaining unread after delete
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    // Push updated count to client
    await pusherServer
      .trigger(userChannel(session.user.id), PUSHER_EVENTS.NOTIFICATION_READ, { unreadCount })
      .catch(() => {}); // non-critical

    return NextResponse.json({ message: 'Deleted', unreadCount });
  } catch (err) {
    console.error('[DELETE NOTIFICATIONS ERROR]', err);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
