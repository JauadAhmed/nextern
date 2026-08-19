'use client';
// src/components/notifications/NotificationBell.tsx
// Real-time notification bell for the dashboard header.
// - Connects to Pusher on mount and listens for new notifications
// - Shows unread badge count
// - Dropdown shows last 8 notifications
// - "Mark all read" clears the badge
// - Links to /student/notifications for the full list

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  CheckCheck,
  ExternalLink,
  Briefcase,
  Award,
  CalendarDays,
  Star,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Zap,
  Users,
  SendToBack,
} from 'lucide-react';
import Pusher from 'pusher-js';
import { userChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { readJsonSafely } from '@/lib/safe-json';

// ── Types ──────────────────────────────────────────────────────────────────
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

// ── Notification type → icon + colour ─────────────────────────────────────
function typeConfig(type: string): { icon: React.ReactNode; color: string; bg: string } {
  const map: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    status_update: { icon: <Briefcase size={14} />, color: '#2563EB', bg: '#EFF6FF' },
    deadline_reminder: { icon: <CalendarDays size={14} />, color: '#D97706', bg: '#FFFBEB' },
    recommendation_request: {
      icon: <SendToBack size={14} />,
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    badge_earned: { icon: <Award size={14} />, color: '#7C3AED', bg: '#EDE9FE' },
    application_received: { icon: <Users size={14} />, color: '#0D9488', bg: '#ECFDF5' },
    job_match: { icon: <Zap size={14} />, color: '#0D9488', bg: '#F0FDFA' },
    advisor_note: { icon: <Star size={14} />, color: '#0EA5E9', bg: '#F0F9FF' },
    interview_scheduled: { icon: <CalendarDays size={14} />, color: '#059669', bg: '#ECFDF5' },
    score_update: { icon: <TrendingUp size={14} />, color: '#6366F1', bg: '#EEF2FF' },
    message_received: { icon: <MessageSquare size={14} />, color: '#64748B', bg: '#F1F5F9' },
    support_message: { icon: <MessageSquare size={14} />, color: '#0F766E', bg: '#F0FDFA' },
    admin_message: { icon: <MessageSquare size={14} />, color: '#1D4ED8', bg: '#EFF6FF' },
    system_message: { icon: <AlertCircle size={14} />, color: '#7C3AED', bg: '#F5F3FF' },
  };
  return map[type] ?? { icon: <AlertCircle size={14} />, color: '#64748B', bg: '#F1F5F9' };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Props ──────────────────────────────────────────────────────────────────
type Props = {
  userId: string;
  initialUnread?: number;
  notificationsHref?: string; // e.g. '/student/notifications'
  compact?: boolean;
};

// ── Component ──────────────────────────────────────────────────────────────
export default function NotificationBell({
  userId,
  initialUnread = 0,
  notificationsHref = '/student/notifications',
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click ────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch latest notifications ────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=8');
      if (!res.ok) return;
      const data = await readJsonSafely<{ notifications?: Notif[]; unreadCount?: number }>(res, {});
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch of unread count ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/notifications?limit=1')
      .then((r) => readJsonSafely<{ unreadCount?: number }>(r, {}))
      .then((d) => setUnread(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  // ── Open dropdown → fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  // ── Pusher real-time ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(userChannel(userId));

    // New notification arrives
    channel.bind(PUSHER_EVENTS.NEW_NOTIFICATION, (data: Notif) => {
      setUnread((prev) => prev + 1);
      // If dropdown is open, prepend the new notification
      setNotifs((prev) => {
        const exists = prev.some((n) => n._id === data._id);
        if (exists) return prev;
        return [data, ...prev].slice(0, 8);
      });
    });

    // All-read event
    channel.bind(PUSHER_EVENTS.NOTIFICATION_READ, (data: { unreadCount: number }) => {
      setUnread(data.unreadCount);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(userChannel(userId));
      pusher.disconnect();
    };
  }, [userId]);

  // ── Mark single notification read ─────────────────────────────────────
  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  // ── Mark all read ─────────────────────────────────────────────────────
  async function clearNotifications() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear notifications');
      setNotifs([]);
      setUnread(0);
    } catch (error) {
      console.error('[CLEAR NOTIFICATIONS ERROR]', error);
    } finally {
      setMarkingAll(false);
    }
  }

  async function markAllRead() {
    setMarkingAllRead(true);
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark all read');
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (error) {
      console.error('[MARK ALL READ ERROR]', error);
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function removeNotification(id: string, isRead: boolean) {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove notification');
      setNotifs((prev) => prev.filter((n) => n._id !== id));
      if (!isRead) {
        setUnread((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[REMOVE NOTIFICATION ERROR]', error);
    }
  }

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? 0 : 7,
          justifyContent: 'center',
          minWidth: compact ? 40 : undefined,
          minHeight: compact ? 40 : undefined,
          padding: compact ? '0' : '9px 12px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
          color: '#D8E3F1',
          cursor: 'pointer',
          transition: 'background 0.15s',
          fontSize: 12,
          fontWeight: 700,
        }}
        aria-label="Notifications"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = open
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(255,255,255,0.05)')
        }
      >
        <span style={{ display: 'inline-flex', color: '#22D3EE', position: 'relative' }}>
          <Bell size={14} strokeWidth={2} />
          {/* Pulse ring when unread */}
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -1,
                right: -1,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#EF4444',
                border: '1.5px solid #1E293B',
              }}
            />
          )}
        </span>
        {!compact && <span>Notifications</span>}
        {/* Badge */}
        {unread > 0 && (
          <span
            style={{
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: '#EF4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: compact ? '0 5px' : '0 4px',
              position: compact ? 'absolute' : 'static',
              top: compact ? -2 : undefined,
              right: compact ? -2 : undefined,
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            zIndex: 200,
            width: 'min(360px, calc(100vw - 24px))',
            maxWidth: 'calc(100vw - 24px)',
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 20,
            boxShadow: '0 20px 50px rgba(15,23,42,0.14)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '16px 18px 12px',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} color="#2563EB" />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Notifications</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={markAllRead}
                  disabled={markingAllRead}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: markingAllRead ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck size={12} />
                  {markingAllRead ? 'Marking…' : 'Mark all read'}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  disabled={markingAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: '#F1F5F9',
                    border: 'none',
                    color: '#64748B',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: markingAll ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Clear all notifications"
                >
                  <X size={12} />
                  {markingAll ? 'Clearing…' : 'Clear'}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div
                style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}
              >
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Bell size={32} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                  All caught up!
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  No notifications yet.
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = typeConfig(notif.type);
                return (
                  <div
                    key={notif._id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '13px 18px',
                      background: notif.isRead ? '#fff' : '#F8FBFF',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: notif.link ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = notif.isRead ? '#fff' : '#F8FBFF')
                    }
                    onClick={() => {
                      if (!notif.isRead) markRead(notif._id);
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: cfg.bg,
                        color: cfg.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: notif.isRead ? 600 : 800,
                          color: '#0F172A',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748B',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notif.body}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 5,
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(false);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              color: '#2563EB',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            View <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif._id, notif.isRead);
                      }}
                      title="Remove notification"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 10,
                        border: 'none',
                        background: '#F1F5F9',
                        color: '#64748B',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <X size={12} />
                    </button>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#2563EB',
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — link to full page */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
            }}
          >
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#2563EB',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
