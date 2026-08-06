// src/app/api/applications/route.ts
// GET   /api/applications              — student: own apps | employer: all for their jobs
// PATCH /api/applications?id=[appId]   — employer updates application status

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { UpdateApplicationStatusSchema } from '@/lib/validations';
import { onApplicationStatusChangedForApplication } from '@/lib/events';
import { Job } from '@/models/Job';
import { syncInterviewToCalendar, removeCalendarEvent } from '@/lib/calendar';
import mongoose from 'mongoose';
import { parsePaginationParams } from '@/lib/pagination';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const employerIdParam = searchParams.get('employerId');
    const { page, limit, skip } = parsePaginationParams(searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });

    await connectDB();

    const query: Record<string, unknown> = {};

    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    if (session.user.role === 'student') {
      query.studentId = session.user.id;
      query.isWithdrawn = { $ne: true };
      if (employerIdParam && mongoose.Types.ObjectId.isValid(employerIdParam)) {
        query.employerId = new mongoose.Types.ObjectId(employerIdParam);
      }
    } else if (session.user.role === 'employer') {
      query.employerId = session.user.id;
      if (jobId) query.jobId = jobId;
    } else if (session.user.role === 'admin') {
      if (jobId) query.jobId = jobId;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('jobId', 'title type companyName city locationType applicationDeadline isActive')
        .populate(
          'studentId',
          'name email university department cgpa skills opportunityScore resumeUrl image yearOfStudy'
        )
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
    ]);

    return NextResponse.json({
      applications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET APPLICATIONS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('id');
    if (!appId || !mongoose.Types.ObjectId.isValid(appId)) {
      return NextResponse.json({ error: 'Valid application ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch application
    const application = await Application.findById(appId).lean();
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (application.employerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const previousStatus = application.status;
    const newStatus = parsed.data.status;

    const updated = await Application.findByIdAndUpdate(
      appId,
      {
        $set: { status: newStatus },
        $push: {
          statusHistory: {
            status: newStatus,
            changedAt: new Date(),
            changedBy: session.user.id,
            note: parsed.data.note,
          },
        },
      },
      { new: true }
    );

    // ── Calendar sync on status change ────────────────────────────────────
    if (newStatus !== previousStatus) {
      await onApplicationStatusChangedForApplication(appId).catch(() => {});

      // Handle calendar events based on new status
      try {
        if (newStatus === 'interview_scheduled' && updated?.interviewScheduledAt) {
          const job = await Job.findById(application.jobId).select('title companyName').lean();

          if (job) {
            await syncInterviewToCalendar(
              application.studentId.toString(),
              appId,
              job.title,
              job.companyName,
              updated.interviewScheduledAt,
              updated.googleCalendarEventId // pass existing ID to update if rescheduled
            );
          }
        } else if (newStatus === 'withdrawn' || newStatus === 'rejected') {
          // Remove calendar event when application ends
          if (updated?.googleCalendarEventId) {
            await removeCalendarEvent(
              application.studentId.toString(),
              updated.googleCalendarEventId
            );
            await Application.findByIdAndUpdate(appId, {
              $unset: { googleCalendarEventId: '' },
            });
          }
        }
      } catch (calErr) {
        console.error('[CALENDAR SYNC ON STATUS CHANGE]', calErr);
        // non-blocking — never crash the response
      }
    }

    return NextResponse.json({ message: 'Status updated successfully', application: updated });
  } catch (error) {
    console.error('[UPDATE APPLICATION ERROR]', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
