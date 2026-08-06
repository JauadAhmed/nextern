import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { InterviewSession } from '@/models/InterviewSession';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { syncPremiumStatus } from '@/lib/premium';
import DashboardShell from '@/components/dashboard/DashboardShell';
import PaginatedCollection from '@/components/ui/PaginatedCollection';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
  StatCard,
  formatCompactNumber,
} from '@/components/dashboard/DashboardContent';
import { CalendarClock, ClipboardCheck, MonitorPlay, Video } from 'lucide-react';
import Link from 'next/link';

async function getInterviewPageData(userId: string, jobId?: string) {
  await connectDB();

  const query: Record<string, unknown> = { employerId: userId };
  if (jobId) query.jobId = jobId;

  const [employer, interviews, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image companyName').lean(),
    InterviewSession.find(query)
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email university department')
      .sort({ scheduledAt: 1 })
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  const serializedInterviews = interviews.map((interview) => ({
    _id: interview._id.toString(),
    title: interview.title,
    status: interview.status,
    mode: interview.mode,
    scheduledAt: interview.scheduledAt.toISOString(),
    durationMinutes: interview.durationMinutes,
    consentStatus: interview.consentStatus,
    recordingStatus: interview.recordingStatus,
    scorecard: interview.scorecard,
    job: interview.jobId
      ? {
          _id: (interview.jobId as { _id: string })._id.toString(),
          title: (interview.jobId as { title: string }).title,
          companyName: (interview.jobId as { companyName: string }).companyName,
        }
      : null,
    student: interview.studentId
      ? {
          _id: (interview.studentId as { _id: string })._id.toString(),
          name: (interview.studentId as { name: string }).name,
          university: (interview.studentId as { university?: string }).university ?? '',
          department: (interview.studentId as { department?: string }).department ?? '',
        }
      : null,
  }));

  const stats = {
    total: serializedInterviews.length,
    scheduled: serializedInterviews.filter((interview) => interview.status === 'scheduled').length,
    live: serializedInterviews.filter((interview) => interview.status === 'live').length,
    completed: serializedInterviews.filter((interview) => interview.status === 'completed').length,
  };

  return {
    employer,
    interviews: serializedInterviews,
    stats,
    chrome: { unreadNotifications, unreadMessages },
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function EmployerInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const params = await searchParams;
  const [data, premiumStatus] = await Promise.all([
    getInterviewPageData(session.user.id, params.jobId),
    syncPremiumStatus(session.user.id),
  ]);

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{
        name: data.employer?.name ?? 'Employer',
        email: data.employer?.email ?? '',
        image: data.employer?.image,
        subtitle: data.employer?.companyName ?? 'Employer workspace',
        userId: session.user.id,
        isPremium: premiumStatus.isPremium,
        unreadNotifications: data.chrome.unreadNotifications,
        unreadMessages: data.chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Hiring Suite"
          title="Run live interviews with notes, scorecards, screen sharing, and consent tracking"
          description="Every scheduled session lives in one interview console with direct join links, recording consent, evaluation notes, and final recommendation fields for the hiring team."
          actions={
            <>
              <ActionLink href="/employer/assessments" label="Open assessments" />
              <ActionLink href="/employer/jobs" label="Back to jobs" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Interview summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total', value: data.stats.total, color: '#FFFFFF' },
                  { label: 'Scheduled', value: data.stats.scheduled, color: '#BAE6FD' },
                  { label: 'Live', value: data.stats.live, color: '#FDE68A' },
                  { label: 'Completed', value: data.stats.completed, color: '#A7F3D0' },
                ].map((stat) => (
                  <div
                    key={stat.label}
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
                        color: stat.color,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                      {stat.label}
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
            className="employer-interview-stats-grid"
          >
            <StatCard label="Sessions" value={formatCompactNumber(data.stats.total)} Icon={Video} />
            <StatCard
              label="Upcoming"
              value={formatCompactNumber(data.stats.scheduled)}
              Icon={CalendarClock}
              accent="#22D3EE"
            />
            <StatCard
              label="Live now"
              value={formatCompactNumber(data.stats.live)}
              Icon={MonitorPlay}
              accent="#F59E0B"
            />
            <StatCard
              label="Completed"
              value={formatCompactNumber(data.stats.completed)}
              Icon={ClipboardCheck}
              accent="#10B981"
            />
          </div>
        </section>

        <DashboardSection
          title="Interview Schedule"
          description="Open a session to join the Agora room, capture notes, update the scorecard, or attach the final recording after consent."
        >
          <div style={{ display: 'grid', gap: 14 }}>
            {data.interviews.length === 0 ? (
              <div
                style={{
                  borderRadius: 20,
                  border: '1px dashed #CBD5E1',
                  background: '#F8FAFC',
                  padding: '32px 28px',
                  color: '#64748B',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                No interviews scheduled yet. Use the applicant pipeline batch actions to schedule a
                live evaluation and it will appear here automatically.
              </div>
            ) : (
              <PaginatedCollection itemLabel="interviews" style={{ display: 'grid', gap: 14 }}>
                {data.interviews.map((interview) => (
                  <div
                    key={interview._id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 20,
                      border: '1px solid #D9E2EC',
                      boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                      padding: 18,
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 900,
                            color: '#0F172A',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {interview.title}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {interview.student?.name ?? 'Candidate'} •{' '}
                          {interview.job?.title ?? 'Role'}
                        </div>
                      </div>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '6px 10px',
                          background: '#F5F3FF',
                          border: '1px solid #DDD6FE',
                          color: '#7C3AED',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {interview.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 18,
                        flexWrap: 'wrap',
                        fontSize: 12,
                        color: '#64748B',
                      }}
                    >
                      <span>{formatDateTime(interview.scheduledAt)}</span>
                      <span>{interview.durationMinutes} min</span>
                      <span>{interview.mode === 'panel' ? 'Panel interview' : 'One-on-one'}</span>
                      <span>Recording consent: {interview.consentStatus}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Link
                        href={`/employer/interviews/${interview._id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#0F172A',
                          color: '#FFFFFF',
                          borderRadius: 12,
                          padding: '10px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          textDecoration: 'none',
                        }}
                      >
                        Open session
                      </Link>
                    </div>
                  </div>
                ))}
              </PaginatedCollection>
            )}
          </div>
        </DashboardSection>

        <style>{`
          @media (max-width: 960px) {
            .employer-interview-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
