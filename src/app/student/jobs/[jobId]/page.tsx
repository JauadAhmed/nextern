// src/app/student/jobs/[jobId]/page.tsx
// Student job detail page — full description, requirements, apply button

import { auth } from '@/lib/auth';
import { buildUnknownAIMeta } from '@/lib/ai-meta';
import { getUsageSummary } from '@/lib/premium';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import Link from 'next/link';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  Panel,
  Tag,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import {
  MapPin,
  Clock,
  Users,
  CalendarClock,
  Banknote,
  GraduationCap,
  BookOpen,
  Wrench,
} from 'lucide-react';
import JobApplyButton from './JobApplyButton';
import MessageEmployerButton from './MessageEmployerButton';
import AISkillAnalysisCard from './AISkillAnalysisCard';
import JobFitScoreCard from './JobFitScoreCard';
import StudentReviewForm from '@/components/reviews/StudentReviewForm';
import ReputationHistory from '@/components/reviews/ReputationHistory';

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  internship: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'part-time': { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'full-time': { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'campus-drive': { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: '#FEF2F2', color: '#BE123C', border: '#FECDD3' },
};

async function getJobData(jobId: string, userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [student, job, existingApp, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select('name email image university department yearOfStudy skills cgpa')
      .lean(),
    Job.findById(jobId).lean(),
    Application.findOne({ jobId, studentId: oid }).lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!job) return null;

  const viewedAt = new Date();
  const jobViewSet: Record<string, unknown> = { lastViewedAt: viewedAt };
  if (existingApp) jobViewSet.isApplied = true;

  await Promise.all([
    Job.findByIdAndUpdate(jobId, { $inc: { viewCount: 1 } }),
    JobView.findOneAndUpdate(
      { studentId: oid, jobId },
      {
        $inc: { viewCount: 1 },
        $set: jobViewSet,
        $setOnInsert: {
          studentId: oid,
          jobId,
          firstViewedAt: viewedAt,
        },
      },
      { upsert: true }
    ),
  ]);

  // Compute fit score
  const userSkills = new Set((student?.skills ?? []).map((s: string) => s.toLowerCase()));
  const matched = (job.requiredSkills ?? []).filter((s: string) =>
    userSkills.has(s.toLowerCase())
  ).length;
  const total = (job.requiredSkills ?? []).length;
  const fitScore = total > 0 ? Math.round((matched / total) * 100) : null;

  // Move Date.now() to server scope (not inside render)
  const now = Date.now();
  const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isActive = job.isActive && !isExpired;

  return {
    student,
    job,
    hasApplied: !!existingApp,
    applicationId: existingApp?._id?.toString() ?? null,
    applicationStatus: existingApp?.status ?? null,
    savedAnalysis: existingApp?.fitScoreComputedAt
      ? {
          fitScore: existingApp.fitScore ?? 0,
          hardGaps: existingApp.hardGaps ?? [],
          softGaps: existingApp.softGaps ?? [],
          metRequirements: existingApp.metRequirements ?? [],
          suggestedPath: existingApp.suggestedPath ?? [],
          summary: existingApp.fitSummary ?? '',
          meta: existingApp.fitAnalysisMeta ?? buildUnknownAIMeta('gemini'),
        }
      : null,
    fitScore,
    daysLeft,
    isExpired,
    isActive,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function StudentJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const { jobId } = await params;
  const [data, usage] = await Promise.all([
    getJobData(jobId, session.user.id),
    getUsageSummary(session.user.id),
  ]);
  if (!data) redirect('/student/jobs');

  const {
    student,
    job,
    hasApplied,
    applicationId,
    applicationStatus,
    savedAnalysis,
    fitScore,
    daysLeft,
    isExpired,
    isActive,
    chrome,
  } = data;
  const typeStyle = TYPE_COLORS[job.type] ?? TYPE_COLORS['internship'];

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: student?.name ?? 'Student',
        email: student?.email ?? '',
        image: student?.image,
        userId: session.user.id,
        subtitle:
          [student?.university, student?.department].filter(Boolean).join(' | ') ||
          'Student workspace',
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

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Company logo */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 24,
                fontWeight: 900,
                flexShrink: 0,
                fontFamily: 'var(--font-display)',
              }}
            >
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt=""
                  style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }}
                />
              ) : (
                job.companyName.charAt(0)
              )}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
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
                {hasApplied && (
                  <span
                    style={{
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✓ Applied — {formatStatusLabel(applicationStatus ?? 'applied')}
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
                    <Clock size={14} /> {isExpired ? 'Deadline passed' : `${daysLeft} days left`}
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
                    {job.isStipendNegotiable && ' (negotiable)'}
                  </span>
                )}
                {!job.stipendBDT && job.isStipendNegotiable && (
                  <span style={{ color: '#94A3B8', fontSize: 14 }}>Negotiable stipend</span>
                )}
                {job.durationMonths && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#94A3B8',
                      fontSize: 14,
                    }}
                  >
                    <CalendarClock size={14} /> {job.durationMonths} months
                  </span>
                )}
              </div>
            </div>

            {/* Fit score + apply */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'flex-end',
                flexShrink: 0,
              }}
            >
              {(fitScore !== null || savedAnalysis) && (
                <JobFitScoreCard
                  jobId={job._id.toString()}
                  estimatedFitScore={fitScore}
                  aiFitScore={savedAnalysis?.fitScore ?? null}
                />
              )}
              <JobApplyButton
                jobId={job._id.toString()}
                jobType={job.type}
                hasApplied={hasApplied}
                isActive={isActive}
                isExpired={isExpired ?? false}
              />
              {hasApplied && (
                <MessageEmployerButton
                  employerId={job.employerId.toString()}
                  applicationStatus={applicationStatus}
                />
              )}
              {/* ✅ Fixed: <a> → <Link> for internal navigation */}
              <Link
                href="/student/jobs"
                style={{ color: '#64748B', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
              >
                ← Back to jobs
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <AISkillAnalysisCard
            jobId={job._id.toString()}
            jobTitle={job.title}
            hasApplied={hasApplied}
            initialAnalysis={savedAnalysis}
            initialUsage={JSON.parse(JSON.stringify(usage))}
          />
        </div>

        {/* Content grid */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginTop: 24 }}
          className="job-detail-grid"
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel title="About this role" description="">
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

            {/* Employer Reputation */}
            <Panel title="Company Reputation" description="">
              <div style={{ margin: '-10px 0' }}>
                <ReputationHistory userId={job.employerId.toString()} userRole="employer" />
              </div>
            </Panel>

            {/* Student Review Form (if hired) */}
            {applicationStatus === 'hired' && (
              <div style={{ marginTop: 8 }}>
                <StudentReviewForm
                  applicationId={applicationId || ''}
                  employerId={job.employerId.toString()}
                />
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Job details */}
            <Panel title="Job details" description="">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    icon: <GraduationCap size={15} />,
                    label: 'Type',
                    value: formatStatusLabel(job.type),
                  },
                  {
                    icon: <MapPin size={15} />,
                    label: 'Location',
                    value: job.city
                      ? `${job.city} (${formatStatusLabel(job.locationType)})`
                      : formatStatusLabel(job.locationType),
                  },
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

            {/* Requirements */}
            {(job.requiredSkills?.length > 0 ||
              job.minimumCGPA ||
              job.requiredCourses?.length > 0) && (
              <Panel title="Requirements" description="What this role needs from you">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                        {job.requiredSkills.map((s: string) => {
                          const studentHas = (student?.skills ?? [])
                            .map((x: string) => x.toLowerCase())
                            .includes(s.toLowerCase());
                          return (
                            <span
                              key={s}
                              style={{
                                background: studentHas ? '#ECFDF5' : '#FEF2F2',
                                color: studentHas ? '#065F46' : '#991B1B',
                                border: `1px solid ${studentHas ? '#A7F3D0' : '#FECACA'}`,
                                padding: '4px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {studentHas ? '✓ ' : '✗ '}
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {job.minimumCGPA && (
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}
                      >
                        Minimum CGPA
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color:
                            student?.cgpa && student.cgpa >= job.minimumCGPA
                              ? '#10B981'
                              : '#EF4444',
                        }}
                      >
                        {job.minimumCGPA.toFixed(2)}
                        {student?.cgpa && (
                          <span style={{ color: '#64748B', fontWeight: 400 }}>
                            {' '}
                            (yours: {student.cgpa.toFixed(2)})
                          </span>
                        )}
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

            {/* Targeting */}
            {(job.targetUniversities?.length > 0 || job.targetDepartments?.length > 0) && (
              <Panel title="Who can apply" description="">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
