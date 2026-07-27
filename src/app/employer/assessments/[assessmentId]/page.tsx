import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { syncAssessmentAssignmentStates } from '@/lib/hiring-suite';
import { formatDhakaDateTime } from '@/lib/datetime';
import { syncPremiumStatus } from '@/lib/premium';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
} from '@/components/dashboard/DashboardContent';
import EmployerAssessmentDetailClient from './EmployerAssessmentDetailClient';

async function getAssessmentDetailWorkspace(userId: string, assessmentId: string) {
  await connectDB();

  const pendingAssignmentIds = await AssessmentAssignment.find({
    assessmentId,
    employerId: userId,
    status: { $in: ['assigned', 'started'] },
  })
    .select('_id')
    .lean();

  if (pendingAssignmentIds.length > 0) {
    await syncAssessmentAssignmentStates(
      pendingAssignmentIds.map((assignment) => assignment._id.toString())
    );
  }

  const [employer, assessment, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image companyName').lean(),
    Assessment.findOne({ _id: assessmentId, employerId: userId })
      .populate('jobId', 'title companyName')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  if (!assessment) {
    return null;
  }

  const [assignments, submissions] = await Promise.all([
    AssessmentAssignment.find({ assessmentId })
      .populate('studentId', 'name email university department')
      .populate('applicationId', 'status fitScore')
      .sort({ createdAt: -1 })
      .lean(),
    AssessmentSubmission.find({ assessmentId }).lean(),
  ]);

  const submissionMap = new Map(
    submissions.map((submission) => [submission.assignmentId.toString(), submission])
  );
  const serializedAssignments = assignments.map((assignment) => ({
    _id: assignment._id.toString(),
    status: assignment.status,
    dueAt: assignment.dueAt?.toISOString() ?? null,
    totalScore: assignment.totalScore ?? null,
    isPassed: assignment.isPassed ?? null,
    needsManualReview: assignment.needsManualReview,
    student: assignment.studentId
      ? {
          _id: (assignment.studentId as { _id: string })._id.toString(),
          name: (assignment.studentId as { name: string }).name,
          email: (assignment.studentId as { email?: string }).email ?? '',
          university: (assignment.studentId as { university?: string }).university ?? '',
          department: (assignment.studentId as { department?: string }).department ?? '',
        }
      : null,
    application: assignment.applicationId
      ? {
          _id: (assignment.applicationId as { _id: string })._id.toString(),
          status: (assignment.applicationId as { status?: string }).status ?? '',
          fitScore: (assignment.applicationId as { fitScore?: number }).fitScore ?? null,
        }
      : null,
    submission: submissionMap.get(assignment._id.toString()) ?? null,
  }));

  return {
    employer,
    assessment,
    assignments: serializedAssignments,
    chrome: { unreadNotifications, unreadMessages },
  };
}

export default async function EmployerAssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const { assessmentId } = await params;
  const [data, premiumStatus] = await Promise.all([
    getAssessmentDetailWorkspace(session.user.id, assessmentId),
    syncPremiumStatus(session.user.id),
  ]);
  if (!data) redirect('/employer/assessments');

  const job = data.assessment.jobId as { title: string; companyName: string } | null;
  const uniqueDueTimes = Array.from(
    new Set(data.assignments.map((assignment) => assignment.dueAt).filter(Boolean))
  );
  const dueLabel =
    uniqueDueTimes.length === 1
      ? formatDhakaDateTime(uniqueDueTimes[0])
      : uniqueDueTimes.length > 1
        ? 'Varies by candidate'
        : formatDhakaDateTime(data.assessment.dueAt, 'Set during dispatch');

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
          eyebrow="Assessment Detail"
          title={data.assessment.title}
          description="Compare candidate submissions side by side, inspect automated scoring, review plagiarism indicators, and complete manual grading where subjective review is required."
          actions={
            <>
              <ActionLink href="/employer/assessments" label="Back to assessments" />
              <ActionLink href="/employer/interviews" label="Open interviews" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Assessment info"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Role', value: job?.title ?? 'Role' },
                  { label: 'Company', value: job?.companyName ?? 'Employer' },
                  { label: 'Due', value: dueLabel },
                  {
                    label: 'Pass mark',
                    value: `${data.assessment.passingMarks} / ${data.assessment.totalMarks}`,
                  },
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
          title="Candidate Comparison"
          description="Review each candidate’s submission, objective score, manual review needs, and final outcome from one grading workspace."
        >
          <EmployerAssessmentDetailClient
            assessment={JSON.parse(JSON.stringify(data.assessment))}
            assignments={JSON.parse(JSON.stringify(data.assignments))}
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
