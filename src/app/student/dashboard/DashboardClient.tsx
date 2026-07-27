'use client';

import type { DashboardData } from '@/lib/student-dashboard';
import type { UpcomingCalendarEvent } from '@/lib/calendar-events';
import type { StudentAcademicReviewSummary } from '@/lib/academic-feedback';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
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
  TrendLine,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
  getDaysLeftLabel,
} from '@/components/dashboard/DashboardContent';
import CalendarWidget from '@/components/calendar/CalendarWidget';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Gauge,
  MapPin,
  Rocket,
  Trophy,
} from 'lucide-react';

function formatCurrency(value?: number) {
  if (!value || value <= 0) return 'Negotiable';
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusTone(status: string): 'info' | 'success' | 'warning' | 'neutral' {
  if (status === 'hired') return 'success';
  if (['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(status)) {
    return 'info';
  }
  if (status === 'rejected' || status === 'withdrawn') return 'warning';
  return 'neutral';
}

/* ── Chart color tokens — reuse the same palette already used across the dashboard, no gradients ── */
const CHART_COLORS = {
  blue: '#2563EB',
  green: '#10B981',
  amber: '#F59E0B',
  cyan: '#22D3EE',
  indigo: '#6366F1',
  slate: '#94A3B8',
};

function ScoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '8px 12px',
        boxShadow: '0 12px 24px rgba(15,23,42,0.10)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
        {formatShortDate(label ?? '')}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginTop: 2 }}>
        {payload[0].value} pts
      </div>
    </div>
  );
}

function PipelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; color: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '8px 12px',
        boxShadow: '0 12px 24px rgba(15,23,42,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: item.payload.color,
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{item.payload.name}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginTop: 2 }}>
        {formatCompactNumber(item.value)}
      </div>
    </div>
  );
}

interface DashboardClientProps {
  data: DashboardData;
  userId: string;
  calendarEvents: UpcomingCalendarEvent[];
  isCalendarConnected: boolean;
  initialAcademicReviews?: StudentAcademicReviewSummary[];
  previewShell?: {
    role: 'advisor' | 'departmentHead';
    roleLabel: string;
    homeHref: string;
    navItems: DashboardNavItem[];
    user: {
      name: string;
      email: string;
      image?: string;
      subtitle: string;
      unreadNotifications: number;
      unreadMessages: number;
      userId?: string;
    };
    browseHref: string;
    applicationsHref: string;
  };
}

