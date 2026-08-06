'use client';
// src/app/student/applications/ApplicationsTabs.tsx
// Tabbed view — Applications tab + Events tab

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import PaginatedCollection from '@/components/ui/PaginatedCollection';
import {
  BriefcaseBusiness,
  CalendarDays,
  Send,
  Eye,
  Star,
  ClipboardList,
  CalendarCheck,
  BadgeCheck,
  XCircle,
  Undo2,
  MessageCircle,
  X,
  ShieldAlert,
} from 'lucide-react';

const ELIGIBLE_STATUSES = ['shortlisted', 'assessment_sent', 'interview_scheduled', 'hired'];

/* ─── Status config ─────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'info' | 'success' | 'warning' | 'neutral'; icon: ReactNode }
> = {
  applied: { label: 'Applied', tone: 'info', icon: <Send size={11} /> },
  under_review: { label: 'Under Review', tone: 'warning', icon: <Eye size={11} /> },
  shortlisted: { label: 'Shortlisted', tone: 'info', icon: <Star size={11} /> },
  assessment_sent: { label: 'Assessment Sent', tone: 'info', icon: <ClipboardList size={11} /> },
  interview_scheduled: {
    label: 'Interview Scheduled',
    tone: 'info',
    icon: <CalendarCheck size={11} />,
  },
  hired: { label: 'Hired', tone: 'success', icon: <BadgeCheck size={11} /> },
  rejected: { label: 'Not Selected', tone: 'warning', icon: <XCircle size={11} /> },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', icon: <Undo2 size={11} /> },
};

const TONE_STYLES = {
  info: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  success: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  neutral: { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
};

type AppItem = {
  _id: string;
  status: string;
  coverLetter: string | null;
  resumeUrlSnapshot: string | null;
  appliedAt: string;
  fitScore: number | null;
  assessmentAssignmentId: string | null;
  assessmentDueAt: string | null;
  assessmentSubmittedAt: string | null;
  interviewSessionId: string | null;
  interviewScheduledAt: string | null;
  isEventRegistration: boolean;
  statusHistory: { status: string; changedAt: string }[];
  job: {
    _id: string;
    title: string;
    type: string;
    companyName: string;
    city: string | null;
    locationType: string;
    applicationDeadline: string | null;
    employerId: string | null;
  } | null;
};

function formatShortDate(d?: string | null) {
  if (!d) return 'No date';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));
}

function formatStatusLabel(v: string) {
  return v
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/* ─── Inline responsive styles injected once ─────────────────────────────────── */
const RESPONSIVE_STYLES = `
  .app-card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E2E8F0;
    padding: 16px 18px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    transition: box-shadow 0.18s, transform 0.18s;
    cursor: default;
  }
  .app-card:hover {
    box-shadow: 0 6px 24px rgba(37,99,235,0.10);
    transform: translateY(-1px);
  }
  .app-card-inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .app-card-body { flex: 1; min-width: 0; }
  .app-card-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 4px;
  }
  .app-card-title {
    font-size: 15px;
    font-weight: 800;
    color: #0F172A;
    font-family: var(--font-display, system-ui);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .app-card-meta {
    color: #64748B;
    font-size: 13px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .app-card-meta-dot { color: #CBD5E1; }
  .app-card-date { color: #94A3B8; font-size: 12px; }
  .app-card-cover {
    background: #F8FAFC;
    border-radius: 8px;
    padding: 7px 10px;
    margin-top: 10px;
    font-size: 12px;
    color: #64748B;
    font-style: italic;
    border-left: 2px solid #BFDBFE;
    line-height: 1.6;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .app-card-history {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  .app-card-history-step { font-size: 11px; color: #94A3B8; }
  .app-card-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }
  .app-card-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #2563EB;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #BFDBFE;
    background: #EFF6FF;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .app-card-link:hover { background: #DBEAFE; border-color: #93C5FD; }

  /* Badge base */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  /* Tab bar */
  .tabs-bar {
    display: flex;
    border-bottom: 1px solid #E2E8F0;
    background: #FAFBFC;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .tabs-bar::-webkit-scrollbar { display: none; }
  .tab-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 14px 22px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    font-family: var(--font-body, system-ui);
    font-weight: 500;
    color: #64748B;
    border-bottom: 2.5px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .tab-btn.active {
    font-weight: 700;
    color: #2563EB;
    border-bottom-color: #2563EB;
  }
  .tab-btn:hover:not(.active) { color: #334155; background: #F1F5F9; }

  /* List */
  .cards-list { display: flex; flex-direction: column; gap: 10px; }

  /* Empty state */
  .empty-state {
    border-radius: 14px;
    border: 1.5px dashed #CBD5E1;
    background: #F8FAFC;
    padding: 44px 20px;
    text-align: center;
  }
  .empty-icon { color: #CBD5E1; margin-bottom: 14px; }
  .empty-title { font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
  .empty-desc { font-size: 13px; color: #64748B; line-height: 1.75; max-width: 340px; margin: 0 auto; }
  .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 18px;
    background: #2563EB;
    color: #fff;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    font-family: var(--font-display, system-ui);
    transition: background 0.15s;
  }
  .empty-cta:hover { background: #1D4ED8; }

  /* Wrapper */
  .tabs-wrapper {
    background: #fff;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .tabs-content { padding: 18px 18px 20px; }

  /* ── Mobile (≤ 480px) ─────────────────────────────────────── */
  @media (max-width: 480px) {
    .tab-btn { padding: 12px 14px; font-size: 13px; gap: 5px; }
    .tabs-content { padding: 12px 12px 16px; }
    .app-card { padding: 13px 14px; border-radius: 12px; }
    .app-card-inner { flex-direction: column; gap: 10px; }
    .app-card-actions { flex-direction: row; align-items: center; width: 100%; }
    .app-card-link { flex: 1; justify-content: center; font-size: 12px; }
    .app-card-title { font-size: 14px; white-space: normal; }
    .app-card-meta { font-size: 12px; }
    .badge { font-size: 10px; padding: 2px 7px; }
    .empty-state { padding: 32px 16px; }
  }

  /* ── Small tablet (481–767px) ─────────────────────────────── */
  @media (min-width: 481px) and (max-width: 767px) {
    .app-card-inner { flex-direction: column; gap: 10px; }
    .app-card-actions { flex-direction: row; width: 100%; }
    .app-card-link { flex: 1; justify-content: center; }
    .tabs-content { padding: 14px 16px 18px; }
  }

  /* ── Tablet (768–1023px) ──────────────────────────────────── */
  @media (min-width: 768px) and (max-width: 1023px) {
    .app-card { padding: 15px 18px; }
    .tab-btn { padding: 13px 20px; }
  }

  /* ── Desktop (≥ 1024px) ───────────────────────────────────── */
  @media (min-width: 1024px) {
    .app-card-title { font-size: 15px; }
    .tabs-content { padding: 20px 22px 24px; }
    .cards-list { gap: 12px; }
  }
`;

