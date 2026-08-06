import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getUsageSummary } from '@/lib/premium';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  Panel,
  ProgressBar,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { BriefcaseBusiness, CreditCard, Crown, Sparkles, Target, Users } from 'lucide-react';

export const metadata = { title: 'Employer AI Hiring' };

async function getEmployerAiData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [user, usage, jobs, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image companyName companyDescription').lean(),
    getUsageSummary(userId),
    Job.find({ employerId: oid, isActive: true })
      .select(
        'title type city locationType applicationDeadline requiredSkills applicationCount isPremiumListing'
      )
      .sort({ applicationCount: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const jobIds = jobs.map((job) => job._id);
  const scoredCounts = jobIds.length
    ? await Application.aggregate([
        {
          $match: {
            jobId: { $in: jobIds },
            employerId: oid,
            isEventRegistration: false,
            fitScore: { $type: 'number' },
          },
        },
        { $group: { _id: '$jobId', scored: { $sum: 1 } } },
      ])
    : [];

  const scoredMap = new Map(
    scoredCounts.map((item: { _id: mongoose.Types.ObjectId; scored: number }) => [
      item._id.toString(),
      item.scored,
    ])
  );

  return {
    user,
    usage,
    jobs: jobs.map((job) => ({
      id: job._id.toString(),
      title: job.title,
      type: job.type,
      city: job.city,
      locationType: job.locationType,
      applicationDeadline: job.applicationDeadline?.toISOString(),
      requiredSkills: (job.requiredSkills ?? []) as string[],
      applicationCount: job.applicationCount ?? 0,
      scoredApplicants: scoredMap.get(job._id.toString()) ?? 0,
      isPremiumListing: job.isPremiumListing ?? false,
    })),
    chrome: { unreadNotifications, unreadMessages },
  };
}

function usageLabel(value: number | null) {
  return value === null ? 'Unlimited' : `${value} left`;
}

function usagePercent(count: number, limit: number | null) {
  if (limit === null) return 100;
  if (limit === 0) return 0;
  return Math.min(100, Math.round((count / limit) * 100));
}

export default async function EmployerAiPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/login');

  const { user, usage, jobs, chrome } = await getEmployerAiData(session.user.id);
  const shortlistLimit = usage.limits.aiApplicantShortlist;
  const shortlistCount = usage.counts.aiApplicantShortlist;
  const jobLimit = usage.limits.jobPosting;
  const jobCount = usage.counts.jobPosting;

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer AI"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{
        name: user?.name ?? 'Employer',
        email: user?.email ?? '',
        image: user?.image,
        subtitle: user?.companyName ?? 'Employer workspace',
        userId: session.user.id,
        isPremium: usage.isPremium,
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="AI hiring center"
          title="Use Nextern AI to shortlist candidates faster"
          description={
            user?.companyDescription ||
            'Generate AI-ranked applicant shortlists, monitor monthly usage, and upgrade for unlimited employer AI tools.'
          }
          actions={
            <>
              <ActionLink href="/employer/jobs" label="Choose a job" />
              <ActionLink href="/employer/premium" label="Premium & payments" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title={usage.isPremium ? 'AI access unlocked' : 'Free employer plan'}
              description={
                usage.isPremium
                  ? 'Unlimited employer AI shortlists and job postings are unlocked.'
                  : 'Free employers have monthly limits. Upgrade for unlimited AI and listings.'
              }
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <Tag
                  label={
                    usage.isPremium
                      ? 'Unlimited AI shortlists'
                      : `${usage.remaining.aiApplicantShortlist ?? 0} AI shortlists left`
                  }
                  tone={usage.isPremium ? 'success' : 'warning'}
                />
                <Tag
                  label={
                    usage.isPremium
                      ? 'Unlimited job postings'
                      : `${usage.remaining.jobPosting ?? 0} job postings left`
                  }
                  tone={usage.isPremium ? 'success' : 'warning'}
                />
              </div>
            </Panel>
          }
        />

        <DashboardSection
          id="shortlist"
          title="AI tools & usage"
          description="Premium employers have no monthly cap. Regular employers can still use core AI features with monthly limits."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
            className="employer-ai-grid"
          >
            <Panel
              title="AI applicant shortlisting"
              description="Creates a ranked shortlist from fit scores, requirement matches, gaps, and profile quality."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Sparkles size={22} color="#2563EB" />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1E293B' }}>
                    {usageLabel(usage.remaining.aiApplicantShortlist)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                    {shortlistLimit === null
                      ? `${shortlistCount} generated this month`
                      : `${shortlistCount}/${shortlistLimit} used this month`}
                  </div>
                </div>
              </div>
              <ProgressBar value={usagePercent(shortlistCount, shortlistLimit)} />
            </Panel>

            <Panel
              title="Job posting capacity"
              description="Premium listings are also prioritized in student job feeds."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <BriefcaseBusiness size={22} color="#10B981" />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1E293B' }}>
                    {usageLabel(usage.remaining.jobPosting)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                    {jobLimit === null
                      ? `${jobCount} posted this month`
                      : `${jobCount}/${jobLimit} posted this month`}
                  </div>
                </div>
              </div>
              <ProgressBar value={usagePercent(jobCount, jobLimit)} tone="success" />
            </Panel>

            <Panel
              title="Premium payments"
              description="Employer Premium supports bKash, Visa, and Mastercard checkout."
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {['bKash checkout', 'Visa via Stripe', 'Mastercard via Stripe'].map((method) => (
                  <div
                    key={method}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#1E293B',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    <CreditCard size={15} color="#2563EB" />
                    {method}
                  </div>
                ))}
                <Link
                  href={usage.isPremium ? '/employer/subscription' : '/employer/premium'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                    background: '#2563EB',
                    color: '#FFFFFF',
                    borderRadius: 12,
                    padding: '11px 14px',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  <Crown size={14} />
                  {usage.isPremium ? 'Manage billing' : 'Upgrade now'}
                </Link>
              </div>
            </Panel>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Choose a role for AI shortlisting"
          description="Open a job's applicant pipeline, then use the AI shortlist card at the top of the applicant page."
        >
          {jobs.length > 0 ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}
              className="employer-ai-jobs"
            >
              {jobs.map((job) => (
                <Panel
                  key={job.id}
                  title={job.title}
                  description={`${formatStatusLabel(job.type)} / ${formatStatusLabel(job.locationType)}${
                    job.applicationDeadline
                      ? ` / Deadline ${formatShortDate(job.applicationDeadline)}`
                      : ''
                  }`}
                  action={
                    job.isPremiumListing ? <Tag label="Premium listing" tone="warning" /> : null
                  }
                >
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    <Tag
                      label={`${formatCompactNumber(job.applicationCount)} applicants`}
                      tone="info"
                    />
                    <Tag
                      label={`${formatCompactNumber(job.scoredApplicants)} scored`}
                      tone="success"
                    />
                    {job.city ? <Tag label={job.city} tone="neutral" /> : null}
                  </div>
                  {job.requiredSkills.length > 0 ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {job.requiredSkills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            borderRadius: 999,
                            padding: '4px 9px',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link
                      href={`/employer/jobs/${job.id}/applicants#ai-shortlist`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        borderRadius: 11,
                        padding: '9px 13px',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      <Target size={13} /> Open AI shortlist
                    </Link>
                    <Link
                      href={`/employer/jobs/${job.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        borderRadius: 11,
                        padding: '9px 13px',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <Users size={13} /> View listing
                    </Link>
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <Panel
              title="No active jobs yet"
              description="Post a role first, then AI shortlisting will become available as students apply."
            >
              <EmptyState
                title="Create your first listing"
                description="Employer AI works best once applicants and fit scores start flowing into a role."
              />
            </Panel>
          )}
        </DashboardSection>

        <style>{`
          @media (max-width: 960px) {
            .employer-ai-grid,
            .employer-ai-jobs {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
