import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { InterviewUpdateSchema } from '@/lib/validations';
import { updateInterviewSession } from '@/lib/hiring-suite';
import { InterviewSession } from '@/models/InterviewSession';
import { isValidObjectId } from '@/lib/object-id';

type Params = { params: Promise<{ interviewId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = await params;
    if (!isValidObjectId(interviewId)) {
      return NextResponse.json({ error: 'Invalid interview ID' }, { status: 400 });
    }
    await connectDB();

    const interview = await InterviewSession.findById(interviewId)
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email university department')
      .lean();
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found.' }, { status: 404 });
    }

    const canAccess =
      (session.user.role === 'employer' && interview.employerId.toString() === session.user.id) ||
      (session.user.role === 'student' && interview.studentId.toString() === session.user.id);

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.user.role === 'student') {
      return NextResponse.json({
        interview: {
          ...interview,
          liveNotes: undefined,
          scorecard: undefined,
        },
      });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('[INTERVIEW DETAIL GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch interview.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['student', 'employer'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = InterviewUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { interviewId } = await params;
    if (!isValidObjectId(interviewId)) {
      return NextResponse.json({ error: 'Invalid interview ID' }, { status: 400 });
    }
    const actorRole = session.user.role === 'student' ? 'student' : 'employer';
    const interview = await updateInterviewSession({
      interviewId,
      actorId: session.user.id,
      role: actorRole,
      action: parsed.data.action,
      liveNotes: parsed.data.liveNotes || undefined,
      scorecard: parsed.data.scorecard,
      recordingAsset: parsed.data.recordingAsset,
    });

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('[INTERVIEW DETAIL PATCH ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update interview.' },
      { status: 500 }
    );
  }
}
