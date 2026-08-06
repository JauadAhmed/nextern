// src/app/api/notifications/deadline-check/route.ts
// GET /api/notifications/deadline-check
//
// This endpoint scans all active job applications where:
//   - The job's applicationDeadline is 1, 2, or 3 days away
//   - The student has not yet received a reminder for that job+day combo
//
// Call this from Vercel Cron (vercel.json) or any external scheduler.
// Add to vercel.json:
// {
//   "crons": [{ "path": "/api/notifications/deadline-check", "schedule": "0 9 * * *" }]
// }
//
// The cron-secret header protects it from public access.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { JobView } from '@/models/JobView';
import { Notification } from '@/models/Notification';
import { notifyDeadlineReminder } from '@/lib/notify';
import mongoose from 'mongoose';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

const REMINDER_WINDOWS = [
  { key: '3d', maxHours: 72, daysLeft: 3 },
  { key: '2d', maxHours: 48, daysLeft: 2 },
  { key: '24h', maxHours: 24, daysLeft: 1 },
] as const;

function resolveReminderWindow(deadline: Date, now: Date) {
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return null;
  return REMINDER_WINDOWS.find((window) => hoursLeft <= window.maxHours) ?? null;
}

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const now = new Date();
    const fired: string[] = [];
    const skipped: string[] = [];

    // Find all saved jobs with upcoming deadlines (within 3 days)
    const cutoff = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days out

    const savedJobs = await JobView.find({
      isSaved: true,
    })
      .populate('jobId', 'title companyName applicationDeadline isActive')
      .lean();

    for (const savedJob of savedJobs) {
      const job = savedJob.jobId as unknown as {
        _id: mongoose.Types.ObjectId;
        title: string;
        companyName: string;
        applicationDeadline?: Date;
        isActive?: boolean;
      } | null;

      if (!job?.applicationDeadline) continue;
      if (!job.isActive) continue;

      const deadline = new Date(job.applicationDeadline);
      if (deadline <= now || deadline > cutoff) continue;

      const reminderWindow = resolveReminderWindow(deadline, now);
      if (!reminderWindow) continue;

      const studentId = savedJob.studentId.toString();
      const jobId = job._id.toString();

      // Check if we already sent a reminder for this (student, job, daysLeft) combo
      const alreadySent = await Notification.exists({
        userId: studentId,
        type: 'deadline_reminder',
        'meta.jobId': jobId,
        'meta.reminderWindow': reminderWindow.key,
      });

      if (alreadySent) {
        skipped.push(`${studentId}:${jobId}:${reminderWindow.key}`);
        continue;
      }

      await notifyDeadlineReminder(
        studentId,
        job.title,
        job.companyName,
        jobId,
        deadline,
        reminderWindow.daysLeft,
        reminderWindow.key
      );

      fired.push(`${studentId}:${jobId}:${reminderWindow.key}`);
    }

    return NextResponse.json({
      message: 'Deadline check complete',
      fired: fired.length,
      skipped: skipped.length,
      details: { fired, skipped },
    });
  } catch (err) {
    console.error('[DEADLINE CHECK ERROR]', err);
    return NextResponse.json({ error: 'Deadline check failed' }, { status: 500 });
  }
}