/* ─── AppCard ────────────────────────────────────────────────────────────────── */
function AppCard({
  app,
  isEvent,
  onShowWarning,
}: {
  app: AppItem;
  isEvent: boolean;
  onShowWarning: () => void;
}) {
  const isEligible = ELIGIBLE_STATUSES.includes(app.status);

  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG['applied'];
  const toneStyle = TONE_STYLES[cfg.tone];
  const job = app.job;
  const assessmentReady = Boolean(app.assessmentAssignmentId);
  const interviewReady = Boolean(app.interviewSessionId);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '18px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 5,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}
            >
              {job?.title ?? 'Job Removed'}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: toneStyle.bg,
                color: toneStyle.color,
                border: `1px solid ${toneStyle.border}`,
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {cfg.icon} {cfg.label}
            </span>
            {typeof app.fitScore === 'number' && !isEvent && (
              <span
                style={{
                  background:
                    app.fitScore >= 70 ? '#ECFDF5' : app.fitScore >= 40 ? '#EFF6FF' : '#FFFBEB',
                  color:
                    app.fitScore >= 70 ? '#065F46' : app.fitScore >= 40 ? '#2563EB' : '#92400E',
                  border: `1px solid ${
                    app.fitScore >= 70 ? '#A7F3D0' : app.fitScore >= 40 ? '#BFDBFE' : '#FDE68A'
                  }`,
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {app.fitScore}% fit
              </span>
            )}
          </div>

          <div style={{ color: '#64748B', fontSize: 13 }}>
            {job?.companyName}
            {job?.city && ` · ${job.city}`}
            {job?.locationType && ` · ${formatStatusLabel(job.locationType)}`}
            <span style={{ color: '#94A3B8', marginLeft: 8 }}>
              {isEvent ? 'Registered' : 'Applied'} {formatShortDate(app.appliedAt)}
            </span>
          </div>

          {isEvent && job?.applicationDeadline && (
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#7C3AED',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CalendarDays size={13} /> Event deadline: {formatShortDate(job.applicationDeadline)}
            </div>
          )}

          {app.coverLetter && !isEvent && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 8,
                padding: '7px 11px',
                marginTop: 10,
                fontSize: 12,
                color: '#64748B',
                fontStyle: 'italic',
                borderLeft: '2px solid #E2E8F0',
              }}
            >
              &quot;{app.coverLetter.slice(0, 160)}
              {app.coverLetter.length > 160 ? '...' : ''}&quot;
            </div>
          )}

          {app.statusHistory && app.statusHistory.length > 1 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {app.statusHistory.slice(-3).map((h, i) => (
                <span key={i} style={{ fontSize: 11, color: '#94A3B8' }}>
                  {formatStatusLabel(h.status)} ({formatShortDate(h.changedAt)})
                  {i < Math.min(app.statusHistory.length, 3) - 1 && ' →'}
                </span>
              ))}
            </div>
          )}

          {!isEvent && (assessmentReady || interviewReady) ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {assessmentReady ? (
                <Link
                  href={`/student/assessments/${app.assessmentAssignmentId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <ClipboardList size={13} />
                  {app.assessmentSubmittedAt ? 'Review assessment' : 'Open assessment'}
                </Link>
              ) : null}

              {interviewReady ? (
                <Link
                  href={`/student/interviews/${app.interviewSessionId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#F5F3FF',
                    color: '#7C3AED',
                    border: '1px solid #DDD6FE',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <CalendarCheck size={13} />
                  {app.interviewScheduledAt
                    ? `Interview ${formatShortDate(app.interviewScheduledAt)}`
                    : 'Open interview'}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}
        >
          {job?._id && (
            <Link
              href={`/student/jobs/${job._id}`}
              style={{
                color: '#2563EB',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View {isEvent ? 'Event' : 'Job'} →
            </Link>
          )}
          {!isEvent &&
            job?.employerId &&
            (isEligible ? (
              <Link
                href={`/student/messages?user=${job.employerId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#7C3AED',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: 2,
                }}
              >
                <MessageCircle size={13} /> Message →
              </Link>
            ) : (
              <button
                type="button"
                onClick={onShowWarning}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#94A3B8',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: 2,
                }}
              >
                <MessageCircle size={13} /> Message →
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsTabs({
  applications,
  events,
}: {
  applications: AppItem[];
  events: AppItem[];
}) {
  const [activeTab, setActiveTab] = useState<'applications' | 'events'>('applications');
  const [showWarning, setShowWarning] = useState(false);

  const tabs = [
    {
      key: 'applications' as const,
      label: 'Job Applications',
      icon: <BriefcaseBusiness size={15} />,
      count: applications.length,
    },
    {
      key: 'events' as const,
      label: 'Events & Webinars',
      icon: <CalendarDays size={15} />,
      count: events.length,
    },
  ];

  const activeItems = activeTab === 'applications' ? applications : events;
  const isEvent = activeTab === 'events';

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Inject responsive styles once */}
      <style>{RESPONSIVE_STYLES}</style>

      <div className="tabs-wrapper">
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 24px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? '#2563EB' : '#64748B',
                borderBottom: `2px solid ${activeTab === tab.key ? '#2563EB' : 'transparent'}`,
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{ color: activeTab === tab.key ? '#2563EB' : '#94A3B8' }}>
                {tab.icon}
              </span>
              {tab.label}
              <span
                style={{
                  background: activeTab === tab.key ? '#EFF6FF' : '#F1F5F9',
                  color: activeTab === tab.key ? '#2563EB' : '#64748B',
                  border: `1px solid ${activeTab === tab.key ? '#BFDBFE' : '#E2E8F0'}`,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px' }}>
          {activeItems.length === 0 ? (
            <div
              style={{
                borderRadius: 14,
                border: '1px dashed #CBD5E1',
                background: '#F8FAFC',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 12, color: '#94A3B8' }}>
                {isEvent ? <CalendarDays size={36} /> : <BriefcaseBusiness size={36} />}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                {isEvent ? 'No events registered yet' : 'No applications yet'}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                {isEvent
                  ? 'Register for webinars and workshops from the job feed to see them here.'
                  : 'Apply to jobs and internships from the job feed to track them here.'}
              </div>
              <Link
                href="/student/jobs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  marginTop: 16,
                  background: '#2563EB',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Browse {isEvent ? 'Events' : 'Jobs'} →
              </Link>
            </div>
          ) : (
            <PaginatedCollection
              itemLabel={isEvent ? 'event registrations' : 'applications'}
              resetKey={activeTab}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {activeItems.map((app) => (
                <AppCard
                  key={app._id}
                  app={app}
                  isEvent={isEvent}
                  onShowWarning={() => setShowWarning(true)}
                />
              ))}
            </PaginatedCollection>
          )}
        </div>
      </div>

      {/* Eligibility warning modal */}
      {showWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowWarning(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '32px 36px',
              maxWidth: 420,
              width: '90vw',
              boxShadow: '0 32px 80px rgba(15,23,42,0.22)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#F1F5F9',
                border: 'none',
                borderRadius: 8,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={16} />
            </button>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#D97706',
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                margin: '0 0 8px',
              }}
            >
              Not eligible to message yet
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: '0 0 20px' }}>
              You can message the employer once your application status reaches{' '}
              <strong style={{ color: '#0F172A' }}>Shortlisted</strong>,{' '}
              <strong style={{ color: '#0F172A' }}>Assessment Sent</strong>,{' '}
              <strong style={{ color: '#0F172A' }}>Interview Scheduled</strong>, or{' '}
              <strong style={{ color: '#0F172A' }}>Hired</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              style={{
                background: '#0F172A',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
