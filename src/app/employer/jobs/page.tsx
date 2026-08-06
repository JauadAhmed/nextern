// src/app/employer/jobs/page.tsx
// Employer job listings dashboard — uses DashboardShell + DashboardContent

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import CloseJobButton from './CloseJobButton';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  formatCompactNumber,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import {
  BriefcaseBusiness,
  Users,
  Eye,
  PlusCircle,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import PaginatedCollection from '@/components/ui/PaginatedCollection';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
  {
    label: 'Hiring',
    icon: 'users' as const,
    items: [
      {
        label: 'Post New Job',
        href: '/employer/jobs/new',
        description: 'Create a new job listing or campus drive.',
        icon: 'briefcase' as const,
      },
      {
        label: 'All Applicants',
        href: '/employer/jobs',
        description: 'Browse applicants across all your job listings.',
        icon: 'users' as const,
      },
    ],
  },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  internship: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'part-time': { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'full-time': { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'campus-drive': { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: '#FEF2F2', color: '#BE123C', border: '#FECDD3' },
};

async function getJobsData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [employer, jobs, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select(
        'name email image companyName companyDescription industry headquartersCity companyWebsite'
      )
      .lean(),
    Job.find({ employerId: oid }).sort({ createdAt: -1 }).lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const jobIds = jobs.map((j) => j._id);
  const appCounts = jobIds.length
    ? await Application.aggregate([
        { $match: { jobId: { $in: jobIds }, isEventRegistration: false } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
      ])
    : [];

  const appCountMap = new Map(
    appCounts.map((a: { _id: mongoose.Types.ObjectId; count: number }) => [
      a._id.toString(),
      a.count,
    ])
  );

  const totalApps = appCounts.reduce((s: number, a: { count: number }) => s + a.count, 0);
  const activeJobs = jobs.filter((j) => j.isActive).length;
  const totalViews = jobs.reduce((s, j) => s + (j.viewCount ?? 0), 0);

  // ✅ Date.now() called here in server scope, not inside .map() during render
  const now = Date.now();

  return {
    employer,
    jobs: jobs.map((j) => {
      const deadline = j.applicationDeadline ? new Date(j.applicationDeadline) : null;
      const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
      return {
        ...j,
        _id: j._id.toString(),
        applicationCount: appCountMap.get(j._id.toString()) ?? j.applicationCount ?? 0,
        daysLeft,
        isUrgent: daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && j.isActive,
        isExpired: daysLeft !== null && daysLeft < 0,
      };
    }),
    stats: { activeJobs, totalJobs: jobs.length, totalApps, totalViews },
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function EmployerJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');
  if (session.user.verificationStatus !== 'approved') redirect('/pending-approval');

  const { employer, jobs, stats, chrome } = await getJobsData(session.user.id);

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
          eyebrow="Job listings"
          title="Manage your hiring pipeline"
          subtitle={`${stats.activeJobs} active · ${stats.totalJobs} total listings`}
          description={
            employer?.companyDescription ||
            'Post new roles, track applicants, and manage all your listings from one place. Each posting feeds directly into the AI fit scoring engine.'
          }
          actions={
            <>
              <ActionLink href="/employer/jobs/new" label="Post new job" />
              <ActionLink href="/employer/dashboard" label="Back to dashboard" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Quick stats"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(
                  [
                    {
                      label: 'Active',
                      value: stats.activeJobs,
                      color: '#047857',
                      Icon: BriefcaseBusiness,
                    },
                    { label: 'Total', value: stats.totalJobs, color: '#FFFFFF', Icon: BarChart3 },
                    { label: 'Applicants', value: stats.totalApps, color: '#BAE6FD', Icon: Users },
                    { label: 'Views', value: stats.totalViews, color: '#FDE68A', Icon: Eye },
                  ] as { label: string; value: number; color: string; Icon: LucideIcon }[]
                ).map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, lineHeight: 1 }}>
                      <s.Icon size={18} strokeWidth={2.5} color={s.color} />
                      <span
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          color: s.color,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {formatCompactNumber(s.value)}
                      </span>
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: 12, marginTop: 7, fontWeight: 700 }}>
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
              label="Active listings"
              value={formatCompactNumber(stats.activeJobs)}
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Total applicants"
              value={formatCompactNumber(stats.totalApps)}
              Icon={Users}
              accent="#22D3EE"
            />
            <StatCard
              label="Total views"
              value={formatCompactNumber(stats.totalViews)}
              Icon={Eye}
              accent="#F59E0B"
            />
            <StatCard
              label="Total listings"
              value={formatCompactNumber(stats.totalJobs)}
              Icon={BarChart3}
              accent="#10B981"
            />
          </div>
        </section>

        <DashboardSection
          id="jobs"
          title="All job listings"
          description="Your complete roster of postings. Click 'View Applicants' on any role to manage the pipeline."
          action={
            <Link
              href="/employer/jobs/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: '#2563EB',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
              }}
            >
              <PlusCircle size={15} /> Post New Job
            </Link>
          }
        >
          {jobs.length === 0 ? (
            <Panel
              title="No jobs posted yet"
              description="Your listings will appear here once you create your first role."
            >
              <EmptyState
                title="Start hiring"
                description="Post your first internship or job opening to start receiving applications from verified BD university students."
              />
            </Panel>
          ) : (
            <PaginatedCollection
              itemLabel="job listings"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {jobs.map((job) => {
                const typeStyle = TYPE_COLORS[job.type] ?? TYPE_COLORS['internship'];
                const { daysLeft, isUrgent, isExpired } = job;

                return (
                  <div
                    key={job._id}
                    style={{
                      background: '#fff',
                      borderRadius: 20,
                      border: `1px solid ${isUrgent ? '#FDE68A' : '#E2E8F0'}`,
                      padding: '20px 24px',
                      boxShadow: isUrgent
                        ? '0 0 0 3px rgba(245,158,11,0.1)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Left */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              border: `1px solid ${typeStyle.border}`,
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {formatStatusLabel(job.type)}
                          </span>
                          {job.isBatchHiring && (
                            <span
                              style={{
                                background: '#EDE9FE',
                                color: '#7C3AED',
                                border: '1px solid #DDD6FE',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Batch Hire
                            </span>
                          )}
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              background: job.isActive ? '#ECFDF5' : '#F8FAFC',
                              color: job.isActive ? '#065F46' : '#64748B',
                              border: `1px solid ${job.isActive ? '#A7F3D0' : '#E2E8F0'}`,
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: job.isActive ? '#10B981' : '#94A3B8',
                                display: 'inline-block',
                              }}
                            />
                            {job.isActive ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <h3
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: '#0F172A',
                            fontFamily: 'var(--font-display)',
                            margin: 0,
                            marginBottom: 6,
                          }}
                        >
                          {job.title}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 14,
                            color: '#64748B',
                            fontSize: 13,
                          }}
                        >
                          {job.city && (
                            <span>
                              📍 {job.city} · {formatStatusLabel(job.locationType)}
                            </span>
                          )}
                          {daysLeft !== null && (
                            <span
                              style={{
                                color: isUrgent ? '#F59E0B' : isExpired ? '#EF4444' : '#64748B',
                                fontWeight: isUrgent || isExpired ? 700 : 400,
                              }}
                            >
                              📅{' '}
                              {isExpired
                                ? 'Expired'
                                : isUrgent
                                  ? `${daysLeft}d left — Urgent`
                                  : `${daysLeft}d left`}
                            </span>
                          )}
                          {job.stipendBDT && (
                            <span style={{ color: '#10B981', fontWeight: 600 }}>
                              ৳{job.stipendBDT.toLocaleString()}/mo
                            </span>
                          )}
                          {job.isStipendNegotiable && !job.stipendBDT && <span>Negotiable</span>}
                        </div>
                      </div>

                      {/* Right stats */}
                      <div
                        style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: '#2563EB',
                              fontFamily: 'var(--font-display)',
                              lineHeight: 1,
                            }}
                          >
                            {formatCompactNumber(job.applicationCount)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#64748B',
                              marginTop: 3,
                              fontWeight: 600,
                            }}
                          >
                            Applicants
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: '#64748B',
                              fontFamily: 'var(--font-display)',
                              lineHeight: 1,
                            }}
                          >
                            {formatCompactNumber(job.viewCount ?? 0)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#64748B',
                              marginTop: 3,
                              fontWeight: 600,
                            }}
                          >
                            Views
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills preview */}
                    {job.requiredSkills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                        {job.requiredSkills.slice(0, 5).map((s: string) => (
                          <span
                            key={s}
                            style={{
                              background: '#F1F5F9',
                              color: '#475569',
                              padding: '3px 9px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span style={{ color: '#94A3B8', fontSize: 11, padding: '3px 5px' }}>
                            +{job.requiredSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <Link
                        href={`/employer/jobs/${job._id}/applicants`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#0F172A',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        <Users size={13} /> View Applicants
                      </Link>
                      <Link
                        href={`/employer/jobs/${job._id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#EFF6FF',
                          color: '#2563EB',
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        <Eye size={13} /> View Job Post
                      </Link>
                      <Link
                        href={`/employer/jobs/${job._id}/edit`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        Edit
                      </Link>
                      {job.isActive && <CloseJobButton jobId={job._id} />}
                    </div>
                  </div>
                );
              })}
            </PaginatedCollection>
          )}
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
