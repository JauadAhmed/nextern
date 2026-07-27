import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { syncAssessmentAssignmentStates } from '@/lib/hiring-suite';
import { syncPremiumStatus } from '@/lib/premium';
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
import { ClipboardCheck, FileText, GraduationCap, Users } from 'lucide-react';
import EmployerAssessmentsClient from './EmployerAssessmentsClient';

async function getAssessmentPageData(userId: string, jobId?: string) {
  await connectDB();

  const query: Record<string, unknown> = { employerId: userId };
  if (jobId) query.jobId = jobId;

  const pendingAssignmentIds = await AssessmentAssignment.find({
    employerId: userId,
    ...(jobId ? { jobId } : {}),
    status: { $in: ['assigned', 'started'] },
  })
    .select('_id')
    .lean();

  if (pendingAssignmentIds.length > 0) {
    await syncAssessmentAssignmentStates(
      pendingAssignmentIds.map((assignment) => assignment._id.toString())
    );
  }

  const [employer, jobs, assessments, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image companyName').lean(),
    Job.find({ employerId: userId })
      .select('title companyName isActive')
      .sort({ createdAt: -1 })
      .lean(),
    Assessment.find(query).populate('jobId', 'title companyName').sort({ createdAt: -1 }).lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  const assessmentIds = assessments.map((assessment) => assessment._id);
  const summaryRows =
    assessmentIds.length > 0
      ? await AssessmentAssignment.aggregate([
          { $match: { assessmentId: { $in: assessmentIds } } },
          {
            $group: {
              _id: '$assessmentId',
              assigned: { $sum: 1 },
              submitted: {
                $sum: {
                  $cond: [{ $in: ['$status', ['submitted', 'graded']] }, 1, 0],
                },
              },
              graded: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'graded'] }, 1, 0],
                },
              },
              averageScore: { $avg: '$totalScore' },
            },
          },
        ])
      : [];

  const summaryMap = new Map(summaryRows.map((row) => [row._id.toString(), row]));
  const enrichedAssessments = assessments.map((assessment) => {
    const summary = summaryMap.get(assessment._id.toString());
    const job = assessment.jobId as { _id: string; title: string; companyName: string } | null;

    return {
      _id: assessment._id.toString(),
      title: assessment.title,
      type: assessment.type,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
      durationMinutes: assessment.durationMinutes,
      dueAt: assessment.dueAt?.toISOString() ?? null,
      isActive: assessment.isActive,
      createdAt: assessment.createdAt?.toISOString() ?? new Date().toISOString(),
      job: job
        ? {
            _id: job._id.toString(),
            title: job.title,
            companyName: job.companyName,
          }
        : null,
      summary: {
        assigned: summary?.assigned ?? 0,
        submitted: summary?.submitted ?? 0,
        graded: summary?.graded ?? 0,
        averageScore:
          typeof summary?.averageScore === 'number' ? Math.round(summary.averageScore) : null,
      },
    };
  });

  const stats = {
    totalAssessments: enrichedAssessments.length,
    activeAssessments: enrichedAssessments.filter((assessment) => assessment.isActive).length,
    assignedCandidates: enrichedAssessments.reduce(
      (sum, assessment) => sum + (assessment.summary.assigned ?? 0),
      0
    ),
    gradedSubmissions: enrichedAssessments.reduce(
      (sum, assessment) => sum + (assessment.summary.graded ?? 0),
      0
    ),
  };

  return {
    employer,
    jobs: jobs.map((job) => ({
      _id: job._id.toString(),
      title: job.title,
      companyName: job.companyName,
      isActive: Boolean(job.isActive),
    })),
    assessments: enrichedAssessments,
    stats,
    chrome: { unreadNotifications, unreadMessages },
  };
}

export default async function EmployerAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; applicationIds?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const params = await searchParams;
  const [data, premiumStatus] = await Promise.all([
    getAssessmentPageData(session.user.id, params.jobId),
    syncPremiumStatus(session.user.id),
  ]);

  const initialApplicationIds = params.applicationIds
    ? params.applicationIds
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

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
          title="Assess candidates with built-in tests, coding runs, and grading workflows"
          description="Create structured assessments inside Nextern, send them in batches from the applicant pipeline, and keep scores linked to each applicant profile for side-by-side comparison."
          actions={
            <>
              <ActionLink href="/employer/interviews" label="Open interview suite" />
              <ActionLink href="/employer/jobs" label="Back to jobs" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Assessment summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Assessments', value: data.stats.totalAssessments, color: '#0F172A' },
                  { label: 'Live', value: data.stats.activeAssessments, color: '#075985' },
                  { label: 'Assigned', value: data.stats.assignedCandidates, color: '#92400E' },
                  { label: 'Graded', value: data.stats.gradedSubmissions, color: '#047857' },
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
            className="assessment-stats-grid-shell"
          >
            <StatCard
              label="Assessments"
              value={formatCompactNumber(data.stats.totalAssessments)}
              Icon={ClipboardCheck}
            />
            <StatCard
              label="Assigned candidates"
              value={formatCompactNumber(data.stats.assignedCandidates)}
              Icon={Users}
              accent="#22D3EE"
            />
            <StatCard
              label="Graded submissions"
              value={formatCompactNumber(data.stats.gradedSubmissions)}
              Icon={GraduationCap}
              accent="#10B981"
            />
            <StatCard
              label="Jobs covered"
              value={formatCompactNumber(data.jobs.length)}
              Icon={FileText}
              accent="#F59E0B"
            />
          </div>
        </section>

        <DashboardSection
          title="Assessment Center"
          description="Build evaluations on the left and manage your existing assessment library on the right."
        >
          <EmployerAssessmentsClient
            jobs={data.jobs}
            assessments={data.assessments}
            initialJobId={params.jobId}
            initialApplicationIds={initialApplicationIds}
            isPremium={premiumStatus.isPremium}
          />
        </DashboardSection>

        <style>{`
          @media (max-width: 960px) {
            .assessment-stats-grid-shell { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
