// src/app/employer/dashboard/page.tsx

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getEmployerCalendarEvents } from '@/lib/employer-calendar-events';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroAsideCard,
  HeroCard,
  Panel,
  ProgressBar,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { getEmployerDashboardData } from '@/lib/role-dashboard';
import { getUsageSummary } from '@/lib/premium';
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  Globe,
  MapPin,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import CalendarBoard from '@/components/calendar/CalendarBoard';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Calendar', href: '/employer/calendar', icon: 'calendar' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
  {
    label: 'Hiring',
    icon: 'briefcase' as const,
    items: [
      {
        label: 'Open roles',
        href: '/employer/dashboard#jobs',
        description: 'Review your latest jobs, activity status, and response volume.',
        icon: 'briefcase' as const,
      },
      {
        label: 'Pipeline',
        href: '/employer/dashboard#pipeline',
        description: 'Track how applications are moving across the hiring funnel.',
        icon: 'insights' as const,
      },
      {
        label: 'Applications',
        href: '/employer/dashboard#applications',
        description: 'See fresh applicant activity flowing into your team.',
        icon: 'file' as const,
      },
    ],
  },
  {
    label: 'Talent',
    icon: 'users' as const,
    items: [
      {
        label: 'Top candidates',
        href: '/employer/dashboard#candidates',
        description: 'Surface the strongest student matches already in your pipeline.',
        icon: 'sparkles' as const,
      },
      {
        label: 'Recommendation requests',
        href: '/employer/recommendations',
        description: 'Review advisor and department-head endorsements for your active roles.',
        icon: 'target' as const,
      },
    ],
  },
];

function statusTone(isActive: boolean): 'success' | 'warning' {
  return isActive ? 'success' : 'warning';
}

function usageLabel(value: number | null) {
  return value === null ? 'Unlimited' : `${value} left`;
}

function usagePercent(count: number, limit: number | null) {
  if (limit === null) return 100;
  if (limit === 0) return 0;
  return Math.min(100, Math.round((count / limit) * 100));
}

