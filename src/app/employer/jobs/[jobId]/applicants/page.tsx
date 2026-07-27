// src/app/employer/jobs/[jobId]/applicants/page.tsx
// Employer applicant pipeline — with batch hiring university analytics,
// filter tabs, expandable pipeline rows, and batch status actions

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { InterviewSession } from '@/models/InterviewSession';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { getUsageSummary } from '@/lib/premium';
import { syncAssessmentAssignmentStates } from '@/lib/hiring-suite';
import mongoose from 'mongoose';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { Users, CheckCircle2, Clock3, Trophy } from 'lucide-react';
import BatchHiringPanel from './BatchHiringPanel';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
];

async function getApplicantsData(jobId: string, employerId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(employerId);
  const jid = new mongoose.Types.ObjectId(jobId);

  const pendingAssignmentIds = await AssessmentAssignment.find({
    employerId: oid,
    jobId: jid,
    status: { $in: ['assigned', 'started'] },
  })
    .select('_id')
    .lean();

  if (pendingAssignmentIds.length > 0) {
    await syncAssessmentAssignmentStates(
      pendingAssignmentIds.map((assignment) => assignment._id.toString())
    );
  }

  const [employer, job, rawApplications, interviews, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid).select('name email image companyName').lean(),
    Job.findOne({ _id: jid, employerId: oid }).lean(),
    Application.find({ jobId: jid, employerId: oid, isEventRegistration: false })
      .populate(
        'studentId',
        'name email university department cgpa skills opportunityScore resumeUrl generatedResumeUrl image yearOfStudy'
      )
      .sort({ fitScore: -1, appliedAt: -1 })
      .lean(),
    InterviewSession.find({ employerId: oid, jobId: jid })
      .select('applicationId status scheduledAt completedAt')
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!job) return null;

  const applications = rawApplications;

  const stats = {
    total: applications.length,
    shortlisted: applications.filter((a) => ['shortlisted', 'under_review'].includes(a.status))
      .length,
    interviews: applications.filter((a) => a.status === 'interview_scheduled').length,
    hired: applications.filter((a) => a.status === 'hired').length,
  };

  // ── University breakdown (always compute, not just batch hiring) ──
  const universityBreakdown: Record<
    string,
    {
      total: number;
      shortlisted: number;
      hired: number;
      avgFit: number;
      fitScores: number[];
      pipeline: Record<string, number>;
    }
  > = {};

  if (job.isBatchHiring) {
    (job.batchUniversities ?? []).forEach((uni: string) => {
      universityBreakdown[uni] = {
        total: 0,
        shortlisted: 0,
        hired: 0,
        avgFit: 0,
        fitScores: [],
        pipeline: {},
      };
    });
  }

  applications.forEach((app) => {
    const student = app.studentId as { university?: string };
    const uni = student?.university;
    if (!uni) return;
    if (!universityBreakdown[uni]) {
      universityBreakdown[uni] = {
        total: 0,
        shortlisted: 0,
        hired: 0,
        avgFit: 0,
        fitScores: [],
        pipeline: {},
      };
    }
    universityBreakdown[uni].total += 1;
    universityBreakdown[uni].pipeline[app.status] =
      (universityBreakdown[uni].pipeline[app.status] ?? 0) + 1;
    if (
      ['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(app.status)
    ) {
      universityBreakdown[uni].shortlisted += 1;
    }
    if (app.status === 'hired') universityBreakdown[uni].hired += 1;
    if (typeof app.fitScore === 'number') universityBreakdown[uni].fitScores.push(app.fitScore);
  });

  Object.keys(universityBreakdown).forEach((uni) => {
    const scores = universityBreakdown[uni].fitScores;
    universityBreakdown[uni].avgFit = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0;
  });

  const universityStats = Object.entries(universityBreakdown)
    .map(([university, data]) => ({ university, ...data }))
    .sort((a, b) => b.total - a.total);

  return {
    employer,
    job,
    applications,
    interviews,
    stats,
    universityStats,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function ApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const { jobId } = await params;
  const [data, usage] = await Promise.all([
    getApplicantsData(jobId, session.user.id),
    getUsageSummary(session.user.id),
  ]);
  if (!data) redirect('/employer/jobs');

  const { employer, job, applications, interviews, stats, universityStats, chrome } = data;
  const interviewByApplicationId = new Map(
    interviews.map((interview) => [interview.applicationId.toString(), interview])
  );

  // Serialize applications for client component
  const serializedApps = applications.map((app) => {
    const linkedInterview = interviewByApplicationId.get(app._id.toString());
    const student = app.studentId as {
      _id: mongoose.Types.ObjectId;
      name?: string;
      email?: string;
      university?: string;
      department?: string;
      cgpa?: number;
      skills?: string[];
      resumeUrl?: string;
      generatedResumeUrl?: string;
      image?: string;
      yearOfStudy?: number;
    };
    return {
      _id: app._id.toString(),
      status: app.status,
      fitScore: app.fitScore ?? 0,
      appliedAt: app.appliedAt?.toISOString() ?? '',
      resumeUrlSnapshot: app.resumeUrlSnapshot || student?.resumeUrl || '',
      generatedResumeUrlSnapshot: student?.generatedResumeUrl || '',
      student: {
        _id: student?._id?.toString() ?? '',
        name: student?.name ?? 'Unknown',
        email: student?.email ?? '',
        university: student?.university ?? '',
        department: student?.department ?? '',
        cgpa: student?.cgpa,
        skills: student?.skills ?? [],
        yearOfStudy: student?.yearOfStudy,
      },
      assessment:
        app.assessmentAssignmentId || app.assessmentId
          ? {
              assessmentId: app.assessmentId?.toString() ?? '',
              assignmentId: app.assessmentAssignmentId?.toString() ?? '',
              dueAt: app.assessmentDueAt?.toISOString() ?? null,
              submittedAt: app.assessmentSubmittedAt?.toISOString() ?? null,
              score: app.assessmentScore ?? null,
              passed: typeof app.assessmentPassed === 'boolean' ? app.assessmentPassed : null,
            }
          : null,
      interview:
        app.interviewSessionId || linkedInterview
          ? {
              sessionId:
                app.interviewSessionId?.toString() ?? linkedInterview?._id.toString() ?? '',
              scheduledAt:
                linkedInterview?.scheduledAt?.toISOString() ??
                app.interviewScheduledAt?.toISOString() ??
                null,
              completedAt: linkedInterview?.completedAt?.toISOString() ?? null,
              status: linkedInterview?.status ?? (app.interviewSessionId ? 'scheduled' : null),
              score: app.interviewScore ?? null,
            }
          : null,
    };
  });

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={{
        name: employer?.name ?? 'Employer',
        email: employer?.email ?? '',
        image: employer?.image,
        subtitle: employer?.companyName ?? 'Employer workspace',
        userId: session.user.id,
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Applicant pipeline"
          title={job.title}
          description={`${job.companyName} · ${job.city ? `${job.city} · ` : ''}${formatStatusLabel(job.locationType)} · Deadline ${formatShortDate(job.applicationDeadline?.toISOString())}`}
          actions={
            <>
              <ActionLink href={`/employer/jobs/${jobId}/edit`} label="Edit listing" />
              <ActionLink href="/employer/jobs" label="All listings" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Pipeline summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total', value: stats.total, color: '#0F172A' },
                  { label: 'Shortlisted', value: stats.shortlisted, color: '#075985' },
                  { label: 'Interviews', value: stats.interviews, color: '#92400E' },
                  { label: 'Hired', value: stats.hired, color: '#047857' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: s.color,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          }
        />

        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Total applicants"
              value={formatCompactNumber(stats.total)}
              Icon={Users}
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#22D3EE"
            />
            <StatCard
              label="Interviews scheduled"
              value={formatCompactNumber(stats.interviews)}
              Icon={Clock3}
              accent="#F59E0B"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(stats.hired)}
              Icon={Trophy}
              accent="#10B981"
            />
          </div>
        </section>

        {/* ── Batch hiring panel (client component with all interactivity) ── */}
        <BatchHiringPanel
          jobId={jobId}
          isBatchHiring={job.isBatchHiring ?? false}
          batchUniversities={job.batchUniversities ?? []}
          applications={serializedApps}
          universityStats={universityStats.map((u) => ({
            university: u.university,
            total: u.total,
            shortlisted: u.shortlisted,
            hired: u.hired,
            avgFit: u.avgFit,
            pipeline: u.pipeline,
          }))}
          totalApplications={stats.total}
          usage={JSON.parse(JSON.stringify(usage))}
        />

        <style>{`
          @media (max-width: 960px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
