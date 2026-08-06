// src/app/employer/jobs/[jobId]/page.tsx
// Employer view of a single job post — read-only detail view

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  Panel,
  Tag,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { MapPin, Clock, Users, CalendarClock, Banknote, Wrench, BookOpen } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  internship: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'part-time': { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'full-time': { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'campus-drive': { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: '#FEF2F2', color: '#BE123C', border: '#FECDD3' },
};

async function getJobData(jobId: string, employerId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(employerId);

  const [employer, job, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid).select('name email image companyName').lean(),
    Job.findOne({ _id: jobId, employerId: oid }).lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  // ✅ Date.now() called here in server scope, not during render
  const now = Date.now();
  const deadline = job?.applicationDeadline ? new Date(job.applicationDeadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return {
    employer,
    job,
    daysLeft,
    isExpired,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function EmployerJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const { jobId } = await params;
  const { employer, job, daysLeft, isExpired, chrome } = await getJobData(jobId, session.user.id);
  if (!job) redirect('/employer/jobs');

  const typeStyle = TYPE_COLORS[job.type] ?? TYPE_COLORS['internship'];

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
        {/* Hero */}
        <div
          style={{
            background: '#172033',
            borderRadius: 28,
            padding: '32px 36px',
            boxShadow: '0 26px 60px rgba(15,23,42,0.16)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              background: 'rgba(37,99,235,0.11)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                <span
                  style={{
                    background: typeStyle.bg,
                    color: typeStyle.color,
                    border: `1px solid ${typeStyle.border}`,
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
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
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Batch Hiring
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
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
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
                {job.isPremiumListing && (
                  <span
                    style={{
                      background: '#FFFBEB',
                      color: '#92400E',
                      border: '1px solid #FDE68A',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ⭐ Featured
                  </span>
                )}
              </div>

              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: '#F8FAFC',
                  fontFamily: 'var(--font-display)',
                  margin: 0,
                  marginBottom: 6,
                  letterSpacing: '-0.5px',
                }}
              >
                {job.title}
              </h1>
              <div style={{ color: '#94A3B8', fontSize: 16, fontWeight: 600 }}>
                {job.companyName}
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
                {job.city && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#94A3B8',
                      fontSize: 14,
                    }}
                  >
                    <MapPin size={14} /> {job.city} · {formatStatusLabel(job.locationType)}
                  </span>
                )}
                {daysLeft !== null && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      color: isExpired ? '#EF4444' : daysLeft <= 3 ? '#F59E0B' : '#94A3B8',
                      fontWeight: isExpired || daysLeft <= 3 ? 700 : 400,
                    }}
                  >
                    <Clock size={14} /> {isExpired ? 'Expired' : `${daysLeft} days left`}
                  </span>
                )}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#94A3B8',
                    fontSize: 14,
                  }}
                >
                  <Users size={14} /> {job.applicationCount ?? 0} applicants
                </span>
                {job.stipendBDT && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#10B981',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <Banknote size={14} /> ৳{job.stipendBDT.toLocaleString()}/mo
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <Link
                href={`/employer/jobs/${job._id}/applicants`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  background: '#2563EB',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Users size={15} /> View Applicants ({job.applicationCount ?? 0})
              </Link>
              <Link
                href={`/employer/jobs/${job._id}/edit`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#E2E8F0',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.14)',
                  whiteSpace: 'nowrap',
                }}
              >
                Edit listing
              </Link>
              <Link
                href="/employer/jobs"
                style={{
                  color: '#64748B',
                  fontSize: 13,
                  textDecoration: 'none',
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                ← Back to listings
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Applications', value: job.applicationCount ?? 0, color: '#22D3EE' },
              { label: 'Views', value: job.viewCount ?? 0, color: '#F59E0B' },
              {
                label: 'Openings',
                value: job.durationMonths ? `${job.durationMonths}mo` : '—',
                color: '#10B981',
              },
              {
                label: 'Posted',
                value: formatShortDate(job.createdAt?.toISOString()),
                color: '#94A3B8',
              },
            ].map((s) => (
              <div key={s.label}>
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
                <div style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginTop: 24 }}
          className="job-detail-grid"
        >
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel title="Job description" description="">
              <p
                style={{
                  color: '#475569',
                  fontSize: 15,
                  lineHeight: 1.8,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job.description}
              </p>
            </Panel>

            {job.responsibilities?.length > 0 && (
              <Panel title="Responsibilities" description="">
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {job.responsibilities.map((r: string, i: number) => (
                    <li key={i} style={{ color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel title="Listing details" description="">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    icon: <CalendarClock size={15} />,
                    label: 'Deadline',
                    value: formatShortDate(job.applicationDeadline?.toISOString()),
                  },
                  job.startDate
                    ? {
                        icon: <CalendarClock size={15} />,
                        label: 'Start Date',
                        value: formatShortDate(job.startDate?.toISOString()),
                      }
                    : null,
                  job.durationMonths
                    ? {
                        icon: <Clock size={15} />,
                        label: 'Duration',
                        value: `${job.durationMonths} months`,
                      }
                    : null,
                  job.stipendBDT
                    ? {
                        icon: <Banknote size={15} />,
                        label: 'Stipend',
                        value: `৳${job.stipendBDT.toLocaleString()}/mo${job.isStipendNegotiable ? ' (negotiable)' : ''}`,
                      }
                    : null,
                  !job.stipendBDT && job.isStipendNegotiable
                    ? { icon: <Banknote size={15} />, label: 'Stipend', value: 'Negotiable' }
                    : null,
                  job.academicSession
                    ? { icon: <BookOpen size={15} />, label: 'Session', value: job.academicSession }
                    : null,
                ]
                  .filter(Boolean)
                  .map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ color: '#2563EB', marginTop: 1, flexShrink: 0 }}>
                        {item!.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                          }}
                        >
                          {item!.label}
                        </div>
                        <div
                          style={{ fontSize: 14, color: '#0F172A', fontWeight: 600, marginTop: 2 }}
                        >
                          {item!.value}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Panel>

            {(job.requiredSkills?.length > 0 ||
              job.minimumCGPA ||
              job.requiredCourses?.length > 0) && (
              <Panel title="Requirement profile" description="Feeds into the AI fit scoring engine">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {job.requiredSkills?.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#64748B',
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Wrench size={13} /> Required Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {job.requiredSkills.map((s: string) => (
                          <span
                            key={s}
                            style={{
                              background: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.minimumCGPA && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4 }}
                      >
                        Minimum CGPA
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {job.minimumCGPA.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {job.requiredCourses?.length > 0 && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}
                      >
                        Required Courses
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {job.requiredCourses.map((c: string) => (
                          <span
                            key={c}
                            style={{
                              background: '#F1F5F9',
                              color: '#475569',
                              padding: '3px 9px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.experienceExpectations && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4 }}
                      >
                        Experience
                      </div>
                      <div style={{ fontSize: 14, color: '#475569' }}>
                        {job.experienceExpectations}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {(job.targetUniversities?.length > 0 ||
              job.targetDepartments?.length > 0 ||
              job.targetYears?.length > 0) && (
              <Panel title="Targeting" description="Who this listing is shown to">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {job.targetUniversities?.length > 0 && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}
                      >
                        Universities
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {job.targetUniversities.map((u: string) => (
                          <Tag key={u} label={u} tone="neutral" />
                        ))}
                      </div>
                    </div>
                  )}
                  {job.targetDepartments?.length > 0 && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}
                      >
                        Departments
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {job.targetDepartments.map((d: string) => (
                          <Tag key={d} label={d} tone="neutral" />
                        ))}
                      </div>
                    </div>
                  )}
                  {job.targetYears?.length > 0 && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}
                      >
                        Year of Study
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {job.targetYears.map((y: number) => (
                          <Tag key={y} label={`Year ${y}`} tone="neutral" />
                        ))}
                      </div>
                    </div>
                  )}
                  {job.isBatchHiring && job.batchUniversities?.length > 0 && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}
                      >
                        Batch Universities
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {job.batchUniversities.map((u: string) => (
                          <Tag key={u} label={u} tone="info" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .job-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
