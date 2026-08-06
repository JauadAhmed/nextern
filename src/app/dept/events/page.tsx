// src/app/dept/events/page.tsx
// Department Head posted events — mirrors advisor events page

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';
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
import { CalendarDays, Users, Clock, FileText } from 'lucide-react';
import CloseJobButton from '@/app/employer/jobs/CloseJobButton';
import PaginatedCollection from '@/components/ui/PaginatedCollection';

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
};

async function getEventsData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [deptHead, events, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    Job.find({ employerId: oid, type: { $in: ['webinar', 'workshop'] } })
      .sort({ createdAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const eventIds = events.map((e) => e._id);
  const [regCounts, appCounts] = await Promise.all([
    eventIds.length
      ? Application.aggregate([
          { $match: { jobId: { $in: eventIds }, isEventRegistration: true } },
          { $group: { _id: '$jobId', count: { $sum: 1 } } },
        ])
      : [],
    eventIds.length
      ? Application.aggregate([
          { $match: { jobId: { $in: eventIds }, isEventRegistration: false } },
          { $group: { _id: '$jobId', count: { $sum: 1 } } },
        ])
      : [],
  ]);

  const regMap = new Map(
    regCounts.map((r: { _id: mongoose.Types.ObjectId; count: number }) => [
      r._id.toString(),
      r.count,
    ])
  );
  const appMap = new Map(
    appCounts.map((a: { _id: mongoose.Types.ObjectId; count: number }) => [
      a._id.toString(),
      a.count,
    ])
  );

  return {
    deptHead,
    events: events.map((e) => ({
      _id: e._id.toString(),
      title: e.title,
      type: e.type,
      locationType: e.locationType,
      city: e.city,
      isActive: e.isActive,
      applicationDeadline: e.applicationDeadline,
      targetUniversities: e.targetUniversities ?? [],
      targetDepartments: e.targetDepartments ?? [],
      academicSession: e.academicSession,
      registrationCount: regMap.get(e._id.toString()) ?? 0,
      applicationCount: appMap.get(e._id.toString()) ?? 0,
    })),
    stats: {
      total: events.length,
      active: events.filter((e) => e.isActive).length,
      closed: events.filter((e) => !e.isActive).length,
      totalRegistrations: regCounts.reduce((s: number, r: { count: number }) => s + r.count, 0),
    },
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function DeptEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'dept_head') redirect('/dept/dashboard');

  const { deptHead, events, stats, chrome } = await getEventsData(session.user.id);

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{
        name: deptHead?.name ?? 'Dept Head',
        email: deptHead?.email ?? '',
        image: deptHead?.image,
        subtitle:
          [deptHead?.designation, deptHead?.institutionName].filter(Boolean).join(' · ') ||
          'Department workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
        userId: session.user.id,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Department events"
          title="Webinars & Workshops"
          description="Publish academic events for students across your department. Track registrations and manage status from here."
          actions={
            <>
              <ActionLink href="/dept/events/new" label="Post New Event" />
              <ActionLink href="/dept/dashboard" label="Back to dashboard" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Event summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total Events', value: stats.total, color: '#F8FAFC' },
                  { label: 'Active', value: stats.active, color: '#10B981' },
                  { label: 'Registrations', value: stats.totalRegistrations, color: '#22D3EE' },
                  { label: 'Closed', value: stats.closed, color: '#F59E0B' },
                ].map((s) => (
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
                    <div style={{ color: '#9FB4D0', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
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
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
          >
            <StatCard
              label="Total events"
              value={formatCompactNumber(stats.total)}
              Icon={CalendarDays}
              accent="#7C3AED"
            />
            <StatCard
              label="Active events"
              value={formatCompactNumber(stats.active)}
              Icon={Clock}
              accent="#10B981"
            />
            <StatCard
              label="Total registrations"
              value={formatCompactNumber(stats.totalRegistrations)}
              Icon={Users}
              accent="#22D3EE"
            />
          </div>
        </section>

        <DashboardSection
          id="events"
          title="All events"
          description="Your posted webinars and workshops. Click View Registrants to see who signed up."
        >
          {events.length === 0 ? (
            <Panel title="No events posted yet" description="">
              <EmptyState
                title="Start publishing events"
                description="Post your first webinar or workshop to help students in your department build skills."
              />
            </Panel>
          ) : (
            <PaginatedCollection
              itemLabel="events"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {events.map((event) => {
                const typeStyle = TYPE_COLORS[event.type] ?? TYPE_COLORS['webinar'];
                const deadline = event.applicationDeadline
                  ? new Date(event.applicationDeadline)
                  : null;
                const daysLeft = deadline
                  ? Math.ceil((deadline.getTime() - new Date().getTime()) / 86400000)
                  : null;
                const isExpired = daysLeft !== null && daysLeft < 0;
                const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

                return (
                  <div
                    key={event._id}
                    style={{
                      background: '#fff',
                      borderRadius: 20,
                      border: `1px solid ${isUrgent ? '#FDE68A' : '#E2E8F0'}`,
                      padding: '20px 24px',
                      boxShadow: isUrgent
                        ? '0 0 0 3px rgba(245,158,11,0.08)'
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
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 10,
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
                            {event.type === 'webinar' ? '🌐' : '🔧'} {formatStatusLabel(event.type)}
                          </span>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              background: event.isActive ? '#ECFDF5' : '#F8FAFC',
                              color: event.isActive ? '#065F46' : '#64748B',
                              border: `1px solid ${event.isActive ? '#A7F3D0' : '#E2E8F0'}`,
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
                                background: event.isActive ? '#10B981' : '#94A3B8',
                                display: 'inline-block',
                              }}
                            />
                            {event.isActive ? 'Active' : 'Closed'}
                          </span>
                          {isUrgent && (
                            <span
                              style={{
                                background: '#FFFBEB',
                                color: '#92400E',
                                border: '1px solid #FDE68A',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              ⚡ Closing soon
                            </span>
                          )}
                        </div>

                        <h3
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: '#0F172A',
                            fontFamily: 'var(--font-display)',
                            margin: 0,
                            marginBottom: 8,
                          }}
                        >
                          {event.title}
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
                          <span>
                            📍 {event.city ? `${event.city} · ` : ''}
                            {formatStatusLabel(event.locationType)}
                          </span>
                          {deadline && (
                            <span
                              style={{
                                color: isUrgent ? '#F59E0B' : isExpired ? '#EF4444' : '#64748B',
                                fontWeight: isUrgent || isExpired ? 700 : 400,
                              }}
                            >
                              📅{' '}
                              {isExpired
                                ? 'Registration closed'
                                : isUrgent
                                  ? `${daysLeft}d left — Urgent`
                                  : `${daysLeft}d left`}
                            </span>
                          )}
                          {event.academicSession && <span>🎓 {event.academicSession}</span>}
                        </div>

                        {(event.targetDepartments.length > 0 ||
                          event.targetUniversities.length > 0) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                            {event.targetDepartments.slice(0, 3).map((d: string) => (
                              <span
                                key={d}
                                style={{
                                  background: '#F1F5F9',
                                  color: '#475569',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {d}
                              </span>
                            ))}
                            {event.targetUniversities.slice(0, 2).map((u: string) => (
                              <span
                                key={u}
                                style={{
                                  background: '#EFF6FF',
                                  color: '#2563EB',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {u}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 900,
                            color: '#7C3AED',
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                          }}
                        >
                          {formatCompactNumber(event.registrationCount)}
                        </div>
                        <div
                          style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 600 }}
                        >
                          Registrations
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: '1px solid #F1F5F9',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Link
                        href={`/dept/events/${event._id}/registrants`}
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
                        }}
                      >
                        <Users size={13} /> View Registrants
                      </Link>
                      <Link
                        href={`/dept/events/${event._id}/applicants`}
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
                        <FileText size={13} /> View Applications
                        {event.applicationCount > 0 && (
                          <span
                            style={{
                              background: '#2563EB',
                              color: '#fff',
                              borderRadius: 999,
                              padding: '1px 7px',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {event.applicationCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        href={`/dept/events/${event._id}/edit`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#EDE9FE',
                          color: '#7C3AED',
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #DDD6FE',
                        }}
                      >
                        Edit
                      </Link>
                      {event.isActive && <CloseJobButton jobId={event._id} />}
                    </div>
                  </div>
                );
              })}
            </PaginatedCollection>
          )}
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
