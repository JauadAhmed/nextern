import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { notifyHostedEventReminder, notifyRegisteredEventReminder } from '@/lib/notify';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

const REMINDER_WINDOWS = [
  { key: '3d', maxHours: 72, daysLeft: 3 },
  { key: '2d', maxHours: 48, daysLeft: 2 },
  { key: '24h', maxHours: 24, daysLeft: 1 },
] as const;

function resolveReminderWindow(targetDate: Date, now: Date) {
  const hoursLeft = (targetDate.getTime() - now.getTime()) / 3600000;
  if (hoursLeft <= 0) return null;
  return REMINDER_WINDOWS.find((window) => hoursLeft <= window.maxHours) ?? null;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const now = new Date();
    const cutoff = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const jobs = await Job.find({
      isActive: true,
      $or: [
        { applicationDeadline: { $gt: now, $lte: cutoff } },
        {
          type: { $in: ['webinar', 'workshop'] },
          startDate: { $gt: now, $lte: cutoff },
        },
      ],
    })
      .select('title companyName employerId applicationDeadline startDate type')
      .lean();

    const ownerIds = [...new Set(jobs.map((job) => job.employerId.toString()))];
    const owners = await User.find({ _id: { $in: ownerIds } })
      .select('role')
      .lean();
    const ownerRoleMap = new Map(
      owners
        .filter(
          (owner) =>
            owner.role === 'advisor' || owner.role === 'dept_head' || owner.role === 'employer'
        )
        .map(
          (owner) =>
            [owner._id.toString(), owner.role as 'advisor' | 'dept_head' | 'employer'] as const
        )
    );

    let fired = 0;
    let skipped = 0;

    for (const job of jobs) {
      const ownerRole = ownerRoleMap.get(job.employerId.toString());
      if (!ownerRole) continue;

      const reminders = [
        job.applicationDeadline
          ? {
              kind: 'registration_deadline' as const,
              targetDate: new Date(job.applicationDeadline),
              preferenceKey: 'deadline_reminders',
            }
          : null,
        job.startDate
          ? {
              kind: 'event_start' as const,
              targetDate: new Date(job.startDate),
              preferenceKey: 'event_reminders',
            }
          : null,
      ].filter(Boolean) as Array<{
        kind: 'registration_deadline' | 'event_start';
        targetDate: Date;
        preferenceKey: string;
      }>;

      for (const reminder of reminders) {
        const reminderWindow = resolveReminderWindow(reminder.targetDate, now);
        if (!reminderWindow) continue;

        const alreadySent = await Notification.exists({
          userId: job.employerId,
          type: 'deadline_reminder',
          'meta.jobId': job._id.toString(),
          'meta.reminderKind': reminder.kind,
          'meta.reminderWindow': reminderWindow.key,
        });

        if (alreadySent) {
          skipped++;
          continue;
        }

        await notifyHostedEventReminder({
          ownerId: job.employerId.toString(),
          ownerRole,
          eventTitle: job.title,
          organizationName: job.companyName,
          jobId: job._id.toString(),
          reminderDate: reminder.targetDate,
          daysLeft: reminderWindow.daysLeft,
          reminderWindow: reminderWindow.key,
          kind: reminder.kind,
          opportunityType: job.type,
        });
        fired++;

        if (reminder.kind !== 'event_start' || (job.type !== 'webinar' && job.type !== 'workshop'))
          continue;

        const registrations = await Application.find({
          jobId: job._id,
          isEventRegistration: true,
          status: { $ne: 'withdrawn' },
        })
          .select('studentId')
          .lean();

        for (const registration of registrations) {
          const studentAlreadySent = await Notification.exists({
            userId: registration.studentId,
            type: 'deadline_reminder',
            'meta.jobId': job._id.toString(),
            'meta.reminderKind': 'registered_event_start',
            'meta.reminderWindow': reminderWindow.key,
          });

          if (studentAlreadySent) {
            skipped++;
            continue;
          }

          await notifyRegisteredEventReminder({
            studentId: registration.studentId.toString(),
            eventTitle: job.title,
            organizationName: job.companyName,
            jobId: job._id.toString(),
            eventDate: reminder.targetDate,
            daysLeft: reminderWindow.daysLeft,
            reminderWindow: reminderWindow.key,
          });
          fired++;
        }
      }
    }

    return NextResponse.json({
      message: 'Academic event reminders complete',
      fired,
      skipped,
    });
  } catch (error) {
    console.error('[ACADEMIC EVENT REMINDERS ERROR]', error);
    return NextResponse.json({ error: 'Academic event reminders failed' }, { status: 500 });
  }
}
