import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getAdvisorNavItems } from '@/lib/academic-navigation';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  Panel,
  ProgressBar,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import CalendarBoard from '@/components/calendar/CalendarBoard';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';
import { getAdvisorCalendarEvents } from '@/lib/academic-calendar-events';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Linkedin,
  MapPin,
  Target,
  Users,
  Star,
  MessageSquare,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' as const },
  {
    label: 'My Students',
    icon: 'users' as const,
    items: [
      {
        label: 'Attention queue',
        href: '/advisor/dashboard#students',
        description: 'Students that need immediate coaching or intervention.',
        icon: 'users' as const,
      },
      {
        label: 'Upcoming interviews',
        href: '/advisor/dashboard#interviews',
        description: 'Students with approaching interviews that may need support.',
        icon: 'calendar' as const,
      },
      {
        label: 'Skill gaps',
        href: '/advisor/dashboard#skills',
        description: 'Repeated hard-skill gaps across your advisee cohort.',
        icon: 'target' as const,
      },
      {
        label: 'Cohort Reputation',
        href: '/advisor/dashboard#reputation',
        description: 'Aggregated reviews and formal recommendations from employers.',
        icon: 'star' as const,
      },
    ],
  },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'Post Event',
        href: '/advisor/events/new',
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar' as const,
      },
      {
        label: 'My Events',
        href: '/advisor/events',
        description: 'View and manage all your posted events.',
        icon: 'file' as const,
      },
    ],
  },
];

async function getAdvisorExtras(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);
  const [advisor, totalEvents, calendarEvents] = await Promise.all([
    User.findById(oid)
      .select(
        'name email image phone bio city institutionName advisoryDepartment designation linkedinUrl advisorStaffId googleCalendarConnected'
      )
      .lean(),
    Job.countDocuments({ employerId: oid, type: { $in: ['webinar', 'workshop'] } }),
    getAdvisorCalendarEvents(userId, 24),
  ]);
  return { advisor, totalEvents, calendarEvents };
}

