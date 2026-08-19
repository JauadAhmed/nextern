'use client';
// src/app/employer/notifications/page.tsx

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Bell,
  Briefcase,
  Award,
  CalendarDays,
  Star,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Zap,
  Users,
  ExternalLink,
  Filter,
  SendToBack,
} from 'lucide-react';

const C = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  teal: '#0D9488',
  violet: '#7C3AED',
  amber: '#D97706',
  sky: '#0EA5E9',
  emerald: '#059669',
  indigo: '#6366F1',
  dark: '#0F172A',
  indigo2: '#1E293B',
  bg: '#F1F5F9',
  white: '#fff',
  border: '#E2E8F0',
  text: '#0F172A',
  gray: '#64748B',
  light: '#94A3B8',
  mid: '#334155',
  danger: '#EF4444',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
};

type Notif = {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
};

const TYPE_CONFIG: Record<
  string,
  { icon: ReactNode; color: string; bg: string; border: string; label: string }
> = {
  application_received: {
    icon: <Users size={15} />,
    color: C.teal,
    bg: '#F0FDFA',
    border: '#99F6E4',
    label: 'Application',
  },
  status_update: {
    icon: <Briefcase size={15} />,
    color: C.blue,
    bg: C.blueBg,
    border: C.blueBorder,
    label: 'Status Update',
  },
  recommendation_request: {
    icon: <SendToBack size={15} />,
    color: C.violet,
    bg: '#F5F3FF',
    border: '#DDD6FE',
    label: 'Recommendation',
  },
  deadline_reminder: {
    icon: <CalendarDays size={15} />,
    color: C.amber,
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Deadline',
  },
  badge_earned: {
    icon: <Award size={15} />,
    color: C.violet,
    bg: '#EDE9FE',
    border: '#DDD6FE',
    label: 'Badge',
  },
  job_match: {
    icon: <Zap size={15} />,
    color: C.teal,
    bg: '#F0FDFA',
    border: '#99F6E4',
    label: 'Job Match',
  },
  advisor_note: {
    icon: <Star size={15} />,
    color: C.sky,
    bg: '#F0F9FF',
    border: '#BAE6FD',
    label: 'Advisor',
  },
  interview_scheduled: {
    icon: <CalendarDays size={15} />,
    color: C.emerald,
    bg: C.successBg,
    border: C.successBorder,
    label: 'Interview',
  },
  score_update: {
    icon: <TrendingUp size={15} />,
    color: C.indigo,
    bg: '#EEF2FF',
    border: '#C7D2FE',
    label: 'Score Update',
  },
  message_received: {
    icon: <MessageSquare size={15} />,
    color: C.gray,
    bg: '#F1F5F9',
    border: C.border,
    label: 'Message',
  },
  support_message: {
    icon: <MessageSquare size={15} />,
    color: '#0F766E',
    bg: '#F0FDFA',
    border: '#99F6E4',
    label: 'Support Message',
  },
  admin_message: {
    icon: <MessageSquare size={15} />,
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    label: 'Admin Message',
  },
  system_message: {
    icon: <AlertCircle size={15} />,
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    label: 'System Message',
  },
};

function typeConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: <AlertCircle size={15} />,
      color: C.gray,
      bg: '#F1F5F9',
      border: C.border,
      label: 'Notification',
    }
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const FILTER_TABS = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'recommendation_request', label: 'Recommendations', icon: <SendToBack size={13} /> },
  { value: 'application_received', label: 'Applications', icon: <Users size={13} /> },
  { value: 'status_update', label: 'Status', icon: <Briefcase size={13} /> },
  { value: 'message_received', label: 'Messages', icon: <MessageSquare size={13} /> },
  { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
  { value: 'interview_scheduled', label: 'Interviews', icon: <CalendarDays size={13} /> },
];

