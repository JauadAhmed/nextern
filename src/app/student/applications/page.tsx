// src/app/student/applications/page.tsx
// Student application tracker — uses DashboardShell
// Tabs: Applications | Events

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  formatCompactNumber,
} from '@/components/dashboard/DashboardContent';
import { BriefcaseBusiness, CheckCircle2, Trophy, CalendarDays } from 'lucide-react';
import ApplicationsTabs from './ApplicationsTabs';

async function getApplicationsData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [student, allApplications, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid).select('name email image university department').lean(),
    Application.find({ studentId: oid })
      .populate(
        'jobId',
        'title type companyName city locationType applicationDeadline isActive employerId'
      )
      .sort({ appliedAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  // Separate job applications from event registrations
  const applications = allApplications.filter((a) => !a.isEventRegistration);
  const events = allApplications.filter((a) => a.isEventRegistration);

  const withFit = applications.filter((a) => typeof a.fitScore === 'number');
  const stats = {
    totalApps: applications.length,
    totalEvents: events.length,
    shortlisted: applications.filter((a) =>
      ['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(a.status)
    ).length,
    hired: applications.filter((a) => a.status === 'hired').length,
    avgFit: withFit.length
      ? Math.round(withFit.reduce((s, a) => s + (a.fitScore ?? 0), 0) / withFit.length)
      : 0,
  };

  // Serialize for client component
  const serialize = (app: (typeof allApplications)[0]) => {
    const job = app.jobId as {
      _id: string;
      title: string;
      type: string;
      companyName: string;
      city?: string;
      locationType: string;
      applicationDeadline?: Date;
      employerId?: { _id: string } | string;
    } | null;
    return {
      _id: app._id.toString(),
      status: app.status,
      coverLetter: app.coverLetter ?? null,
      resumeUrlSnapshot: app.resumeUrlSnapshot ?? null,
      appliedAt: app.appliedAt?.toISOString() ?? new Date().toISOString(),
      fitScore: app.fitScore ?? null,
      assessmentAssignmentId: app.assessmentAssignmentId?.toString() ?? null,
      assessmentDueAt: app.assessmentDueAt?.toISOString() ?? null,
      assessmentSubmittedAt: app.assessmentSubmittedAt?.toISOString() ?? null,
      interviewSessionId: app.interviewSessionId?.toString() ?? null,
      interviewScheduledAt: app.interviewScheduledAt?.toISOString() ?? null,
      isEventRegistration: app.isEventRegistration,
      statusHistory: (app.statusHistory ?? []).map((h: { status: string; changedAt?: Date }) => ({
        status: h.status,
        changedAt: (h.changedAt as Date)?.toISOString() ?? new Date().toISOString(),
      })),
      job: job
        ? {
            _id: job._id.toString(),
            title: job.title,
            type: job.type,
            companyName: job.companyName,
            city: job.city ?? null,
            locationType: job.locationType,
            applicationDeadline: job.applicationDeadline?.toISOString() ?? null,
            employerId:
              typeof job.employerId === 'object' && job.employerId
                ? (job.employerId as { _id: string })._id?.toString()
                : (job.employerId?.toString() ?? null),
          }
        : null,
    };
  };

  return {
    student,
    applications: applications.map(serialize),
    events: events.map(serialize),
    stats,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function StudentApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const { student, applications, events, stats, chrome } = await getApplicationsData(
    session.user.id
  );

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: student?.name ?? 'Student',
        email: student?.email ?? '',
        image: student?.image,
        userId: session.user.id,
        subtitle:
          [student?.university, student?.department].filter(Boolean).join(' | ') ||
          'Student workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Activity tracker"
          title="Your applications & events"
          description="Track every job application and event registration in one place. Status updates in real time as employers review your profile."
          actions={
            <>
              <ActionLink href="/student/jobs" label="Browse more jobs" />
              <ActionLink href="/student/dashboard" label="Back to dashboard" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Applications', value: stats.totalApps, color: '#0F172A' },
                  { label: 'Events', value: stats.totalEvents, color: '#075985' },
                  { label: 'Shortlisted', value: stats.shortlisted, color: '#047857' },
                  { label: 'Avg Fit', value: `${stats.avgFit}%`, color: '#92400E' },
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
                        fontSize: 22,
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

        {/* Stat cards */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Job applications"
              value={formatCompactNumber(stats.totalApps)}
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Events registered"
              value={formatCompactNumber(stats.totalEvents)}
              Icon={CalendarDays}
              accent="#22D3EE"
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(stats.hired)}
              Icon={Trophy}
              accent="#F59E0B"
            />
          </div>
        </section>

        {/* Tabbed content — client component */}
        <DashboardSection
          id="activity"
          title="Activity"
          description="Switch between job applications and event registrations."
        >
          <ApplicationsTabs applications={applications} events={events} />
        </DashboardSection>

        <style>{`
          @media (max-width: 960px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
