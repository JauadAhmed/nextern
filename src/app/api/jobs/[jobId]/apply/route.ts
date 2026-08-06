// src/app/api/jobs/[jobId]/apply/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import { Application } from '@/models/Application';
import { User } from '@/models/User';
import { ApplyJobSchema } from '@/lib/validations';
import { onJobApplied } from '@/lib/events';
import { analyzeSkillGap } from '@/lib/gemini';
import { checkFeatureAccess } from '@/lib/premium';
import { FeatureUsage } from '@/models/FeatureUsage';
import {
  removeCalendarEvent,
  syncJobDeadlineToCalendar,
  syncEventRegistrationToCalendar,
} from '@/lib/calendar';
import mongoose from 'mongoose';

type Params = { params: Promise<{ jobId: string }> };

// POST /api/jobs/[jobId]/apply
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can apply to jobs' }, { status: 403 });
    }

    const { jobId } = await params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    await connectDB();

    const job = await Job.findById(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json(
        { error: 'This listing is no longer accepting applications' },
        { status: 400 }
      );
    }

    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Duplicate check
    const existing = await Application.findOne({
      jobId,
      studentId: session.user.id,
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 });
    }

    const body = await req.json();
    const parsed = ApplyJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // USER SNAPSHOT (BOTH VERSIONS COMBINED)
    const student = await User.findById(session.user.id)
      .select('name resumeUrl generatedResumeUrl skills cgpa completedCourses')
      .lean();

    const isEvent = job.type === 'webinar' || job.type === 'workshop';

    // CREATE APPLICATION (MERGED SCHEMA)
    const application = await Application.create({
      studentId: session.user.id,
      jobId,
      employerId: job.employerId,
      coverLetter: parsed.data.coverLetter,

      // legacy + new snapshot support (KEEP BOTH)
      resumeUrlSnapshot: student?.resumeUrl ?? '',
      generatedResumeUrlSnapshot: student?.generatedResumeUrl ?? '',

      isEventRegistration: isEvent,
      status: 'applied',
      appliedAt: new Date(),

      statusHistory: [
        {
          status: 'applied',
          changedAt: new Date(),
          changedBy: session.user.id,
        },
      ],
    });

    const appliedAt = new Date();

    // JOB METRICS + VIEW TRACKING (FROM FIRST VERSION)
    const [, jobView] = await Promise.all([
      Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } }),

      JobView.findOneAndUpdate(
        { studentId: session.user.id, jobId },
        {
          $set: {
            isApplied: true,
            lastViewedAt: appliedAt,
          },
          $setOnInsert: {
            studentId: session.user.id,
            jobId,
            viewCount: 0,
            firstViewedAt: appliedAt,
          },
        },
        { upsert: true, new: true }
      ),
    ]);

    if (jobView?.googleCalendarEventId) {
      await removeCalendarEvent(session.user.id, jobView.googleCalendarEventId).catch((error) => {
        console.error('[REMOVE SAVED CALENDAR EVENT ON APPLY ERROR]', error);
      });

      await JobView.findByIdAndUpdate(jobView._id, {
        $unset: { googleCalendarEventId: '' },
      }).catch((error) => {
        console.error('[CLEAR SAVED CALENDAR EVENT ID ON APPLY ERROR]', error);
      });
    }

    await onJobApplied(session.user.id, jobId).catch(() => {});

    // ── Calendar sync ────────────────────────────────────────────────────
    try {
      if (isEvent && job.startDate) {
        // Webinar/workshop — sync the event date
        await syncEventRegistrationToCalendar(
          session.user.id,
          application._id.toString(),
          job.title,
          job.companyName,
          job.startDate
        );
      } else if (!isEvent && job.applicationDeadline) {
        // Regular job — sync the deadline
        await syncJobDeadlineToCalendar(
          session.user.id,
          application._id.toString(),
          job.title,
          job.companyName,
          job.applicationDeadline
        );
      }
    } catch (calErr) {
      console.error('[CALENDAR SYNC ON APPLY]', calErr);
      // non-blocking — never crash the apply response
    }

    // SKILL GAP ANALYSIS (FROM FIRST VERSION - OPTIONAL FEATURE)
    let appliedFitScore: number | null = null;

    try {
      const access = await checkFeatureAccess(session.user.id, 'skillGapAnalysis');

      if (access.allowed && student) {
        const result = await analyzeSkillGap({
          studentSkills: student.skills ?? [],
          studentCGPA: student.cgpa ?? 0,
          completedCourses: student.completedCourses ?? [],
          jobRequiredSkills: job.requiredSkills ?? [],
          jobMinCGPA: job.minimumCGPA ?? 0,
          jobRequiredCourses: job.requiredCourses ?? [],
          jobExperienceExpectations: job.experienceExpectations ?? '',
          jobTitle: job.title,
          companyName: job.companyName,
        });

        appliedFitScore = result.data.fitScore;

        await Application.findByIdAndUpdate(application._id, {
          fitScore: result.data.fitScore,
          hardGaps: result.data.hardGaps,
          softGaps: result.data.softGaps,
          metRequirements: result.data.metRequirements,
          suggestedPath: result.data.suggestedPath,
          fitSummary: result.data.summary,
          fitScoreComputedAt: new Date(),
          fitAnalysisMeta: result.meta,
        });

        await FeatureUsage.create({
          userId: session.user.id,
          feature: 'skill_gap_analysis',
          metadata: {
            jobId,
            source: 'application',
            mode: result.meta.mode,
          },
        });
      }
    } catch (analysisError) {
      console.error('[AUTO SKILL GAP ERROR]', analysisError);
    }

    return NextResponse.json(
      {
        message: 'Application submitted successfully',
        application,
        fitScore: appliedFitScore,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 });
    }

    console.error('[APPLY JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/jobs/[jobId]/apply (withdraw application)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    await connectDB();

    const application = await Application.findOne({
      jobId,
      studentId: session.user.id,
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (['hired', 'rejected'].includes(application.status)) {
      return NextResponse.json(
        { error: 'Cannot withdraw from a finalised application' },
        { status: 400 }
      );
    }

    await Application.findByIdAndUpdate(application._id, {
      status: 'withdrawn',
      isWithdrawn: true,
      $push: {
        statusHistory: {
          status: 'withdrawn',
          changedAt: new Date(),
          changedBy: session.user.id,
        },
      },
    });

    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationCount: -1 },
    });

    return NextResponse.json({
      message: 'Application withdrawn successfully',
    });
  } catch (error) {
    console.error('[WITHDRAW ERROR]', error);
    return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 });
  }
}
