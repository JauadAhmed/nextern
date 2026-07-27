import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { Assessment } from '@/models/Assessment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { syncAssessmentAssignmentState } from '@/lib/hiring-suite';
import { formatDhakaDateTime } from '@/lib/datetime';
import { isCodeExecutionConfigured } from '@/lib/judge0';
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
import StudentAssessmentClient from './StudentAssessmentClient';

async function getAssessmentWorkspace(userId: string, assignmentId: string) {
  await connectDB();
  await syncAssessmentAssignmentState(assignmentId);

  const [student, assignment, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image university department').lean(),
    AssessmentAssignment.findOne({ _id: assignmentId, studentId: userId })
      .populate('jobId', 'title companyName')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  if (!assignment) return null;

  const [assessment, submission] = await Promise.all([
    Assessment.findById(assignment.assessmentId).lean(),
    AssessmentSubmission.findOne({ assignmentId }).lean(),
  ]);

  if (!assessment) return null;

  return {
    student,
    assignment,
    assessment,
    submission,
    chrome: { unreadNotifications, unreadMessages },
  };
}

export default async function StudentAssessmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const { assignmentId } = await params;
  const [data, premiumStatus] = await Promise.all([
    getAssessmentWorkspace(session.user.id, assignmentId),
    syncPremiumStatus(session.user.id),
  ]);
  if (!data) redirect('/student/assessments');

  const job = data.assignment.jobId as { title: string; companyName: string } | null;
  const codingExecutionEnabled = isCodeExecutionConfigured();

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
          eyebrow="Assessment Workspace"
          title={data.assessment.title}
          description="Complete your employer assessment inside Nextern. Timed sessions can auto-submit, coding tasks run through the live execution engine, and your graded results stay linked to the application tracker."
          actions={
            <>
              <ActionLink href="/student/assessments" label="Back to assessments" />
              <ActionLink href="/student/applications" label="Open applications" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Session summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Role', value: job?.title ?? 'Role' },
                  { label: 'Company', value: job?.companyName ?? 'Employer' },
                  {
                    label: 'Due',
                    value: formatDhakaDateTime(data.assignment.dueAt ?? data.assessment.dueAt),
                  },
                  { label: 'Duration', value: `${data.assessment.durationMinutes} min` },
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
          title="Assessment"
          description="Use the workspace below to start, complete, and review this evaluation."
        >
          {premiumStatus.isPremium ? (
            <StudentAssessmentClient
              assignment={JSON.parse(JSON.stringify(data.assignment))}
              assessment={JSON.parse(JSON.stringify(data.assessment))}
              submission={JSON.parse(JSON.stringify(data.submission))}
              codingExecutionEnabled={codingExecutionEnabled}
            />
          ) : (
            <Panel
              title="Student Premium Required"
              description="This assessment has already been assigned to you. Upgrade to Student Premium to start, complete, and submit it from this workspace."
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
                Assessment access is locked until Student Premium is active. Your assignment and
                deadline remain saved here, and you can return to start it after upgrading.
              </div>
            </Panel>
          )}
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