export default function DashboardClient({
  data,
  userId,
  calendarEvents,
  isCalendarConnected,
  initialAcademicReviews,
  previewShell,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasTriggeredCalendarSync = useRef(false);
  const [academicReviews, setAcademicReviews] = useState<StudentAcademicReviewSummary[]>(
    initialAcademicReviews ?? []
  );
  const profileSubtitle = [data.profile.university, data.profile.department]
    .filter(Boolean)
    .join(' | ');
  const shellRole = previewShell?.role ?? 'student';
  const shellRoleLabel = previewShell?.roleLabel ?? 'Student dashboard';
  const shellHomeHref = previewShell?.homeHref ?? '/student/dashboard';
  const shellNavItems = previewShell?.navItems ?? STUDENT_NAV_ITEMS;
  const shellUser = previewShell?.user ?? {
    name: data.profile.name,
    email: data.profile.email,
    image: data.profile.image,
    subtitle: profileSubtitle || 'Student workspace',
    userId,
    unreadNotifications: data.profile.unreadNotifications,
    unreadMessages: data.profile.unreadMessages,
  };
  const browseHref = previewShell?.browseHref ?? '/student/jobs';
  const applicationsHref = previewShell?.applicationsHref ?? '/student/applications';

  useEffect(() => {
    if (!isCalendarConnected) return;
    if (searchParams.get('calendar') !== 'connected') return;
    if (hasTriggeredCalendarSync.current) return;

    hasTriggeredCalendarSync.current = true;
    let isActive = true;

    void (async () => {
      try {
        await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resync: true }),
        });
      } catch (error) {
        console.error('[CALENDAR AUTO-SYNC ERROR]', error);
      } finally {
        if (!isActive) return;
        router.replace('/student/dashboard#calendar');
        router.refresh();
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isCalendarConnected, router, searchParams]);

  useEffect(() => {
    if (previewShell || initialAcademicReviews) return;

    let isActive = true;

    void (async () => {
      try {
        const res = await fetch('/api/student/academic-feedback');
        const feedback = (await res.json()) as { reviews?: StudentAcademicReviewSummary[] };
        if (!isActive) return;
        setAcademicReviews(feedback.reviews ?? []);
      } catch (error) {
        console.error('[STUDENT DASHBOARD REVIEWS ERROR]', error);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [initialAcademicReviews, previewShell]);

  /* ── Presentation-only derived chart data — no new fetches, purely reshaping props already in `data` ── */
  const pipelineChartData = useMemo(
    () => [
      { name: 'Applied', value: data.stats.totalApplications, color: CHART_COLORS.blue },
      { name: 'Shortlisted', value: data.stats.shortlisted, color: CHART_COLORS.green },
      { name: 'Hired', value: data.stats.hired, color: CHART_COLORS.amber },
    ],
    [data.stats.totalApplications, data.stats.shortlisted, data.stats.hired]
  );

  const skillGapChartData = useMemo(
    () => [
      { name: 'Hard gaps', value: data.skillGapSummary.totalHardGaps, color: CHART_COLORS.amber },
      { name: 'Soft gaps', value: data.skillGapSummary.totalSoftGaps, color: CHART_COLORS.cyan },
      { name: 'Closed', value: data.skillGapSummary.closedGapsCount, color: CHART_COLORS.green },
    ],
    [
      data.skillGapSummary.totalHardGaps,
      data.skillGapSummary.totalSoftGaps,
      data.skillGapSummary.closedGapsCount,
    ]
  );
  const skillGapTotal = skillGapChartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <DashboardShell
      role={shellRole}
      roleLabel={shellRoleLabel}
      homeHref={shellHomeHref}
      navItems={shellNavItems}
      user={shellUser}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Student workspace"
          title={data.profile.name}
          subtitle={
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 10px',
                marginTop: 4,
                alignItems: 'center',
              }}
            >
              {data.profile.city && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {data.profile.city}
                </span>
              )}
              {data.profile.city && (data.profile.university || data.profile.department) && (
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
              )}
              {data.profile.university && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  {data.profile.university}
                </span>
              )}
              {data.profile.department && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  {data.profile.department}
                </span>
              )}
              {(data.profile.isGraduated || data.profile.yearOfStudy) && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  {data.profile.isGraduated ? 'Graduated' : `Year ${data.profile.yearOfStudy}`}
                </span>
              )}
              {data.profile.email && (
                <Link
                  href={`mailto:${data.profile.email}`}
                  title={data.profile.email}
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
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email Address
                </Link>
              )}
            </div>
          }
          description={data.profile.bio || 'No bio added yet — go to My Profile to write one.'}
          actions={
            <>
              <ActionLink href={browseHref} label="Browse Jobs" />
              <ActionLink href={applicationsHref} label="My Applications" tone="ghost" />
            </>
          }
          aside={
            <div
              style={{
                position: 'relative',
                height: '100%',
                borderRadius: 24,
                padding: 22,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 20px 45px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
                overflow: 'hidden',
              }}
            >
              {/* soft glow accent */}
              <div
                style={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* scrim — soft gradient over the right portion, tinted with the hero's own mid-blue */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(100deg, rgba(42,92,224,0) 0%, rgba(42,92,224,0) 55%, rgba(42,92,224,0.30) 78%, rgba(42,92,224,0.46) 100%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', display: 'grid', gap: 16 }}>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Profile pulse
                  </h3>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.72)',
                    }}
                  >
                    A live summary of how complete and competitive your profile looks right now.
                  </p>
                </div>

                {/* Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#BFE0FF',
                      background: 'rgba(96,165,250,0.16)',
                      border: '1px solid rgba(147,197,253,0.35)',
                    }}
                  >
                    {data.profile.opportunityScore} opportunity score
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#A7F3D0',
                      background: 'rgba(16,185,129,0.16)',
                      border: '1px solid rgba(110,231,183,0.35)',
                    }}
                  >
                    {data.profile.profileCompleteness}% complete
                  </span>
                  {typeof data.stats.leaderboardRank === 'number' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#FDE68A',
                        background: 'rgba(245,158,11,0.16)',
                        border: '1px solid rgba(252,211,77,0.35)',
                      }}
                    >
                      Rank #{data.stats.leaderboardRank}
                    </span>
                  ) : null}
                </div>

                {/* Progress bars */}
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 7,
                      }}
                    >
                      <span
                        style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}
                      >
                        Profile completeness
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF' }}>
                        {data.profile.profileCompleteness}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 8,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.14)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, data.profile.profileCompleteness))}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #60A5FA, #22D3EE)',
                          boxShadow: '0 0 10px rgba(34,211,238,0.55)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 7,
                      }}
                    >
                      <span
                        style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}
                      >
                        Opportunity readiness
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF' }}>
                        {data.profile.opportunityScore}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 8,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.14)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, data.profile.opportunityScore))}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #34D399, #6EE7B7)',
                          boxShadow: '0 0 10px rgba(52,211,153,0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Skill chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.profile.skills.length > 0 ? (
                    data.profile.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 11px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.92)',
                          background: 'rgba(255,255,255,0.10)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 11px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#FDE68A',
                        background: 'rgba(245,158,11,0.16)',
                        border: '1px solid rgba(252,211,77,0.35)',
                      }}
                    >
                      Add skills to improve matching
                    </span>
                  )}
                </div>
              </div>
            </div>
          }
        />

        {/* ── Stat cards ── */}
        <section className="dashboard-fade-in" style={{ marginTop: 22, animationDelay: '40ms' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Applications sent"
              value={formatCompactNumber(data.stats.totalApplications)}
              hint="Dynamic count from your current application records."
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(data.stats.shortlisted)}
              hint="Includes reviewed, shortlisted, and interview-stage opportunities."
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hired)}
              hint="Confirmed placements that reached hired status."
              Icon={Trophy}
              accent="#F59E0B"
            />
            <StatCard
              label="Average fit score"
              value={`${data.stats.avgFitScore}%`}
              hint="Calculated from applications where fit scoring has already been generated."
              Icon={Gauge}
              accent="#22D3EE"
            />
          </div>

          {/* ── Compact pipeline bar chart — same three numbers as the stat cards above, visualized ── */}
          <div style={{ marginTop: 14 }}>
            <Panel
              title="Pipeline snapshot"
              description="How your applications are distributed across the pipeline right now."
            >
              <div style={{ width: '100%', height: 108 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                    barCategoryGap={14}
                  >
                    <CartesianGrid horizontal={false} stroke="#EEF2F7" />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={82}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                      content={<PipelineTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={22}
                      animationDuration={700}
                    >
                      {pipelineChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </section>

        {/* ── Score trend + Calendar side by side ── */}
        <div className="dashboard-fade-in" style={{ animationDelay: '80ms' }}>
          <DashboardSection
            id="reviews"
            title="Academic reviews"
            description="Open this section to read the profile reviews your advisor or department head has saved for you."
          >
            <details
              style={{
                borderRadius: 22,
                border: '1px solid #D9E2EC',
                background: '#FFFFFF',
                boxShadow: '0 16px 32px rgba(15,23,42,0.06)',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  listStyle: 'none',
                  cursor: 'pointer',
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: '#1E293B',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      View saved academic reviews
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                      {academicReviews.length > 0
                        ? `${academicReviews.length} review${academicReviews.length === 1 ? '' : 's'} available`
                        : 'No academic reviews have been added yet'}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    border: '1px solid #DBEAFE',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    flexShrink: 0,
                  }}
                >
                  <ChevronDown size={18} />
                </span>
              </summary>

              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  padding: 22,
                  background: '#F8FAFC',
                }}
              >
                {academicReviews.length > 0 ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {academicReviews.map((review) => {
                      const tone =
                        review.readinessLevel === 'ready'
                          ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
                          : review.readinessLevel === 'priority_support'
                            ? { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' }
                            : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };

                      return (
                        <div
                          key={review.id}
                          className="dashboard-hover-card"
                          style={{
                            borderRadius: 18,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            padding: 18,
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
                                  fontWeight: 800,
                                  color: '#1E293B',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                {review.headline}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
                                {review.reviewer.name}
                                {review.reviewer.designation
                                  ? ` · ${review.reviewer.designation}`
                                  : ''}
                                {review.reviewer.institution
                                  ? ` · ${review.reviewer.institution}`
                                  : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <Tag
                                label={review.readinessLevel.replace(/_/g, ' ')}
                                tone={
                                  review.readinessLevel === 'ready'
                                    ? 'success'
                                    : review.readinessLevel === 'priority_support'
                                      ? 'warning'
                                      : 'info'
                                }
                              />
                              {typeof review.profileScore === 'number' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    borderRadius: 999,
                                    background: tone.bg,
                                    border: `1px solid ${tone.border}`,
                                    color: tone.color,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  Profile {review.profileScore}%
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p
                            style={{
                              margin: '12px 0 0',
                              fontSize: 14,
                              lineHeight: 1.7,
                              color: '#475569',
                            }}
                          >
                            {review.summary}
                          </p>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: 12,
                              marginTop: 14,
                            }}
                            className="dashboard-review-grid"
                          >
                            <div
                              style={{
                                borderRadius: 16,
                                border: '1px solid #A7F3D0',
                                background: '#ECFDF5',
                                padding: 14,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: '#166534',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.8,
                                }}
                              >
                                Strengths
                              </div>
                              <div
                                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}
                              >
                                {review.strengths.length > 0 ? (
                                  review.strengths.map((item) => (
                                    <Tag
                                      key={`${review.id}:${item}:strength`}
                                      label={item}
                                      tone="success"
                                    />
                                  ))
                                ) : (
                                  <span style={{ fontSize: 13, color: '#64748B' }}>
                                    No strengths listed.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                borderRadius: 16,
                                border: '1px solid #FDE68A',
                                background: '#FFFBEB',
                                padding: 14,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: '#92400E',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.8,
                                }}
                              >
                                Growth areas
                              </div>
                              <div
                                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}
                              >
                                {review.growthAreas.length > 0 ? (
                                  review.growthAreas.map((item) => (
                                    <Tag
                                      key={`${review.id}:${item}:gap`}
                                      label={item}
                                      tone="warning"
                                    />
                                  ))
                                ) : (
                                  <span style={{ fontSize: 13, color: '#64748B' }}>
                                    No growth areas listed.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
                            Added {formatShortDate(review.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No reviews yet"
                    description="When your advisor or department head saves a profile review, it will appear here."
                  />
                )}
              </div>
            </details>
          </DashboardSection>
        </div>

        <div className="dashboard-fade-in" style={{ animationDelay: '120ms' }}>
          <DashboardSection
            id="score"
            title="Readiness and schedule"
            description="Track your score movement, then scroll straight into a month-view planner for deadlines and interviews."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
              className="dashboard-grid-two"
            >
              <Panel
                title="Opportunity score trend"
                description="Recent score movements based on profile changes, achievements, and application activity."
                action={<Tag label={`${data.stats.totalBadges} badges earned`} tone="info" />}
              >
                {data.scoreHistory.length > 0 ? (
                  <div style={{ width: '100%', height: 168 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.scoreHistory}
                        margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} stroke="#EEF2F7" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value: string) => formatShortDate(value)}
                          tick={{ fill: '#94A3B8', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#E2E8F0' }}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: '#94A3B8', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <Tooltip content={<ScoreTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#2563EB"
                          strokeWidth={2.5}
                          fill="#2563EB"
                          fillOpacity={0.1}
                          dot={{ r: 3, stroke: '#2563EB', strokeWidth: 2, fill: '#FFFFFF' }}
                          activeDot={{ r: 5 }}
                          animationDuration={900}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <TrendLine values={data.scoreHistory.map((point) => point.score)} />
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                    marginTop: 18,
                  }}
                  className="dashboard-mini-grid"
                >
                  {data.scoreHistory.slice(-3).map((point) => (
                    <div
                      key={`${point.date}-${point.reason}`}
                      className="dashboard-hover-card"
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        background: `${CHART_COLORS.cyan}0C`,
                        border: `1px solid ${CHART_COLORS.cyan}30`,
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                        {formatShortDate(point.date)}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 24,
                          fontWeight: 900,
                          color: '#1E293B',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {point.score}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: point.delta >= 0 ? '#10B981' : '#F59E0B',
                          fontWeight: 700,
                        }}
                      >
                        {point.delta >= 0 ? '+' : ''}
                        {point.delta} points
                      </div>
                      <div
                        style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: '#64748B' }}
                      >
                        {point.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* ── CalendarWidget lives here ── */}
              <div id="calendar">
                <CalendarWidget events={calendarEvents} isCalendarConnected={isCalendarConnected} />
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* ── Deadlines ── */}
        <div className="dashboard-fade-in" style={{ animationDelay: '160ms' }}>
          <DashboardSection
            id="deadlines"
            title="Priority deadlines"
            description="Roles you already engaged with that need attention soon."
          >
            <Panel
              title="Upcoming deadlines"
              action={
                <Tag
                  label={`${data.deadlines.length} active`}
                  tone={data.deadlines.length > 0 ? 'warning' : 'neutral'}
                />
              }
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {data.deadlines.length > 0 ? (
                  data.deadlines.map((deadline) => (
                    <div
                      key={deadline._id}
                      className="dashboard-hover-card"
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        background: `${CHART_COLORS.amber}0C`,
                        border: `1px solid ${CHART_COLORS.amber}30`,
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
                            {deadline.jobTitle}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                            {deadline.companyName}
                          </div>
                        </div>
                        <Tag
                          label={getDaysLeftLabel(deadline.daysLeft)}
                          tone={deadline.daysLeft <= 2 ? 'warning' : 'info'}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          color: '#64748B',
                          fontSize: 13,
                        }}
                      >
                        <CalendarClock size={15} strokeWidth={2} />
                        Deadline: {formatShortDate(deadline.deadline)}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Nothing urgent right now"
                    description="Upcoming deadlines will appear here once you apply to active opportunities."
                  />
                )}
              </div>
            </Panel>
          </DashboardSection>
        </div>

        {/* ── Recent applications ── */}
        <div className="dashboard-fade-in" style={{ animationDelay: '200ms' }}>
          <DashboardSection
            id="applications"
            title="Recent application activity"
            description="Everything here is coming from your latest application records, so the state stays aligned with the database."
          >
            <Panel
              title="Latest submissions"
              description="Recent applications, their current pipeline stage, and the fit score already computed for each role."
            >
              {data.recentApplications.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.recentApplications.map((application) => (
                    <div
                      key={application._id}
                      className="dashboard-hover-card"
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
                              {application.jobTitle}
                            </div>
                            <Tag
                              label={formatStatusLabel(application.status)}
                              tone={getStatusTone(application.status)}
                            />
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              flexWrap: 'wrap',
                              color: '#64748B',
                              fontSize: 13,
                            }}
                          >
                            <span>{application.companyName}</span>
                            {application.industry ? <span>{application.industry}</span> : null}
                            <span>Applied {formatShortDate(application.appliedAt)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                            Fit score
                          </div>
                          <div
                            style={{
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
                  title="No applications yet"
                  description="Once you apply to jobs or internships, your live pipeline will show up here."
                />
              )}
            </Panel>
          </DashboardSection>
        </div>

        {/* ── Recommended jobs ── */}
        <div className="dashboard-fade-in" style={{ animationDelay: '240ms' }}>
          <DashboardSection
            id="recommended"
            title="Recommended opportunities"
            description="Suggestions below are based on active jobs that still match your current department, skills, and profile direction."
          >
            {data.recommendedJobs.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 16,
                }}
                className="dashboard-card-grid"
              >
                {data.recommendedJobs.map((job) => (
                  <div key={job._id} className="dashboard-hover-card" style={{ borderRadius: 22 }}>
                    <Panel
                      title={job.title}
                      description={job.companyName}
                      action={<Tag label={`${job.fitScore ?? 0}% match`} tone="info" />}
                    >
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Tag label={formatStatusLabel(job.type)} tone="neutral" />
                          <Tag label={formatStatusLabel(job.locationType)} tone="neutral" />
                          {job.city ? <Tag label={job.city} tone="neutral" /> : null}
                        </div>
                        <div style={{ display: 'grid', gap: 8, color: '#64748B', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={15} strokeWidth={2} />
                            {job.city || 'Location shared on application review'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Rocket size={15} strokeWidth={2} />
                            {job.whyRecommended || 'Matches your profile'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock3 size={15} strokeWidth={2} />
                            Deadline {formatShortDate(job.applicationDeadline)}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            paddingTop: 6,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                              Compensation
                            </div>
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 15,
                                color: '#1E293B',
                                fontWeight: 800,
                              }}
                            >
                              {formatCurrency(job.stipendBDT)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                              Applications
                            </div>
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 15,
                                color: '#1E293B',
                                fontWeight: 800,
                              }}
                            >
                              {formatCompactNumber(job.applicationCount)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {job.requiredSkills.length > 0 ? (
                            job.requiredSkills.map((skill) => (
                              <Tag key={skill} label={skill} tone="neutral" />
                            ))
                          ) : (
                            <Tag label="General match" tone="neutral" />
                          )}
                        </div>
                      </div>
                    </Panel>
                  </div>
                ))}
              </div>
            ) : (
              <Panel
                title="No fresh matches yet"
                description="As new roles enter the database or your profile improves, this section will update automatically."
              >
                <EmptyState
                  title="Your recommendations are catching up"
                  description="Complete more profile details or add skills to unlock stronger matches."
                />
              </Panel>
            )}
          </DashboardSection>
        </div>

        {/* ── Skills & credentials ── */}
        <div className="dashboard-fade-in" style={{ animationDelay: '280ms' }}>
          <DashboardSection
            id="skills"
            title="Skills and credentials"
            description="This combines badge activity with the hard and soft gaps detected across your existing applications."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
              className="dashboard-grid-two"
            >
              <Panel
                title="Skill gap summary"
                description="Live insight into the competencies that most often hold your applications back."
              >
                <div style={{ display: 'grid', gap: 18 }}>
                  {/* ── Donut chart is the primary view now — bigger, with a bold, highlighted total ── */}
                  {skillGapTotal > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                      }}
                      className="dashboard-donut-row"
                    >
                      <div style={{ position: 'relative', width: 176, height: 176, flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={skillGapChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={58}
                              outerRadius={86}
                              paddingAngle={3}
                              stroke="none"
                              animationDuration={700}
                            >
                              {skillGapChartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<PipelineTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 40,
                              fontWeight: 900,
                              color: '#1E293B',
                              lineHeight: 1,
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {skillGapTotal}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: '#94A3B8',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                            }}
                          >
                            total gaps
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 12, flex: 1, minWidth: 0 }}>
                        {skillGapChartData.map((entry) => (
                          <div
                            key={entry.name}
                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: entry.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{ fontSize: 13, color: '#64748B', flex: 1, fontWeight: 600 }}
                            >
                              {entry.name}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No skill gaps recorded"
                      description="Once applications generate hard- or soft-skill feedback, they'll be charted here."
                    />
                  )}

                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}
                    >
                      Most common hard-skill gaps
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {data.skillGapSummary.topHardGaps.length > 0 ? (
                        data.skillGapSummary.topHardGaps.map((item) => (
                          <Tag key={item} label={item} tone="warning" />
                        ))
                      ) : (
                        <Tag label="No hard gaps detected" tone="success" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}
                    >
                      Most common soft-skill gaps
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {data.skillGapSummary.topSoftGaps.length > 0 ? (
                        data.skillGapSummary.topSoftGaps.map((item) => (
                          <Tag key={item} label={item} tone="info" />
                        ))
                      ) : (
                        <Tag label="No soft gaps detected" tone="success" />
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Recent badges"
                description="Recognition already awarded to your profile and ready to support future ranking and trust signals."
              >
                <div id="badges" style={{ display: 'grid', gap: 12 }}>
                  {data.recentBadges.length > 0 ? (
                    data.recentBadges.map((badge) => (
                      <div
                        key={`${badge.badgeSlug}-${badge.awardedAt}`}
                        className="dashboard-hover-card"
                        style={{
                          padding: 16,
                          borderRadius: 18,
                          background: `${CHART_COLORS.indigo}0C`,
                          border: `1px solid ${CHART_COLORS.indigo}30`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              background: '#EFF6FF',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Award size={20} strokeWidth={2} />
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                              {badge.badgeName}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>
                              Awarded {formatShortDate(badge.awardedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No badges awarded yet"
                      description="Badges will appear here once profile and activity milestones are completed."
                    />
                  )}
                </div>
              </Panel>
            </div>
          </DashboardSection>
        </div>

        <style>{`
          @keyframes dashboardFadeInUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dashboard-fade-in {
            animation: dashboardFadeInUp 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .dashboard-hover-card {
            transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
          }
          .dashboard-hover-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(37, 99, 235, 0.10);
            border-color: #CBD5E1;
          }

          @media (prefers-reduced-motion: reduce) {
            .dashboard-fade-in,
            .dashboard-hover-card {
              animation: none !important;
              transition: none !important;
            }
          }

          @media (max-width: 1180px) {
            .dashboard-card-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (max-width: 960px) {
            .dashboard-stats-grid,
            .dashboard-mini-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .dashboard-grid-two,
            .dashboard-card-grid,
            .dashboard-inline-grid,
            .dashboard-review-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 560px) {
            .dashboard-card-grid,
            .dashboard-stats-grid,
            .dashboard-mini-grid {
              grid-template-columns: 1fr !important;
            }
            .dashboard-donut-row {
              flex-direction: column;
              align-items: flex-start !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
