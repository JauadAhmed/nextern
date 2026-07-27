import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { InterviewSession } from '@/models/InterviewSession';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { syncPremiumStatus } from '@/lib/premium';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
} from '@/components/dashboard/DashboardContent';
import InterviewRoomClient from '@/components/hiring-suite/InterviewRoomClient';
import ApplicantActions from '@/app/employer/jobs/[jobId]/applicants/ApplicantActions';
import Link from 'next/link';
import { formatDhakaDateTime } from '@/lib/datetime';

async function getEmployerInterviewWorkspace(userId: string, interviewId: string) {
  await connectDB();

  const [employer, interview, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image companyName').lean(),
    InterviewSession.findOne({ _id: interviewId, employerId: userId })
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email university department')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  const application = interview?.applicationId
    ? await Application.findOne({ _id: interview.applicationId, employerId: userId })
        .select(
          'status resumeUrlSnapshot generatedResumeUrlSnapshot assessmentId assessmentAssignmentId'
        )
        .lean()
    : null;

  return {
    employer,
    interview,
    application,
    chrome: { unreadNotifications, unreadMessages },
  };
}

function formatDateTime(value?: Date | string | null) {
  return formatDhakaDateTime(value, 'Not scheduled');
}

export default async function EmployerInterviewDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const { interviewId } = await params;
  const [data, premiumStatus] = await Promise.all([
    getEmployerInterviewWorkspace(session.user.id, interviewId),
    syncPremiumStatus(session.user.id),
  ]);

  if (!data.interview) redirect('/employer/interviews');

  const interview = data.interview;
  const job = interview.jobId as { _id?: string; title: string; companyName: string } | null;
  const student = interview.studentId as {
    _id?: string;
    name: string;
    email: string;
    university?: string;
    department?: string;
  } | null;
  const application = data.application;
  const candidateProfileHref =
    job?._id && student?._id
      ? `/employer/jobs/${job._id.toString()}/applicants/${student._id.toString()}`
      : null;

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
          eyebrow="Interview Session"
          title={interview.title}
          description="Join the live room, share your screen when needed, capture notes, and complete the structured scorecard before finalizing the session."
          actions={
            <>
              <ActionLink href="/employer/interviews" label="Back to interviews" />
              {candidateProfileHref ? (
                <ActionLink
                  href={candidateProfileHref}
                  label="Open candidate profile"
                  tone="ghost"
                />
              ) : null}
              <ActionLink href="/employer/assessments" label="Open assessments" tone="ghost" />
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
                  { label: 'Candidate', value: student?.name ?? 'Candidate' },
                  { label: 'Role', value: job?.title ?? 'Role' },
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
          description="Use the room below for the live call, notes, scorecard, recording upload, and completion controls."
        >
          <InterviewRoomClient role="employer" interview={JSON.parse(JSON.stringify(interview))} />
        </DashboardSection>

        {application ? (
          <DashboardSection
            title="Candidate Actions"
            description="Update the candidate's pipeline status from this interview workspace and jump straight to the related hiring records."
          >
            <div className="interview-candidate-actions-grid">
              <Panel title="Application status">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                    Move this candidate to the next stage as soon as the interview outcome is clear.
                  </div>
                  <ApplicantActions
                    appId={application._id.toString()}
                    currentStatus={application.status}
                    resumeUrl={application.resumeUrlSnapshot ?? undefined}
                    generatedResumeUrl={application.generatedResumeUrlSnapshot ?? undefined}
                  />
                </div>
              </Panel>

              <Panel title="Quick links">
                <div style={{ display: 'grid', gap: 10 }}>
                  {candidateProfileHref ? (
                    <Link
                      href={candidateProfileHref}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#2563EB',
                        fontSize: 13,
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      Open candidate profile
                    </Link>
                  ) : null}

                  {job?._id ? (
                    <Link
                      href={`/employer/jobs/${job._id.toString()}/applicants`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#0F172A',
                        fontSize: 13,
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      Back to this job&apos;s applicant list
                    </Link>
                  ) : null}

                  {application.assessmentId ? (
                    <Link
                      href={`/employer/assessments/${application.assessmentId.toString()}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#0369A1',
                        fontSize: 13,
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      Open linked assessment review
                    </Link>
                  ) : null}
                </div>
              </Panel>
            </div>
          </DashboardSection>
        ) : null}

        <style>{`
          .interview-candidate-actions-grid {
            display: grid;
            grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
            gap: 16px;
          }

          @media (max-width: 960px) {
            .interview-candidate-actions-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
