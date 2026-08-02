// src/app/dept/dashboard/page.tsx
// Department Head dashboard — readiness distribution, skill heatmap,
// industry alignment, semester trend, top students, pipeline

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getDepartmentNavItems } from '@/lib/academic-navigation';
import {
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  ActionLink,
  Panel,
  ProgressBar,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
} from '@/components/dashboard/DashboardContent';
import CalendarBoard from '@/components/calendar/CalendarBoard';
import { getDeptDashboardData } from '@/lib/role-dashboard';
import { getDeptCalendarEvents } from '@/lib/academic-calendar-events';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';
import { BriefcaseBusiness, GraduationCap, LineChart, Sparkles, Target, Users } from 'lucide-react';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import Link from 'next/link';

const navItems = [
  { label: 'Overview', href: '/dept/dashboard', icon: 'dashboard' as const },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'Post Event',
        href: '/dept/events/new',
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar' as const,
      },
      {
        label: 'My Events',
        href: '/dept/events',
        description: 'View and manage all your posted events.',
        icon: 'file' as const,
      },
    ],
  },
  {
    label: 'Cohort',
    icon: 'users' as const,
    items: [
      {
        label: 'Top students',
        href: '/dept/dashboard#students',
        description: 'Track the strongest students by opportunity score and profile readiness.',
        icon: 'users' as const,
      },
      {
        label: 'Pipeline',
        href: '/dept/dashboard#pipeline',
        description: 'See the aggregate hiring journey for your department cohort.',
        icon: 'insights' as const,
      },
    ],
  },
  {
    label: 'Analytics',
    icon: 'insights' as const,
    items: [
      {
        label: 'Skill heatmap',
        href: '/dept/dashboard#heatmap',
        description: 'Most common skills across the department cohort.',
        icon: 'sparkles' as const,
      },
      {
        label: 'Industry alignment',
        href: '/dept/dashboard#alignment',
        description: 'Student skills vs employer demand.',
        icon: 'insights' as const,
      },
      {
        label: 'Semester trend',
        href: '/dept/dashboard#trend',
        description: 'Semester-over-semester readiness trajectory.',
        icon: 'target' as const,
      },
    ],
  },
  {
    label: 'Opportunities',
    icon: 'briefcase' as const,
    items: [
      {
        label: 'Openings',
        href: '/dept/dashboard#openings',
        description: 'Active roles relevant to your university and department.',
        icon: 'briefcase' as const,
      },
      {
        label: 'Benchmarks',
        href: '/dept/dashboard#benchmarks',
        description: 'Department-level thresholds and readiness guardrails.',
        icon: 'target' as const,
      },
    ],
  },
];

async function getDeptExtras(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);
  const [deptHead, totalEvents, calendarEvents] = await Promise.all([
    User.findById(oid)
      .select(
        'name bio city linkedinUrl institutionName advisoryDepartment designation image googleCalendarConnected'
      )
      .lean(),
    Job.countDocuments({ employerId: oid, type: { $in: ['webinar', 'workshop'] } }),
    getDeptCalendarEvents(userId, 24),
  ]);
  return { deptHead, totalEvents, calendarEvents };
}

