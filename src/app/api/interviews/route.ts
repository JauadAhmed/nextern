import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { dhakaDateTimeInputToISOString } from '@/lib/datetime';
import { ScheduleInterviewSchema } from '@/lib/validations';
import { scheduleInterviewSessions, PremiumAccessError } from '@/lib/hiring-suite';
import { InterviewSession } from '@/models/InterviewSession';
import { isValidObjectId } from '@/lib/object-id';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (jobId && !isValidObjectId(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    if (session.user.role === 'employer') {
      const query: Record<string, unknown> = { employerId: session.user.id };
      if (jobId) query.jobId = jobId;

      const interviews = await InterviewSession.find(query)
        .populate('studentId', 'name email university department isPremium')
        .populate('jobId', 'title companyName')
        .sort({ scheduledAt: 1 })
        .lean();

      return NextResponse.json({ interviews });
    }

    if (session.user.role === 'student') {
      const interviews = await InterviewSession.find({ studentId: session.user.id })
        .populate('jobId', 'title companyName')
        .sort({ scheduledAt: 1 })
        .lean();
      return NextResponse.json({ interviews });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[INTERVIEWS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch interviews.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ScheduleInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const normalizedScheduledAt = dhakaDateTimeInputToISOString(parsed.data.scheduledAt);
    if (!normalizedScheduledAt) {
      return NextResponse.json({ error: 'Invalid interview date and time.' }, { status: 400 });
    }

    const interviews = await scheduleInterviewSessions({
      employerId: session.user.id,
      applicationIds: parsed.data.applicationIds,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      mode: parsed.data.mode,
      scheduledAt: new Date(normalizedScheduledAt),
      durationMinutes: parsed.data.durationMinutes,
      panelists: parsed.data.panelists,
    });

    return NextResponse.json({ interviews }, { status: 201 });
  } catch (error) {
    console.error('[INTERVIEWS POST ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to schedule interview.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