export default function EmployerNotificationsPage() {
  const [notifications, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (showUnreadOnly) params.set('unread', 'true');
      if (filter !== 'all') params.set('type', filter);
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filter, showUnreadOnly]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo2})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px' }}>
          <Link
            href="/employer/dashboard"
            style={{ color: C.gray, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Dashboard
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
                }}
              >
                <Bell size={20} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  Notifications
                </h1>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 3 }}>
                  {unread > 0
                    ? `${unread} unread notification${unread !== 1 ? 's' : ''}`
                    : 'All caught up — no unread notifications'}
                </div>
              </div>
            </div>

            {/* Stats + mark all */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {unread > 0 && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#EF4444',
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>
                    {unread} unread
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 24px' }}>
        {/* Filter bar */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  border:
                    filter === tab.value ? `1.5px solid ${C.blue}` : `1.5px solid ${C.border}`,
                  background: filter === tab.value ? C.blueBg : '#F8FAFC',
                  color: filter === tab.value ? C.blue : C.gray,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Unread toggle */}
          <button
            onClick={() => setShowUnreadOnly((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              borderRadius: 10,
              border: showUnreadOnly ? `1.5px solid ${C.blue}` : `1.5px solid ${C.border}`,
              background: showUnreadOnly ? C.blueBg : '#F8FAFC',
              color: showUnreadOnly ? C.blue : C.gray,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Filter size={12} />
            {showUnreadOnly ? 'Showing unread' : 'Unread only'}
          </button>
        </div>

        {/* Notification list */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: `3px solid ${C.border}`,
                  borderTopColor: C.blue,
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div style={{ color: C.light, fontSize: 14 }}>Loading notifications…</div>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: '#F1F5F9',
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: C.light,
                }}
              >
                <Bell size={28} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 6 }}>
                No notifications
              </div>
              <div style={{ fontSize: 13, color: C.light, maxWidth: 380, margin: '0 auto' }}>
                {showUnreadOnly
                  ? "No unread notifications — you're all caught up!"
                  : 'New applications and hiring updates will appear here as candidates engage with your listings.'}
              </div>
            </div>
          ) : (
            notifications.map((notif, idx) => {
              const cfg = typeConfig(notif.type);
              return (
                <div
                  key={notif._id}
                  onClick={() => {
                    if (!notif.isRead) markRead(notif._id);
                  }}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: '18px 24px',
                    borderBottom: idx < notifications.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: notif.isRead ? C.white : '#F8FBFF',
                    alignItems: 'flex-start',
                    cursor: notif.isRead ? 'default' : 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.isRead ? C.white : '#F8FBFF')
                  }
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      minWidth: 40,
                      borderRadius: 12,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      color: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        {/* Type label */}
                        <span
                          style={{
                            display: 'inline-block',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            padding: '1px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            marginBottom: 5,
                            textTransform: 'uppercase' as const,
                            letterSpacing: 0.5,
                          }}
                        >
                          {cfg.label}
                        </span>
                        {/* Title */}
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: notif.isRead ? 600 : 800,
                            color: C.dark,
                            lineHeight: 1.4,
                          }}
                        >
                          {notif.title}
                        </div>
                      </div>

                      {/* Time + unread dot */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: 11, color: C.light, whiteSpace: 'nowrap' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: C.blue,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <p
                      style={{
                        margin: '8px 0 0',
                        color: C.gray,
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      {notif.body}
                    </p>

                    {/* Link */}
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.blue,
                          textDecoration: 'none',
                          background: C.blueBg,
                          border: `1px solid ${C.blueBorder}`,
                          padding: '4px 10px',
                          borderRadius: 8,
                        }}
                      >
                        View details <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!loading && notifications.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, color: C.light }}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''} shown
              {showUnreadOnly ? ' (unread only)' : ''}
            </div>
            <Link
              href="/employer/dashboard"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.blue,
                textDecoration: 'none',
              }}
            >
              ← Back to dashboard
            </Link>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
