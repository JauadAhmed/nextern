import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MentorSession } from '@/models/MentorSession';
import { Mentor } from '@/models/Mentor';
import { checkFeatureAccess } from '@/lib/premium';
import { notifyMentorshipRequest } from '@/lib/notify';
import mongoose from 'mongoose';
import { MentorSessionRequestSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const roleParam = searchParams.get('role'); // 'student' or 'mentor'

    await connectDB();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    if (roleParam === 'mentor' || session.user.role === 'alumni') {
      const mentor = await Mentor.findOne({ userId: session.user.id }).lean();
      if (!mentor) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }
      query.mentorId = mentor._id;
    } else {
      query.studentId = session.user.id;
    }

    const sessions = await MentorSession.find(query)
      .populate('mentorId')
      .populate('studentId', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    // Nested populate for mentor's user details if requested by student
    if (roleParam !== 'mentor' && session.user.role !== 'alumni') {
      await MentorSession.populate(sessions, {
        path: 'mentorId.userId',
        select: 'name email image',
        model: 'User',
      });
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('[GET MENTOR SESSIONS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can request mentorship' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = MentorSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { mentorId, sessionType, studentNotes } = parsed.data;

    await connectDB();

    // Check premium access
    const access = await checkFeatureAccess(session.user.id, 'mentorshipRequest');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const mentor = await Mentor.findById(mentorId).populate('userId', 'name').lean();
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }
    if (!mentor.isAvailable) {
      return NextResponse.json(
        { error: 'Mentor is not currently accepting requests' },
        { status: 400 }
      );
    }

    // Lazy reset for sessionsThisMonth
    const currentMonth = new Date().getMonth();
    const lastSessionMonth = mentor.updatedAt ? new Date(mentor.updatedAt).getMonth() : -1;
    if (currentMonth !== lastSessionMonth) {
      await Mentor.findByIdAndUpdate(mentorId, { $set: { sessionsThisMonth: 0 } });
    }

    // Re-fetch mentor to check limit after lazy reset
    const updatedMentor = await Mentor.findById(mentorId).lean();
    if (updatedMentor && updatedMentor.sessionsThisMonth >= updatedMentor.monthlySessionLimit) {
      return NextResponse.json(
        { error: 'Mentor has reached their monthly session limit' },
        { status: 400 }
      );
    }

    // Check if there is already a pending session
    const existingPending = await MentorSession.findOne({
      studentId: session.user.id,
      mentorId,
      status: 'pending',
    });

    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending request with this mentor' },
        { status: 400 }
      );
    }

    const mentorSession = await MentorSession.create({
      studentId: new mongoose.Types.ObjectId(session.user.id),
      mentorId: new mongoose.Types.ObjectId(mentorId),
      sessionType,
      studentNotes,
      status: 'pending',
    });

    // Fire notification
    await notifyMentorshipRequest(
      mentor.userId._id.toString(),
      session.user.name || 'A student',
      sessionType
    );

    return NextResponse.json(mentorSession, { status: 201 });
  } catch (error) {
    console.error('[CREATE MENTOR SESSION ERROR]', error);
    return NextResponse.json({ error: 'Failed to create mentorship request' }, { status: 500 });
  }
}