export default async function EmployerDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [data, usage, calendarEvents] = await Promise.all([
    getEmployerDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    getUsageSummary(session.user.id),
    getEmployerCalendarEvents(session.user.id, 24).catch(() => []),
  ]);

  const profileItems = [
    !!data.company.industry,
    !!data.company.headquartersCity,
    !!data.company.companyWebsite,
    !!data.company.companyDescription,
  ];
  const profileScore = Math.round(
    (profileItems.filter(Boolean).length / profileItems.length) * 100
  );
  const completedProfileItems = profileItems.filter(Boolean).length;
  const recentRoleCount = data.recentJobs.length;
  const rolesWithApplicants = data.recentJobs.filter((job) => job.applicationCount > 0).length;
  const avgApplicantsPerActiveRole =
    data.stats.activeJobs > 0
      ? Math.round((data.stats.totalApplications / data.stats.activeJobs) * 10) / 10
      : 0;
  const nextDeadline = data.recentJobs
    .map((job) => job.applicationDeadline)
    .filter((deadline): deadline is string => Boolean(deadline))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
  const now = new Date();
  const upcomingDeadlines = data.recentJobs.filter(
    (job) => job.applicationDeadline && new Date(job.applicationDeadline) >= now
  ).length;
  const pipelineMax = Math.max(1, ...data.pipeline.map((stage) => stage.count));
  const pipelineColors = ['#2563EB', '#22D3EE', '#F59E0B', '#10B981'];

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={{ ...data.chromeUser, isPremium: usage.isPremium, userId: session.user.id }}
    >
      <DashboardPage>
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="Employer workspace"
          title={data.company.companyName}
          description={
            data.company.companyDescription ||
            'No company description added yet — go to Company Profile to write one.'
          }
          subtitle={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {data.company.headquartersCity && (
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
                  📍 {data.company.headquartersCity}
                </span>
              )}
              {data.company.headquartersCity && data.company.industry && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>·</span>
              )}
              {data.company.industry && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  {data.company.industry}
                </span>
              )}
              {data.company.companyWebsite && (
                <Link
                  href={data.company.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#2563EB',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Globe size={13} /> Website
                </Link>
              )}
            </div>
          }
          actions={
            <>
              <ActionLink href="/employer/jobs/new" label="Post new job" />
              <ActionLink href="/employer/jobs" label="View listings" tone="ghost" />
              <ActionLink href="/employer/ai" label="AI hiring" tone="ghost" />
            </>
          }
          aside={
            <HeroAsideCard
              contentStyle={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: -0.3,
                  }}
                >
                  Company Snapshot
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Profile</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: profileScore === 100 ? '#10B981' : '#F59E0B',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {profileScore}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: 105,
                      height: 5,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${profileScore}%`,
                        height: '100%',
                        borderRadius: 999,
                        background:
                          profileScore === 100
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, #2563EB, #22D3EE)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  {
                    label: 'Profile fields',
                    value: `${completedProfileItems}/4`,
                    desc: 'core details complete',
                    color: '#22D3EE',
                  },
                  {
                    label: 'Avg per active role',
                    value: avgApplicantsPerActiveRole.toLocaleString(),
                    desc: 'applicant density',
                    color: '#F59E0B',
                  },
                  {
                    label: 'Roles with traction',
                    value: recentRoleCount ? `${rolesWithApplicants}/${recentRoleCount}` : '0',
                    desc: 'recent roles drawing interest',
                    color: '#10B981',
                  },
                  {
                    label: 'Upcoming deadlines',
                    value: upcomingDeadlines.toLocaleString(),
                    desc: nextDeadline
                      ? `next due ${formatShortDate(nextDeadline)}`
                      : 'no deadlines set',
                    color: '#A78BFA',
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      minHeight: 86,
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      style={{
                        color: metric.color,
                        fontSize: 20,
                        fontWeight: 900,
                        lineHeight: 1.05,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {metric.value}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        color: '#E2E8F0',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {metric.label}
                    </div>
                    <div style={{ marginTop: 3, color: '#94A3B8', fontSize: 10, fontWeight: 600 }}>
                      {metric.desc}
                    </div>
                  </div>
                ))}
              </div>
            </HeroAsideCard>
          }
        />

        {/* ── Stat cards ── */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Active jobs"
              value={formatCompactNumber(data.stats.activeJobs)}
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Applications"
              value={formatCompactNumber(data.stats.totalApplications)}
              Icon={Users}
              accent="#22D3EE"
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(data.stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Interviews"
              value={formatCompactNumber(data.stats.interviews)}
              Icon={Clock3}
              accent="#F59E0B"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hired)}
              Icon={Sparkles}
              accent="#2563EB"
            />
          </div>
        </section>

        {/* ── Calendar ── */}
        <DashboardSection
          id="calendar"
          title="Calendar"
          description="Track interview schedules, job deadlines, and employer-hosted event dates with the same interactive monthly planner used in the student experience."
        >
          <CalendarBoard
            events={calendarEvents}
            isCalendarConnected={false}
            mode="dashboard"
            boardTitle="Hiring Calendar"
            boardSubtitle="Browse month by month, track interviews, deadlines, and employer-hosted events."
            fullCalendarHref="/employer/calendar"
            manageCalendarHref={null}
            showConnectionStatus={false}
            eventHrefTemplate="/employer/jobs/:jobId/applicants"
            emptyNextEventMessage="No upcoming hiring events yet. Post roles, publish events, or schedule interviews to fill this planner."
          />
        </DashboardSection>

        {/* ── AI hiring ── */}
        <DashboardSection
          id="ai-hiring"
          title="AI hiring & premium access"
          description="Employer AI is visible from your dashboard. Premium employers get unlimited shortlists and postings; regular employers keep monthly free limits."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-grid-three"
          >
            <Panel
              title="AI applicant shortlist"
              description="Rank applicants from each job pipeline using fit scores, gaps, and student profile signals."
              action={
                <Link
                  href="/employer/ai"
                  style={{
                    color: '#2563EB',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Open AI center
                </Link>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Target size={22} color="#2563EB" />
                <div>
                  <div
                    style={{
                      fontSize: 30,
                      lineHeight: 1,
                      color: '#1E293B',
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {usageLabel(usage.remaining.aiApplicantShortlist)}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                    {usage.limits.aiApplicantShortlist === null
                      ? `${usage.counts.aiApplicantShortlist} generated this month`
                      : `${usage.counts.aiApplicantShortlist}/${usage.limits.aiApplicantShortlist} used this month`}
                  </div>
                </div>
              </div>
              <ProgressBar
                value={usagePercent(
                  usage.counts.aiApplicantShortlist,
                  usage.limits.aiApplicantShortlist
                )}
              />
            </Panel>

            <Panel
              title="Premium status"
              description={
                usage.isPremium
                  ? 'Employer AI tools are unlocked without monthly caps.'
                  : 'Upgrade when you need unlimited AI shortlists, postings, and priority visibility.'
              }
              action={
                <Link
                  href={usage.isPremium ? '/employer/subscription' : '/employer/premium'}
                  style={{
                    color: '#2563EB',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {usage.isPremium ? 'Billing' : 'Upgrade'}
                </Link>
              }
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Crown size={22} color={usage.isPremium ? '#F59E0B' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#1E293B' }}>
                      {usageLabel(usage.remaining.jobPosting)}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                      Job postings this month
                    </div>
                  </div>
                </div>
                <ProgressBar
                  value={usagePercent(usage.counts.jobPosting, usage.limits.jobPosting)}
                  tone="success"
                />
              </div>
            </Panel>

            <Panel
              title="Payment options"
              description="Employer Premium checkout is available through local mobile payment and cards."
              action={
                <Link
                  href="/employer/subscription"
                  style={{
                    color: '#2563EB',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Billing
                </Link>
              }
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {['bKash', 'Visa', 'Mastercard'].map((method) => (
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
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#1E293B',
                    }}
                  >
                    <CreditCard size={15} color="#2563EB" />
                    {method}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </DashboardSection>

        {/* ── Hiring pipeline ── */}
        <DashboardSection
          id="pipeline"
          title="Hiring pipeline"
          description="A live funnel view built from real application statuses already stored for your company."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Pipeline stage counts"
              description="Distribution of application volume moving through each hiring stage."
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    minHeight: 210,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${data.pipeline.length || 1}, minmax(0, 1fr))`,
                    gap: 14,
                    alignItems: 'end',
                    padding: '20px 18px 16px',
                    borderRadius: 18,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {data.pipeline.map((stage, i) => {
                    const color = pipelineColors[i % pipelineColors.length];
                    const total = data.stats.totalApplications;
                    const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                    const height =
                      stage.count > 0 ? Math.max(18, (stage.count / pipelineMax) * 100) : 6;
                    return (
                      <div
                        key={stage.label}
                        style={{
                          minHeight: 174,
                          minWidth: 0,
                          display: 'grid',
                          gridTemplateRows: 'auto 1fr auto',
                          gap: 10,
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              color,
                              fontSize: 24,
                              fontWeight: 900,
                              lineHeight: 1,
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {formatCompactNumber(stage.count)}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              color: '#64748B',
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {pct}% of total
                          </div>
                        </div>
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              maxWidth: 56,
                              height: `${height}%`,
                              borderRadius: '14px 14px 6px 6px',
                              background: color,
                              boxShadow: `0 12px 24px ${color}26`,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            textAlign: 'center',
                            color: '#64748B',
                            fontSize: 11,
                            fontWeight: 800,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {stage.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            <Panel
              title="Conversion metrics"
              description="How effectively your pipeline is converting applicants through each stage."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    label: 'Application → Shortlist',
                    numerator: data.stats.shortlisted,
                    denominator: data.stats.totalApplications,
                    color: '#22D3EE',
                    desc: 'of applicants made it to review',
                  },
                  {
                    label: 'Shortlist → Interview',
                    numerator: data.stats.interviews,
                    denominator: data.stats.shortlisted,
                    color: '#F59E0B',
                    desc: 'of shortlisted reached interview',
                  },
                  {
                    label: 'Interview → Hire',
                    numerator: data.stats.hired,
                    denominator: data.stats.interviews,
                    color: '#10B981',
                    desc: 'of interviews resulted in hire',
                  },
                  {
                    label: 'Overall hire rate',
                    numerator: data.stats.hired,
                    denominator: data.stats.totalApplications,
                    color: '#A78BFA',
                    desc: 'of all applicants were hired',
                  },
                ].map((metric) => {
                  const pct =
                    metric.denominator > 0
                      ? Math.round((metric.numerator / metric.denominator) * 100)
                      : 0;
                  return (
                    <div key={metric.label}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                            {metric.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                            {metric.desc}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: metric.color,
                              fontFamily: 'var(--font-display)',
                              lineHeight: 1,
                            }}
                          >
                            {pct}%
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            ({metric.numerator}/{metric.denominator})
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: '#F1F5F9',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: metric.color,
                            borderRadius: 999,
                            transition: 'width 0.4s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data.stats.totalApplications === 0 && (
                  <EmptyState
                    title="No applications yet"
                    description="Conversion metrics will appear once candidates start applying to your roles."
                  />
                )}
              </div>
            </Panel>
          </div>
        </DashboardSection>

        {/* ── Recent roles ── */}
        <DashboardSection
          id="jobs"
          title="Recent roles"
          description="Your latest job postings with live status, application volume, and deadline."
        >
          <Panel
            title="Role activity"
            description="A high-signal list of your latest jobs and how much candidate attention they are receiving."
          >
            {data.recentJobs.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="dashboard-grid-two"
              >
                {data.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                          {job.title}
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Tag label={formatStatusLabel(job.type)} tone="neutral" />
                          <Tag label={formatStatusLabel(job.locationType)} tone="neutral" />
                          <Tag
                            label={job.isActive ? 'Active' : 'Closed'}
                            tone={statusTone(job.isActive)}
                          />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                          Applications
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 26,
                            fontWeight: 900,
                            color: '#2563EB',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {formatCompactNumber(job.applicationCount)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 14,
                        display: 'grid',
                        gap: 8,
                        color: '#64748B',
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={15} strokeWidth={2} />
                        {job.city || 'Location shared inside role details'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock3 size={15} strokeWidth={2} />
                        Deadline {formatShortDate(job.applicationDeadline)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No jobs posted yet"
                description="Your role list will populate here as soon as your company creates its first opportunity."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Recent applicant flow ── */}
        <DashboardSection
          id="applications"
          title="Recent applicant flow"
          description="The latest candidate records arriving under your employer account."
        >
          <Panel
            title="Incoming applications"
            description="Recent submissions with student context, fit scores, and the role they applied for."
          >
            {data.recentApplications.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {data.recentApplications.map((application) => (
                  <div
                    key={application.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.3fr) auto',
                        gap: 12,
                        alignItems: 'center',
                      }}
                      className="dashboard-inline-grid"
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                            {application.studentName}
                          </div>
                          <Tag label={formatStatusLabel(application.status)} tone="info" />
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
                          {application.jobTitle}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            fontSize: 13,
                            color: '#64748B',
                          }}
                        >
                          {application.university ? <span>{application.university}</span> : null}
                          {application.department ? <span>{application.department}</span> : null}
                          <span>Applied {formatShortDate(application.appliedAt)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                          Fit score
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 28,
                            fontWeight: 900,
                            color: '#2563EB',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {typeof application.fitScore === 'number'
                            ? `${application.fitScore}%`
                            : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No recent applicants"
                description="New applications will appear here automatically as students apply to your roles."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Top candidates ── */}
        <DashboardSection
          id="candidates"
          title="Top candidates"
          description="A ranked shortlist driven by the strongest fit scores in your pipeline."
        >
          <Panel
            title="Best current matches"
            description="Students with the strongest available match signals in your active employer pipeline."
          >
            {data.topCandidates.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="dashboard-grid-two"
              >
                {data.topCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                          {candidate.studentName}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {candidate.jobTitle}
                        </div>
                      </div>
                      <Tag label={`${candidate.fitScore ?? 0}% fit`} tone="success" />
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        fontSize: 13,
                        color: '#64748B',
                      }}
                    >
                      {candidate.university ? <span>{candidate.university}</span> : null}
                      {candidate.department ? <span>{candidate.department}</span> : null}
                      <span>{formatStatusLabel(candidate.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No scored candidates yet"
                description="Once fit scores are generated for incoming applications, stronger matches will appear here."
              />
            )}
          </Panel>
        </DashboardSection>

        <style>{`
          @media (max-width: 1100px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          }
          @media (max-width: 900px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .dashboard-grid-two, .dashboard-grid-three, .dashboard-inline-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