export default async function DeptDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [data, extras] = await Promise.all([
    getDeptDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    getDeptExtras(session.user.id),
  ]);

  const { deptHead, totalEvents, calendarEvents } = extras;
  const benchmark = data.department.benchmark;
  const { readinessDistribution, skillHeatmap, industryAlignment, semesterTrend } = data;
  const readinessRing = {
    ready: readinessDistribution.ready.pct,
    partial: readinessDistribution.partial.pct,
    notReady: readinessDistribution.notReady.pct,
  };

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        {/* ── Hero ── */}
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="Department Head workspace"
          title={deptHead?.name ?? data.chromeUser.name}
          description={deptHead?.bio || 'No bio added yet — go to My Profile to write one.'}
          subtitle={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {deptHead?.city && (
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
                  📍 {deptHead.city}
                </span>
              )}
              {deptHead?.city && deptHead?.institutionName && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>·</span>
              )}
              {deptHead?.institutionName && deptHead?.advisoryDepartment && (
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
                  {deptHead.institutionName} · {deptHead.advisoryDepartment}
                </span>
              )}
              {deptHead?.designation && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#2563EB',
                    fontWeight: 700,
                  }}
                >
                  {deptHead.designation}
                </span>
              )}
              {deptHead?.linkedinUrl && (
                <Link
                  href={deptHead.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 999,
                    padding: '5px 1px',
                    fontSize: 13,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  🔗 LinkedIn
                </Link>
              )}
            </div>
          }
          actions={
            <>
              <ActionLink href="/dept/events/new" label="Post event" />
              <ActionLink href="/dept/students" label="Student Directory" tone="ghost" />
              <ActionLink href="/dept/advisors" label="Manage Advisors" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Department scope"
              description="Institution and cohort under your view."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {benchmark ? (
                    <Tag label={benchmark.cohort} tone="success" />
                  ) : (
                    <Tag label="Benchmark not set" tone="warning" />
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Dept students', value: data.stats.deptStudents, color: '#22D3EE' },
                    {
                      label: 'University total',
                      value: data.stats.totalStudents,
                      color: '#A78BFA',
                    },
                    { label: 'Events posted', value: totalEvents, color: '#10B981' },
                    {
                      label: 'Avg score',
                      value: `${data.stats.avgOpportunityScore}%`,
                      color: '#F59E0B',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: s.color,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{ fontSize: 11, color: '#9FB4D0', marginTop: 4, fontWeight: 600 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                    gap: 14,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 16,
                    background: 'rgba(15,23,42,0.22)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      background: `conic-gradient(#10B981 0 ${readinessRing.ready}%, #F59E0B ${readinessRing.ready}% ${
                        readinessRing.ready + readinessRing.partial
                      }%, #EF4444 ${readinessRing.ready + readinessRing.partial}% 100%)`,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#0F172A',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#F8FAFC',
                        fontSize: 18,
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {readinessRing.ready}%
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {[
                      { label: 'Ready', value: readinessRing.ready, color: '#10B981' },
                      { label: 'Partial', value: readinessRing.partial, color: '#F59E0B' },
                      { label: 'Not ready', value: readinessRing.notReady, color: '#EF4444' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '72px 1fr 34px',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: '#CBD5E1', fontSize: 11, fontWeight: 700 }}>
                          {item.label}
                        </span>
                        <span
                          style={{
                            height: 6,
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.12)',
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              width: `${item.value}%`,
                              height: '100%',
                              borderRadius: 999,
                              background: item.color,
                            }}
                          />
                        </span>
                        <span
                          style={{
                            color: item.color,
                            fontSize: 11,
                            fontWeight: 900,
                            textAlign: 'right',
                          }}
                        >
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          }
        />

        {/* ── Stat cards ── */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Students"
              value={formatCompactNumber(data.stats.totalStudents)}
              Icon={Users}
            />
            <StatCard
              label="Openings"
              value={formatCompactNumber(data.stats.activeOpenings)}
              Icon={BriefcaseBusiness}
              accent="#22D3EE"
            />
            <StatCard
              label="Applications"
              value={formatCompactNumber(data.stats.totalApplications)}
              Icon={LineChart}
              accent="#2563EB"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hiredStudents)}
              Icon={Sparkles}
              accent="#10B981"
            />
            <StatCard
              label="Avg score"
              value={`${data.stats.avgOpportunityScore}%`}
              Icon={Target}
              accent="#F59E0B"
            />
            <StatCard
              label="Avg CGPA"
              value={data.stats.avgCGPA ? data.stats.avgCGPA.toFixed(2) : '0.00'}
              Icon={GraduationCap}
              accent="#10B981"
            />
          </div>
        </section>

        {/* ── Readiness Distribution ── */}
        <DashboardSection
          id="calendar"
          title="Calendar"
          description="Track only your own posted department events, including registration deadlines and event dates."
        >
          <CalendarBoard
            events={calendarEvents}
            isCalendarConnected={deptHead?.googleCalendarConnected ?? false}
            boardTitle="Calendar"
            boardSubtitle="Keep only your hosted department sessions and registration cutoffs on one board."
            fullCalendarHref="/dept/calendar"
            manageCalendarHref="/dept/profile#calendar"
            eventHrefTemplate="/dept/events/:jobId/registrants"
            emptyNextEventMessage="No hosted department events are coming up yet. Post a workshop or webinar to populate this planner."
          />
        </DashboardSection>

        <DashboardSection
          id="readiness"
          title="Readiness distribution"
          description="How your cohort breaks down across three readiness tiers based on real opportunity scores."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Cohort readiness breakdown"
              description="Percentage of students in each readiness tier right now."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  {
                    label: 'Ready',
                    sublabel: 'Score ≥ 70',
                    count: readinessDistribution.ready.count,
                    pct: readinessDistribution.ready.pct,
                    color: '#10B981',
                    bg: '#ECFDF5',
                    border: '#A7F3D0',
                  },
                  {
                    label: 'Partially Ready',
                    sublabel: 'Score 40–69',
                    count: readinessDistribution.partial.count,
                    pct: readinessDistribution.partial.pct,
                    color: '#F59E0B',
                    bg: '#FFFBEB',
                    border: '#FDE68A',
                  },
                  {
                    label: 'Not Ready',
                    sublabel: 'Score < 40',
                    count: readinessDistribution.notReady.count,
                    pct: readinessDistribution.notReady.pct,
                    color: '#EF4444',
                    bg: '#FEF2F2',
                    border: '#FECACA',
                  },
                ].map((tier) => (
                  <div key={tier.label}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: tier.bg,
                            color: tier.color,
                            border: `1px solid ${tier.border}`,
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {tier.label}
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{tier.sublabel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>
                          {tier.pct}%
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          ({tier.count} students)
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: '#F1F5F9',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${tier.pct}%`,
                          height: '100%',
                          background: tier.color,
                          borderRadius: 999,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Visual summary bar */}
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{ height: 16, borderRadius: 999, overflow: 'hidden', display: 'flex' }}
                  >
                    <div
                      style={{
                        width: `${readinessDistribution.ready.pct}%`,
                        background: '#10B981',
                        transition: 'width 0.4s',
                      }}
                    />
                    <div
                      style={{
                        width: `${readinessDistribution.partial.pct}%`,
                        background: '#F59E0B',
                        transition: 'width 0.4s',
                      }}
                    />
                    <div
                      style={{
                        width: `${readinessDistribution.notReady.pct}%`,
                        background: '#EF4444',
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 6,
                      fontSize: 11,
                      color: '#94A3B8',
                    }}
                  >
                    <span style={{ color: '#10B981', fontWeight: 600 }}>
                      Ready {readinessDistribution.ready.pct}%
                    </span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                      Partial {readinessDistribution.partial.pct}%
                    </span>
                    <span style={{ color: '#EF4444', fontWeight: 600 }}>
                      Not ready {readinessDistribution.notReady.pct}%
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Pipeline */}
            <div id="pipeline">
              <Panel
                title="Hiring pipeline"
                description="Aggregate application movement across the cohort."
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.pipeline.map((stage) => (
                    <div
                      key={stage.label}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 14,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        {stage.label}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: '#2563EB',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {formatCompactNumber(stage.count)}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </DashboardSection>

        {/* ── Skill Heatmap ── */}
        <DashboardSection
          id="heatmap"
          title="Skill heatmap"
          description="The most commonly held skills across your department cohort — thicker bars mean higher penetration."
        >
          <Panel
            title="Department skill coverage"
            description="Sorted by how many students in your department have each skill."
          >
            {skillHeatmap.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {skillHeatmap.map((item, i) => (
                  <div key={item.skill}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                          {item.skill}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          {item.count} students
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color:
                              item.pct >= 60 ? '#10B981' : item.pct >= 30 ? '#F59E0B' : '#94A3B8',
                          }}
                        >
                          {item.pct}%
                        </span>
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
                          width: `${item.pct}%`,
                          height: '100%',
                          borderRadius: 999,
                          background:
                            item.pct >= 60
                              ? 'linear-gradient(90deg, #10B981, #34D399)'
                              : item.pct >= 30
                                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                                : 'linear-gradient(90deg, #94A3B8, #CBD5E1)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No skill data yet"
                description="Skills will appear once students complete their profiles."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Industry Alignment ── */}
        <DashboardSection
          id="alignment"
          title="Industry demand alignment"
          description="Comparing what employers require against what your students actually have — red gaps need attention."
        >
          <Panel
            title="Skills: student supply vs employer demand"
            description="Each row shows how much of a skill students have vs how often employers ask for it."
          >
            {industryAlignment.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 120px 80px',
                    gap: 12,
                    padding: '8px 12px',
                    marginBottom: 4,
                  }}
                >
                  {['Skill', 'Student supply', 'Employer demand', 'Gap'].map((h) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {industryAlignment.map((item, i) => (
                  <div
                    key={item.skill}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 120px 80px',
                      gap: 12,
                      padding: '12px',
                      borderRadius: 12,
                      background: i % 2 === 0 ? '#F8FAFC' : '#fff',
                      border: '1px solid #E2E8F0',
                      marginBottom: 6,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {item.skill}
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, marginBottom: 4 }}
                      >
                        {item.supplyPct}%
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: '#E2E8F0',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.supplyPct}%`,
                            height: '100%',
                            background: '#2563EB',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 12, color: '#7C3AED', fontWeight: 700, marginBottom: 4 }}
                      >
                        {item.demandPct}%
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: '#E2E8F0',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.demandPct}%`,
                            height: '100%',
                            background: '#7C3AED',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      {item.gap ? (
                        <span
                          style={{
                            background: '#FEF2F2',
                            color: '#EF4444',
                            border: '1px solid #FECACA',
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Gap
                        </span>
                      ) : (
                        <span
                          style={{
                            background: '#ECFDF5',
                            color: '#10B981',
                            border: '1px solid #A7F3D0',
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          OK
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{ width: 12, height: 12, borderRadius: 3, background: '#2563EB' }}
                    />
                    <span style={{ fontSize: 12, color: '#64748B' }}>Student supply</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{ width: 12, height: 12, borderRadius: 3, background: '#7C3AED' }}
                    />
                    <span style={{ fontSize: 12, color: '#64748B' }}>Employer demand</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No alignment data"
                description="Data will populate once employers post targeted jobs and students complete profiles."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Semester Trend ── */}
        <DashboardSection
          id="trend"
          title="Semester-over-semester trend"
          description="How cohort readiness and academic performance have changed across semesters."
        >
          <Panel
            title="Readiness trajectory by semester"
            description="Average opportunity score and CGPA per semester group."
          >
            {semesterTrend.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {semesterTrend.map((sem, i) => (
                  <div
                    key={sem.semester}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: i === semesterTrend.length - 1 ? '#F0F9FF' : '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                          {sem.semester}
                        </div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                          {sem.studentCount} students
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color:
                                sem.avgScore >= 70
                                  ? '#10B981'
                                  : sem.avgScore >= 40
                                    ? '#F59E0B'
                                    : '#EF4444',
                              fontFamily: 'var(--font-display)',
                              lineHeight: 1,
                            }}
                          >
                            {sem.avgScore}%
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                            Avg score
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: '#22D3EE',
                              fontFamily: 'var(--font-display)',
                              lineHeight: 1,
                            }}
                          >
                            {sem.avgCGPA.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                            Avg CGPA
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#94A3B8',
                            marginBottom: 4,
                            fontWeight: 600,
                          }}
                        >
                          Opportunity Score
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
                              width: `${sem.avgScore}%`,
                              height: '100%',
                              background:
                                sem.avgScore >= 70
                                  ? '#10B981'
                                  : sem.avgScore >= 40
                                    ? '#F59E0B'
                                    : '#EF4444',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#94A3B8',
                            marginBottom: 4,
                            fontWeight: 600,
                          }}
                        >
                          CGPA (out of 4.0)
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
                              width: `${Math.min((sem.avgCGPA / 4) * 100, 100)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #22D3EE, #2563EB)',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No semester data yet"
                description="Trends will appear once students fill in their current semester fields."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Benchmarks ── */}
        <DashboardSection
          id="benchmarks"
          title="Benchmark posture"
          description="Departmental thresholds used to assess whether the cohort is on track."
        >
          <Panel
            title="Benchmark thresholds"
            description="The active cohort baseline for readiness, fit, and academic strength."
          >
            {benchmark ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <ProgressBar value={benchmark.minReadinessScore} label="Minimum readiness score" />
                <ProgressBar
                  value={benchmark.minFitScore}
                  label="Minimum fit score"
                  tone="warning"
                />
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>
                      Minimum CGPA
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                      {benchmark.minCGPA.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: '#E2E8F0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min((benchmark.minCGPA / 4) * 100, 100)}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #10B981, #22D3EE)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <EmptyState
                  title="No active benchmark"
                  description="Set a department benchmark to compare cohort health against your desired threshold."
                />
              </div>
            )}
          </Panel>
        </DashboardSection>

        {/* ── Top Students ── */}
        <DashboardSection
          id="students"
          title="Top students"
          description="Ranked by opportunity score across the university."
        >
          <Panel
            title="Leaders in the cohort"
            description="Top-performing students by opportunity score, profile completion, and CGPA."
          >
            {data.topStudents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="dashboard-grid-two"
              >
                {data.topStudents.map((student, i) => (
                  <div
                    key={student.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#fff',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background:
                              i < 3 ? 'linear-gradient(135deg, #F59E0B, #FBBF24)' : '#EFF6FF',
                            color: i < 3 ? '#fff' : '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            {student.department ?? 'Dept unknown'}
                            {student.yearOfStudy ? ` · Year ${student.yearOfStudy}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color:
                              student.opportunityScore >= 70
                                ? '#10B981'
                                : student.opportunityScore >= 40
                                  ? '#F59E0B'
                                  : '#EF4444',
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                          }}
                        >
                          {student.opportunityScore}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>score</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                      <ProgressBar value={student.opportunityScore} label="Opportunity score" />
                      <ProgressBar
                        value={student.profileCompleteness}
                        label="Profile completeness"
                        tone="success"
                      />
                      {typeof student.cgpa === 'number' && (
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}
                        >
                          <span style={{ color: '#64748B', fontWeight: 600 }}>CGPA</span>
                          <span style={{ color: '#0F172A', fontWeight: 800 }}>
                            {student.cgpa.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No student data yet"
                description="Top students will appear once your department has student records matching this scope."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Openings + Skill Snapshot ── */}
        <DashboardSection
          id="openings"
          title="Relevant openings"
          description="Active roles aligned with your institution and department targeting."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel title="Upcoming openings" description="Open roles sorted by closing date.">
              {data.upcomingOpenings.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.upcomingOpenings.map((opening) => (
                    <div
                      key={opening.id}
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        background: '#fff',
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
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                            {opening.title}
                          </div>
                          <div style={{ marginTop: 3, fontSize: 13, color: '#64748B' }}>
                            {opening.companyName}
                          </div>
                        </div>
                        <Tag label={opening.type} tone="neutral" />
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#64748B',
                        }}
                      >
                        <span>{formatCompactNumber(opening.applicationCount)} applicants</span>
                        {opening.deadline && (
                          <span>Deadline {formatShortDate(opening.deadline)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No matching openings"
                  description="Relevant active roles will appear once employers post jobs targeting this department."
                />
              )}
            </Panel>

            <Panel
              title="Skill snapshot"
              description="Most repeated skills across the department cohort."
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.skillSnapshot.length > 0 ? (
                  data.skillSnapshot.map((skill) => <Tag key={skill} label={skill} tone="info" />)
                ) : (
                  <EmptyState
                    title="No skill snapshot yet"
                    description="Once students populate skill data, recurring themes will appear here."
                  />
                )}
              </div>
            </Panel>
          </div>
        </DashboardSection>

        <style>{`
          @media (max-width: 1200px) {
            .dashboard-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          }
          @media (max-width: 900px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .dashboard-grid-two { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
