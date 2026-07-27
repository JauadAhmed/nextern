import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
  StatCard,
  formatCompactNumber,
} from '@/components/dashboard/DashboardContent';
import { ClipboardCheck, Clock3, FileText, Trophy } from 'lucide-react';
import Link from 'next/link';
import { formatAssessmentAssignmentStatus } from '@/lib/hiring-suite-shared';
import { syncAssessmentAssignmentStates } from '@/lib/hiring-suite';
import { formatDhakaDateTime } from '@/lib/datetime';

async function getStudentAssessmentData(userId: string) {
  await connectDB();

  const pendingAssignmentIds = await AssessmentAssignment.find({
    studentId: userId,
    status: { $in: ['assigned', 'started'] },
  })
    .select('_id')
    .lean();

  if (pendingAssignmentIds.length > 0) {
    await syncAssessmentAssignmentStates(
      pendingAssignmentIds.map((assignment) => assignment._id.toString())
    );
  }

  const [student, assignments, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image university department').lean(),
    AssessmentAssignment.find({ studentId: userId })
      .populate('assessmentId', 'title durationMinutes dueAt')
      .populate('jobId', 'title companyName')
      .sort({ createdAt: -1 })
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  const serializedAssignments = assignments.map((assignment) => {
    const assessment = assignment.assessmentId as {
      _id: string;
      title: string;
      durationMinutes: number;
      dueAt?: Date | null;
    } | null;
    const job = assignment.jobId as { _id: string; title: string; companyName: string } | null;
    return {
      _id: assignment._id.toString(),
      status: assignment.status,
      dueAt: assignment.dueAt?.toISOString() ?? assessment?.dueAt?.toISOString() ?? null,
      totalScore: assignment.totalScore ?? null,
      needsManualReview: assignment.needsManualReview,
      submittedAt: assignment.submittedAt?.toISOString() ?? null,
      assessment: assessment
        ? {
            _id: assessment._id.toString(),
            title: assessment.title,
            durationMinutes: assessment.durationMinutes,
          }
        : null,
      job: job
        ? {
            _id: job._id.toString(),
            title: job.title,
            companyName: job.companyName,
          }
        : null,
    };
  });

  const stats = {
    total: serializedAssignments.length,
    pending: serializedAssignments.filter((assignment) =>
      ['assigned', 'started'].includes(assignment.status)
    ).length,
    submitted: serializedAssignments.filter((assignment) =>
      ['submitted', 'graded'].includes(assignment.status)
    ).length,
    graded: serializedAssignments.filter((assignment) => assignment.status === 'graded').length,
  };

  return {
    student,
    assignments: serializedAssignments,
    stats,
    chrome: { unreadNotifications, unreadMessages },
  };
}

export default async function StudentAssessmentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const data = await getStudentAssessmentData(session.user.id);

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
        subtitle:
          [data.student?.university, data.student?.department].filter(Boolean).join(' | ') ||
          'Student workspace',
        unreadNotifications: data.chrome.unreadNotifications,
        unreadMessages: data.chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Hiring Suite"
          title="Take assessments, track deadlines, and review your evaluation results"
          description="Every employer assessment assigned to your applications lives here with due dates, scoring status, and direct access to the test workspace."
          actions={
            <>
              <ActionLink href="/student/applications" label="Back to applications" />
              <ActionLink href="/student/interviews" label="Open interviews" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Assessment status"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total', value: data.stats.total, color: '#0F172A' },
                  { label: 'Pending', value: data.stats.pending, color: '#075985' },
                  { label: 'Submitted', value: data.stats.submitted, color: '#92400E' },
                  { label: 'Results ready', value: data.stats.graded, color: '#047857' },
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
            className="student-assessment-stats-grid"
          >
            <StatCard
              label="Assigned"
              value={formatCompactNumber(data.stats.total)}
              Icon={ClipboardCheck}
            />
            <StatCard
              label="Open now"
              value={formatCompactNumber(data.stats.pending)}
              Icon={Clock3}
              accent="#22D3EE"
            />
            <StatCard
              label="Submitted"
              value={formatCompactNumber(data.stats.submitted)}
              Icon={FileText}
              accent="#F59E0B"
            />
            <StatCard
              label="Results ready"
              value={formatCompactNumber(data.stats.graded)}
              Icon={Trophy}
              accent="#10B981"
            />
          </div>
        </section>

        <DashboardSection
          title="My Assessments"
          description="Open the assessment workspace, check remaining deadlines, and review graded outcomes."
        >
          <div style={{ display: 'grid', gap: 14 }}>
            {data.assignments.length === 0 ? (
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
                No employer assessments have been assigned yet. When a hiring team moves your
                application into the assessment stage, it will appear here automatically and inside
                your application tracker.
              </div>
            ) : (
              data.assignments.map((assignment) => (
                <div
                  key={assignment._id}
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
                        {assignment.assessment?.title ?? 'Assessment'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                        {assignment.job?.title ?? 'Role'} •{' '}
                        {assignment.job?.companyName ?? 'Employer'}
                      </div>
                    </div>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '6px 10px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {formatAssessmentAssignmentStatus(assignment.status)}
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
                    <span>Due: {formatDhakaDateTime(assignment.dueAt)}</span>
                    <span>{assignment.assessment?.durationMinutes ?? '—'} min</span>
                    {assignment.submittedAt ? (
                      <span>Submitted: {formatDhakaDateTime(assignment.submittedAt)}</span>
                    ) : null}
                    {typeof assignment.totalScore === 'number' ? (
                      <span>Score: {assignment.totalScore}</span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link
                      href={`/student/assessments/${assignment._id}`}
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
                      {['submitted', 'graded'].includes(assignment.status)
                        ? 'Review assessment'
                        : 'Open assessment'}
                    </Link>
                    <Link
                      href="/student/applications"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#FFFFFF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      View application
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardSection>

        <style>{`
          @media (max-width: 960px) {
            .student-assessment-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
