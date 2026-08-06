// src/app/api/jobs/[jobId]/route.ts
// GET    /api/jobs/[jobId] — fetch single job + hasApplied flag
// PATCH  /api/jobs/[jobId] — update job (employer owner or admin)
// DELETE /api/jobs/[jobId] — delete job (employer owner or admin)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import { Application } from '@/models/Application';
import { User } from '@/models/User';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { InterviewSession } from '@/models/InterviewSession';
import { Message } from '@/models/Message';
import { AdminJobUpdateSchema, UpdateJobSchema } from '@/lib/validations';
import { removeCalendarEvent, syncOwnedEventToCalendar } from '@/lib/calendar';
import { onJobPosted, onEventCreated } from '@/lib/events';
import mongoose from 'mongoose';

type Params = { params: Promise<{ jobId: string }> };

async function getAcademicOwnerRole(userId: string) {
  const owner = await User.findById(userId).select('role').lean();
  return owner?.role === 'advisor' || owner?.role === 'dept_head' ? owner.role : null;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { jobId } = await params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    await connectDB();

    const job = await Job.findById(jobId).lean();
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    let hasApplied = false;
    const session = await auth();
    if (session?.user?.id && session.user.role === 'student') {
      const existing = await Application.findOne({
        jobId,
        studentId: session.user.id,
      }).lean();
      hasApplied = !!existing;
    }

    const viewedAt = new Date();
    await Promise.all([
      Job.findByIdAndUpdate(jobId, { $inc: { viewCount: 1 } }),
      session?.user?.id && session.user.role === 'student'
        ? JobView.findOneAndUpdate(
            { studentId: session.user.id, jobId },
            {
              $inc: { viewCount: 1 },
              $set: {
                lastViewedAt: viewedAt,
                ...(hasApplied ? { isApplied: true } : {}),
              },
              $setOnInsert: {
                studentId: session.user.id,
                jobId,
                firstViewedAt: viewedAt,
              },
            },
            { upsert: true }
          )
        : Promise.resolve(),
    ]);

    return NextResponse.json({ job, hasApplied });
  } catch (error) {
    console.error('[GET JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    await connectDB();

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const isOwner = job.employerId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = (isAdmin ? AdminJobUpdateSchema : UpdateJobSchema).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.applicationDeadline) {
      updates.applicationDeadline = new Date(parsed.data.applicationDeadline as string);
    }
    if (parsed.data.startDate) {
      updates.startDate = new Date(parsed.data.startDate as string);
    }

    const updated = await Job.findByIdAndUpdate(jobId, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const ownerRole = await getAcademicOwnerRole(updated.employerId.toString());
    const isAcademicEvent =
      !!ownerRole && (updated.type === 'webinar' || updated.type === 'workshop');
    const shouldKeepSynced =
      isAcademicEvent && !!updated.startDate && updated.startDate > new Date() && updated.isActive;

    if (updated.ownerGoogleCalendarEventId && !shouldKeepSynced) {
      await removeCalendarEvent(updated.employerId.toString(), updated.ownerGoogleCalendarEventId);
      updated.ownerGoogleCalendarEventId = undefined;
      await updated.save();
    } else if (shouldKeepSynced) {
      await syncOwnedEventToCalendar(
        updated.employerId.toString(),
        updated._id.toString(),
        updated.title,
        updated.companyName,
        updated.startDate as Date,
        updated.type as 'webinar' | 'workshop',
        updated.applicationDeadline,
        updated.ownerGoogleCalendarEventId
      );
    }

    if (ownerRole === 'advisor' || ownerRole === 'dept_head') {
      await onEventCreated(updated.employerId.toString()).catch(console.error);
    } else {
      await onJobPosted(updated.employerId.toString()).catch(console.error);
    }

    return NextResponse.json({ message: 'Job updated successfully', job: updated });
  } catch (error) {
    console.error('[UPDATE JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    await connectDB();

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const isOwner = job.employerId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const relatedApplications = await Application.find({ jobId }).select('_id').lean();
    const applicationIds = relatedApplications.map((application) => application._id);

    const relatedAssessments = await Assessment.find({ jobId }).select('_id').lean();
    const assessmentIds = relatedAssessments.map((assessment) => assessment._id);

    const ownerRole = await getAcademicOwnerRole(job.employerId.toString());
    if (
      ownerRole &&
      (job.type === 'webinar' || job.type === 'workshop') &&
      job.ownerGoogleCalendarEventId
    ) {
      await removeCalendarEvent(job.employerId.toString(), job.ownerGoogleCalendarEventId);
    }

    await Promise.all([
      AssessmentSubmission.deleteMany({
        $or: [{ applicationId: { $in: applicationIds } }, { assessmentId: { $in: assessmentIds } }],
      }),
      AssessmentAssignment.deleteMany({
        $or: [{ applicationId: { $in: applicationIds } }, { assessmentId: { $in: assessmentIds } }],
      }),
      InterviewSession.deleteMany({ $or: [{ applicationId: { $in: applicationIds } }, { jobId }] }),
      Assessment.deleteMany({ jobId }),
      Application.deleteMany({ jobId }),
      JobView.deleteMany({ jobId }),
      Message.deleteMany({ relatedJobId: jobId }),
      Job.findByIdAndDelete(jobId),
    ]);

    if (ownerRole === 'advisor' || ownerRole === 'dept_head') {
      await onEventCreated(job.employerId.toString()).catch(console.error);
    } else {
      await onJobPosted(job.employerId.toString()).catch(console.error);
    }

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('[DELETE JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
