import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { InterviewSession } from '@/models/InterviewSession';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { syncPremiumStatus } from '@/lib/premium';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
} from '@/components/dashboard/DashboardContent';
import InterviewRoomClient from '@/components/hiring-suite/InterviewRoomClient';

async function getStudentInterviewWorkspace(userId: string, interviewId: string) {
  await connectDB();

  const [student, interview, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image university department').lean(),
    InterviewSession.findOne({ _id: interviewId, studentId: userId })
      .populate('jobId', 'title companyName')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  return {
    student,
    interview,
    chrome: { unreadNotifications, unreadMessages },
  };
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function StudentInterviewDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const { interviewId } = await params;
  const [data, premiumStatus] = await Promise.all([
    getStudentInterviewWorkspace(session.user.id, interviewId),
    syncPremiumStatus(session.user.id),
  ]);
  if (!data.interview) redirect('/student/interviews');

  const interview = data.interview;
  const job = interview.jobId as { title: string; companyName: string } | null;

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: data.student?.name ?? 'Student',
        email: data.student?.email ?? '',
        image: data.student?.image,
        userId: session.user.id,
        isPremium: premiumStatus.isPremium,
        subtitle:
          [data.student?.university, data.student?.department].filter(Boolean).join(' | ') ||
          'Student workspace',
        unreadNotifications: data.chrome.unreadNotifications,
        unreadMessages: data.chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Interview Session"
          title={interview.title}
          description="Join the live employer interview, manage your recording consent, and keep everything connected to your application tracker and calendar."
          actions={
            <>
              <ActionLink href="/student/interviews" label="Back to interviews" />
              <ActionLink href="/student/applications" label="Open applications" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Session overview"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Role', value: job?.title ?? 'Role' },
                  { label: 'Company', value: job?.companyName ?? 'Employer' },
                  { label: 'Scheduled', value: formatDateTime(interview.scheduledAt) },
                  { label: 'Recording consent', value: interview.consentStatus },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700 }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 13, color: '#FFFFFF', fontWeight: 800 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          }
        />

        <DashboardSection
          title="Interview Workspace"
          description="Use the room below to join the call, manage consent, and review the live session status."
        >
          {premiumStatus.isPremium ? (
            <InterviewRoomClient role="student" interview={JSON.parse(JSON.stringify(interview))} />
          ) : (
            <Panel
              title="Student Premium Required"
              description="This interview has been scheduled for you already. Upgrade to Student Premium to enter the room and participate in the live session."
              action={<ActionLink href="/student/premium" label="Upgrade to Student Premium" />}
            >
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid #FDE68A',
                  background: '#FFFBEB',
                  padding: '14px 16px',
                  color: '#92400E',
                  fontSize: 13,
                  lineHeight: 1.7,
                  fontWeight: 600,
                }}
              >
                Interview access is locked until Student Premium is active. Your schedule stays
                visible here, and you can join the session after upgrading.
              </div>
            </Panel>
          )}
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
