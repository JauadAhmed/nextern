import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import { Notification } from '@/models/Notification';
import { notifyJobMatch } from '@/lib/notify';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

const LOOKBACK_DAYS = 7;
const MAX_NOTIFICATIONS_PER_STUDENT = 3;

type LeanStudent = {
  _id: mongoose.Types.ObjectId;
  skills?: string[];
  department?: string;
  yearOfStudy?: number;
  cgpa?: number;
  notificationPreferences?: Record<string, boolean>;
};

type LeanJob = {
  _id: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  type?: string;
  requiredSkills?: string[];
  targetDepartments?: string[];
  targetYears?: number[];
  minimumCGPA?: number;
  applicationDeadline?: Date;
  startDate?: Date;
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function scoreJobMatch(student: LeanStudent, job: LeanJob) {
  const studentSkills = new Set((student.skills ?? []).map(normalizeToken));
  const requiredSkills = (job.requiredSkills ?? []).map(normalizeToken).filter(Boolean);
  const matchedSkills = requiredSkills.filter((skill) => studentSkills.has(skill)).length;
  const skillScore =
    requiredSkills.length > 0 ? Math.round((matchedSkills / requiredSkills.length) * 70) : 25;

  const departmentScore =
    !student.department || (job.targetDepartments ?? []).length === 0
      ? 15
      : (job.targetDepartments ?? []).some(
            (department) => normalizeToken(department) === normalizeToken(student.department ?? '')
          )
        ? 15
        : 0;

  const yearScore =
    !student.yearOfStudy || (job.targetYears ?? []).length === 0
      ? 10
      : (job.targetYears ?? []).includes(student.yearOfStudy)
        ? 10
        : 0;

  const cgpaScore =
    !job.minimumCGPA || job.minimumCGPA <= 0 ? 5 : (student.cgpa ?? 0) >= job.minimumCGPA ? 5 : 0;

  return Math.min(100, skillScore + departmentScore + yearScore + cgpaScore);
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const now = new Date();
    const recentCutoff = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [students, jobs, applications, recentNotifications] = await Promise.all([
      User.find({ role: 'student', isVerified: true })
        .select('skills department yearOfStudy cgpa notificationPreferences')
        .lean() as Promise<LeanStudent[]>,
      Job.find({
        isActive: true,
        $or: [
          { applicationDeadline: { $gte: now } },
          {
            type: { $in: ['webinar', 'workshop'] },
            startDate: { $gte: now },
          },
        ],
      })
        .select(
          'title companyName type requiredSkills targetDepartments targetYears minimumCGPA applicationDeadline startDate'
        )
        .lean() as Promise<LeanJob[]>,
      Application.find({
        isWithdrawn: { $ne: true },
      })
        .select('studentId jobId')
        .lean(),
      Notification.find({
        type: 'job_match',
        createdAt: { $gte: recentCutoff },
      })
        .select('userId meta.jobId')
        .lean(),
    ]);

    const appliedByStudent = new Map<string, Set<string>>();
    for (const application of applications) {
      const studentId = application.studentId.toString();
      const jobId = application.jobId.toString();
      if (!appliedByStudent.has(studentId)) {
        appliedByStudent.set(studentId, new Set<string>());
      }
      appliedByStudent.get(studentId)?.add(jobId);
    }

    const notifiedByStudent = new Map<string, Set<string>>();
    for (const notification of recentNotifications) {
      const studentId = notification.userId.toString();
      const jobId =
        typeof (notification.meta as { jobId?: unknown } | undefined)?.jobId === 'string'
          ? ((notification.meta as { jobId: string }).jobId ?? '')
          : '';

      if (!jobId) continue;
      if (!notifiedByStudent.has(studentId)) {
        notifiedByStudent.set(studentId, new Set<string>());
      }
      notifiedByStudent.get(studentId)?.add(jobId);
    }

    let notificationsSent = 0;

    for (const student of students) {
      const studentId = student._id.toString();

      if (student.notificationPreferences?.job_matches === false) continue;

      const appliedJobIds = appliedByStudent.get(studentId) ?? new Set<string>();
      const notifiedJobIds = notifiedByStudent.get(studentId) ?? new Set<string>();

      const candidates = jobs
        .filter(
          (job) => !appliedJobIds.has(job._id.toString()) && !notifiedJobIds.has(job._id.toString())
        )
        .map((job) => ({
          job,
          fitScore: scoreJobMatch(student, job),
        }))
        .filter((item) => item.fitScore >= 70)
        .sort((left, right) => right.fitScore - left.fitScore)
        .slice(0, MAX_NOTIFICATIONS_PER_STUDENT);

      for (const candidate of candidates) {
        await notifyJobMatch(
          studentId,
          candidate.job.title,
          candidate.job.companyName,
          candidate.job._id.toString(),
          candidate.fitScore
        );
        notificationsSent++;
      }
    }

    return NextResponse.json({
      message: 'Job match notification sweep complete',
      notificationsSent,
      studentsChecked: students.length,
      jobsChecked: jobs.length,
    });
  } catch (error) {
    console.error('[JOB MATCH CHECK ERROR]', error);
    return NextResponse.json({ error: 'Job match notification sweep failed' }, { status: 500 });
  }
}