export default async function AdvisorDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [data, extras] = await Promise.all([
    getAdvisorDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    getAdvisorExtras(session.user.id),
  ]);

  const { advisor, totalEvents, calendarEvents } = extras;

  const quickStats = [
    { label: 'Advisees', value: String(data.stats.totalAdvisees), color: '#22D3EE' },
    { label: 'Avg Score', value: String(data.stats.avgOpportunityScore), color: '#10B981' },
    { label: 'Avg Profile', value: `${data.stats.avgProfileCompleteness}%`, color: '#F59E0B' },
    { label: 'Events', value: String(totalEvents), color: '#F8FAFC' },
  ];
  const advisorVisualMetrics = [
    { label: 'Score', value: data.stats.avgOpportunityScore, color: '#22D3EE' },
    { label: 'Profile', value: data.stats.avgProfileCompleteness, color: '#10B981' },
    {
      label: 'Quality',
      value: Math.round((data.reputationStats.avgWorkQuality / 5) * 100),
      color: '#F59E0B',
    },
  ];

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={ADVISOR_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="Advisor workspace"
          title={advisor?.name ?? 'Advisor'}
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {advisor?.institutionName && advisor?.advisoryDepartment && (
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
                  {advisor.institutionName} · {advisor.advisoryDepartment}
                </span>
              )}
              {advisor?.designation && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#065F46',
                    fontWeight: 700,
                  }}
                >
                  {advisor.designation}
                </span>
              )}
            </div>
          }
          description={advisor?.bio || 'No bio added yet — go to My Profile to write one.'}
          actions={
            <>
              <ActionLink href="/advisor/events/new" label="Post Event" />
              <ActionLink href="/advisor/students" label="Student Directory" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Advisor profile"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {quickStats.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: s.color,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{ color: '#9FB4D0', fontSize: 12, marginTop: 4, fontWeight: 600 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                    alignItems: 'end',
                    minHeight: 118,
                    padding: '14px 12px 12px',
                    borderRadius: 16,
                    background: 'rgba(15,23,42,0.22)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {advisorVisualMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      style={{
                        height: 92,
                        display: 'grid',
                        gridTemplateRows: '1fr auto',
                        gap: 7,
                        alignItems: 'end',
                        minWidth: 0,
                      }}
                    >
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
                            maxWidth: 44,
                            height: `${Math.max(8, Math.min(metric.value, 100))}%`,
                            borderRadius: '12px 12px 6px 6px',
                            background: metric.color,
                            boxShadow: `0 12px 22px ${metric.color}2E`,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          textAlign: 'center',
                          color: '#CBD5E1',
                          fontSize: 11,
                          fontWeight: 800,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {advisor?.city && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#CBD5E1',
                        fontSize: 12,
                      }}
                    >
                      <MapPin size={12} /> {advisor.city}
                    </div>
                  )}
                  {advisor?.linkedinUrl && (
                    <a
                      href={advisor.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#22D3EE',
                        fontSize: 12,
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <Linkedin size={12} /> LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            </Panel>
          }
        />

        {/* ── Stat cards — 2 plain + 2 with progress bars ── */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            {/* Total advisees — plain stat */}
            <StatCard
              label="Total advisees"
              value={formatCompactNumber(data.stats.totalAdvisees)}
              Icon={Users}
            />

            {/* Avg opportunity score — with progress bar */}
            <div
              style={{
                borderRadius: 22,
                background: '#FFFFFF',
                border: '1px solid #D9E2EC',
                padding: 20,
                boxShadow: '0 16px 32px rgba(15,23,42,0.06)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'rgba(34,211,238,0.08)',
                  color: '#22D3EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={20} strokeWidth={2} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    Avg opportunity score
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: '#22D3EE',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {data.stats.avgOpportunityScore}
                  </div>
                </div>
                <div
                  style={{
                    height: 10,
                    background: '#E2E8F0',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${data.stats.avgOpportunityScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #22D3EE, #06B6D4)',
                      borderRadius: 999,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Avg profile completeness — with progress bar */}
            <div
              style={{
                borderRadius: 22,
                background: '#FFFFFF',
                border: '1px solid #D9E2EC',
                padding: 20,
                boxShadow: '0 16px 32px rgba(15,23,42,0.06)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'rgba(16,185,129,0.08)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={20} strokeWidth={2} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    Avg profile completeness
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: '#10B981',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {data.stats.avgProfileCompleteness}%
                  </div>
                </div>
                <div
                  style={{
                    height: 10,
                    background: '#E2E8F0',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${data.stats.avgProfileCompleteness}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #059669, #10B981)',
                      borderRadius: 999,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Events posted — plain stat */}
            <StatCard
              label="Events posted"
              value={formatCompactNumber(totalEvents)}
              Icon={CalendarDays}
              accent="#7C3AED"
            />
          </div>
        </section>

        {/* ── Student attention queue ── */}
        <DashboardSection
          id="calendar"
          title="Calendar"
          description="Track only your own posted webinars and workshops, including registration deadlines and event dates."
        >
          <CalendarBoard
            events={calendarEvents}
            isCalendarConnected={advisor?.googleCalendarConnected ?? false}
            boardTitle="Calendar"
            boardSubtitle="Monitor only your hosted sessions and registration cutoffs from one board."
            fullCalendarHref="/advisor/calendar"
            manageCalendarHref="/advisor/profile#calendar"
            eventHrefTemplate="/advisor/events/:jobId/registrants"
            emptyNextEventMessage="No hosted advisor events are coming up yet. Post a workshop or webinar to populate this planner."
          />
        </DashboardSection>

        <DashboardSection
          id="students"
          title="Student attention queue"
          description="Students flagged as needing immediate coaching based on low scores, low profile completion, or advisor flags."
        >
          <Panel
            title="Needs review"
            description="Prioritized advisees who are most likely to benefit from direct intervention right now."
            action={
              <Tag
                label={`${data.stats.priorityStudents} priority`}
                tone={data.stats.priorityStudents > 0 ? 'warning' : 'neutral'}
              />
            }
          >
            {data.attentionStudents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                  maxHeight: 400,
                  overflowY: 'auto',
                  paddingRight: 8,
                }}
                className="dashboard-grid-two"
              >
                {data.attentionStudents.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: `1px solid ${student.priorityFlagged ? '#FDE68A' : '#E2E8F0'}`,
                      background: student.priorityFlagged ? '#FFFBEB' : '#FFFFFF',
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
                          {student.name}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {[student.university, student.department].filter(Boolean).join(' · ') ||
                            'Academic info pending'}
                        </div>
                      </div>
                      <Tag
                        label={student.priorityFlagged ? '⚠ Priority' : 'Monitor'}
                        tone={student.priorityFlagged ? 'warning' : 'info'}
                      />
                    </div>
                    <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                      <ProgressBar
                        value={student.opportunityScore}
                        label="Opportunity score"
                        tone={student.opportunityScore < 40 ? 'warning' : 'primary'}
                      />
                      <ProgressBar
                        value={student.profileCompleteness}
                        label="Profile completeness"
                        tone={student.profileCompleteness < 60 ? 'warning' : 'success'}
                      />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {typeof student.cgpa === 'number' ? (
                          <Tag label={`CGPA ${student.cgpa.toFixed(2)}`} tone="neutral" />
                        ) : (
                          <Tag label="CGPA not added" tone="warning" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No students need urgent review"
                description="Priority students will surface here once lower-readiness profiles appear in your advisee set."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Upcoming interviews + skill gaps ── */}
        <DashboardSection
          id="interviews"
          title="Upcoming interviews & skill gaps"
          description="Interview watchlist and the most common skill gaps across your advisee cohort."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Interview watchlist"
              description="Students with interview dates still ahead — prepare them before they step in."
              action={<Tag label={`${data.upcomingInterviews.length} upcoming`} tone="info" />}
            >
              {data.upcomingInterviews.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    maxHeight: 400,
                    overflowY: 'auto',
                    paddingRight: 8,
                  }}
                >
                  {data.upcomingInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      style={{
                        padding: 16,
                        borderRadius: 16,
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
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                            {interview.studentName}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                            {interview.jobTitle} · {interview.companyName}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#2563EB',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          <CalendarClock size={13} />
                          {formatShortDate(interview.scheduledAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming interviews"
                  description="Scheduled interviews will appear here as students reach that stage."
                />
              )}
            </Panel>

            <div id="skills">
              <Panel
                title="Common skill gaps"
                description="Repeated hard-skill issues across advisee applications — useful for planning workshops."
              >
                {data.topSkillGaps.length > 0 ? (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                        marginBottom: 16,
                        padding: 14,
                        borderRadius: 16,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {data.topSkillGaps.slice(0, 4).map((gap, index) => {
                        const width = Math.max(38, 100 - index * 16);
                        const colors = ['#F59E0B', '#22D3EE', '#7C3AED', '#10B981'];
                        const color = colors[index % colors.length];
                        return (
                          <div
                            key={gap}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(96px, 0.9fr) minmax(0, 1.4fr)',
                              gap: 10,
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                color: '#475569',
                                fontSize: 12,
                                fontWeight: 800,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {gap}
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
                                  width: `${width}%`,
                                  height: '100%',
                                  borderRadius: 999,
                                  background: color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.topSkillGaps.map((gap) => (
                        <Tag key={gap} label={gap} tone="warning" />
                      ))}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                      <Link
                        href="/advisor/events/new"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#EDE9FE',
                          color: '#7C3AED',
                          border: '1px solid #DDD6FE',
                          padding: '8px 16px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        📅 Run a workshop on these gaps →
                      </Link>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="No recurring skill gaps yet"
                    description="Skill gaps will appear here as more application scoring data accumulates."
                  />
                )}
              </Panel>
            </div>
          </div>
        </DashboardSection>

        {/* ── Reputation & Verified Reviews ── */}
        <DashboardSection
          id="reputation"
          title="Cohort Reputation & Verified Reviews"
          description="Aggregated review and recommendation data from employer evaluations of your advisees."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
              gap: 16,
            }}
            className="dashboard-grid-two"
          >
            <Panel title="Reputation Overview" description="Advising cohort aggregated feedback.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                    Total Verified Reviews
                  </div>
                  <div style={{ fontSize: 18, color: '#0F172A', fontWeight: 800 }}>
                    {data.reputationStats.totalReviews}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                    Formal Recommendations
                  </div>
                  <div style={{ fontSize: 18, color: '#10B981', fontWeight: 800 }}>
                    {data.reputationStats.totalRecommendations}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: '#FEF3C7',
                    borderRadius: '12px',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                    Avg Work Quality
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: '#B45309',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {data.reputationStats.avgWorkQuality.toFixed(1)}{' '}
                    <Star size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="Recent Company Feedback"
              description="The latest formal endorsements earned by your advisees."
            >
              {data.recentRecommendations && data.recentRecommendations.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    maxHeight: 400,
                    overflowY: 'auto',
                    paddingRight: 8,
                  }}
                >
                  {data.recentRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                            {rec.studentName}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Earned endorsement from{' '}
                            <b style={{ color: '#334155' }}>{rec.companyName}</b>
                          </div>
                        </div>
                        <Tag label="Recommended" tone="success" />
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#475569',
                          lineHeight: 1.6,
                          marginTop: 8,
                          paddingLeft: 12,
                          borderLeft: '2px solid #E2E8F0',
                        }}
                      >
                        &ldquo;{rec.text}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No formal endorsements yet"
                  description="When employers leave formal text recommendations validating an advisee's work, it will appear here."
                />
              )}
            </Panel>
          </div>
        </DashboardSection>

        {/* ── Recent advisor actions ── */}
        <DashboardSection
          id="actions"
          title="Recent advisor activity"
          description="A rolling view of the intervention and planning actions recorded under your advisor account."
        >
          <Panel
            title="Logged actions"
            description="Recent plan updates, notes, and priority flags."
          >
            {data.recentActions.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  maxHeight: 400,
                  overflowY: 'auto',
                  paddingRight: 8,
                }}
              >
                {data.recentActions.map((action) => (
                  <div
                    key={action.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
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
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                          {action.studentName}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {formatStatusLabel(action.actionType)}
                        </div>
                      </div>
                      <Tag label={formatShortDate(action.createdAt)} tone="neutral" />
                    </div>
                    {action.advisorNote && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 13,
                          lineHeight: 1.65,
                          color: '#64748B',
                          background: '#F8FAFC',
                          borderRadius: 8,
                          padding: '8px 12px',
                          borderLeft: '2px solid #E2E8F0',
                        }}
                      >
                        {action.advisorNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No advisor actions recorded yet"
                description="Once you start modifying plans or flagging students, the history will appear here."
              />
            )}
          </Panel>
        </DashboardSection>

        <style>{`
          @media (max-width: 1100px) {
            .dashboard-stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
          @media (max-width: 900px) {
            .dashboard-stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .dashboard-grid-two,
            .dashboard-inline-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
