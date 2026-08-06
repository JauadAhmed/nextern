import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { AdvisorAction } from '@/models/AdvisorAction';
import { DepartmentBenchmark } from '@/models/DepartmentBenchmark';
import { Review } from '@/models/Review';

export type ChromeUser = {
  name: string;
  email: string;
  image?: string;
  subtitle: string;
  unreadNotifications: number;
  unreadMessages: number;
  userId?: string;
};

export type PipelineMetric = {
  label: string;
  count: number;
};

export type EmployerDashboardData = {
  chromeUser: ChromeUser;
  company: {
    companyName: string;
    industry?: string;
    headquartersCity?: string;
    companyWebsite?: string;
    companyDescription?: string;
  };
  stats: {
    activeJobs: number;
    totalApplications: number;
    shortlisted: number;
    interviews: number;
    hired: number;
  };
  pipeline: PipelineMetric[];
  recentJobs: {
    id: string;
    title: string;
    type: string;
    locationType: string;
    city?: string;
    isActive: boolean;
    applicationCount: number;
    applicationDeadline?: string;
  }[];
  recentApplications: {
    id: string;
    studentName: string;
    university?: string;
    department?: string;
    jobTitle: string;
    status: string;
    fitScore?: number;
    appliedAt: string;
  }[];
  topCandidates: {
    id: string;
    studentName: string;
    university?: string;
    department?: string;
    jobTitle: string;
    fitScore?: number;
    status: string;
  }[];
};

export type AdvisorDashboardData = {
  chromeUser: ChromeUser;
  advisor: {
    institutionName?: string;
    advisoryDepartment?: string;
    designation?: string;
  };
  stats: {
    totalAdvisees: number;
    priorityStudents: number;
    avgOpportunityScore: number;
    avgProfileCompleteness: number;
    totalAdvisorActions: number;
  };
  attentionStudents: {
    id: string;
    name: string;
    university?: string;
    department?: string;
    opportunityScore: number;
    profileCompleteness: number;
    cgpa?: number;
    priorityFlagged: boolean;
  }[];
  recentActions: {
    id: string;
    studentName: string;
    actionType: string;
    createdAt: string;
    advisorNote?: string;
  }[];
  upcomingInterviews: {
    id: string;
    studentName: string;
    jobTitle: string;
    companyName: string;
    scheduledAt: string;
  }[];
  topSkillGaps: string[];
  reputationStats: {
    totalReviews: number;
    totalRecommendations: number;
    avgWorkQuality: number;
  };
  recentRecommendations: {
    id: string;
    studentName: string;
    companyName: string;
    text: string;
  }[];
};

export type DepartmentDashboardData = {
  chromeUser: ChromeUser;
  department: {
    institutionName?: string;
    advisoryDepartment?: string;
    designation?: string;
    benchmark?: {
      cohort: string;
      minReadinessScore: number;
      minFitScore: number;
      minCGPA: number;
    };
  };
  stats: {
    totalStudents: number;
    deptStudents: number;
    activeOpenings: number;
    totalApplications: number;
    hiredStudents: number;
    avgOpportunityScore: number;
    avgCGPA: number;
  };
  pipeline: PipelineMetric[];
  readinessDistribution: {
    ready: { count: number; pct: number };
    partial: { count: number; pct: number };
    notReady: { count: number; pct: number };
  };
  skillHeatmap: { skill: string; count: number; pct: number }[];
  industryAlignment: {
    skill: string;
    demand: number;
    supply: number;
    supplyPct: number;
    demandPct: number;
    gap: boolean;
  }[];
  semesterTrend: {
    semester: string;
    avgScore: number;
    avgCGPA: number;
    studentCount: number;
  }[];
  topStudents: {
    id: string;
    name: string;
    department?: string;
    yearOfStudy?: number;
    opportunityScore: number;
    profileCompleteness: number;
    cgpa?: number;
  }[];
  upcomingOpenings: {
    id: string;
    title: string;
    companyName: string;
    type: string;
    applicationCount: number;
    deadline?: string;
  }[];
  skillSnapshot: string[];
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildPipeline(applications: Array<{ status: string }>): PipelineMetric[] {
  const counts = {
    Applied: 0,
    Shortlisted: 0,
    Interviews: 0,
    Hired: 0,
  };

  applications.forEach((application) => {
    if (application.status === 'applied') counts.Applied += 1;
    if (['shortlisted', 'under_review', 'assessment_sent'].includes(application.status)) {
      counts.Shortlisted += 1;
    }
    if (application.status === 'interview_scheduled') counts.Interviews += 1;
    if (application.status === 'hired') counts.Hired += 1;
  });

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function topTerms(values: string[], limit = 6) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

async function getChromeCounts(userId: mongoose.Types.ObjectId) {
  const [unreadNotifications, unreadMessages] = await Promise.all([
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  return { unreadNotifications, unreadMessages };
}

function normalizeDashboardIdentity(identity: string | { userId?: string; email?: string }) {
  if (typeof identity === 'string') {
    return { userId: identity, email: undefined };
  }

  return identity;
}

async function resolveRoleUser<TSelected extends { _id: mongoose.Types.ObjectId }>(
  identity: string | { userId?: string; email?: string },
  role: 'employer' | 'advisor' | 'dept_head' | Array<'employer' | 'advisor' | 'dept_head'>,
  select: string
) {
  const { userId, email } = normalizeDashboardIdentity(identity);
  let user: TSelected | null = null;
  let oid: mongoose.Types.ObjectId | null = null;
  const roles = Array.isArray(role) ? role : [role];
  const roleQuery = roles.length === 1 ? roles[0] : { $in: roles };

  if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
    oid = new mongoose.Types.ObjectId(userId);
    user = (await User.findOne({ _id: oid, role: roleQuery })
      .select(select)
      .lean()) as TSelected | null;
  }

  if (!user && email) {
    user = (await User.findOne({ email: email.toLowerCase().trim(), role: roleQuery })
      .select(select)
      .lean()) as TSelected | null;

    if (user) {
      oid = new mongoose.Types.ObjectId(user._id.toString());
    }
  }

  return { user, oid };
}

export async function getEmployerDashboardData(
  identity: string | { userId?: string; email?: string }
): Promise<EmployerDashboardData> {
  await connectDB();
  const { user, oid } = await resolveRoleUser<{
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    image?: string;
    companyName?: string;
    industry?: string;
    headquartersCity?: string;
    companyWebsite?: string;
    companyDescription?: string;
  }>(
    identity,
    'employer',
    'name email image companyName industry headquartersCity companyWebsite companyDescription'
  );

  if (!user || !oid) throw new Error('Employer not found');

  const [jobs, applications, chromeCounts] = await Promise.all([
    Job.find({ employerId: oid })
      .select('title type locationType city isActive applicationCount applicationDeadline')
      .sort({ createdAt: -1 })
      .lean(),
    Application.find({ employerId: oid, isEventRegistration: false })
      .select('studentId jobId status fitScore appliedAt')
      .sort({ appliedAt: -1 })
      .lean(),
    getChromeCounts(oid),
  ]);

  const studentIds = Array.from(
    new Set(applications.map((application) => application.studentId.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));
  const jobIds = Array.from(
    new Set(applications.map((application) => application.jobId.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));

  const [students, applicationJobs] = await Promise.all([
    studentIds.length
      ? User.find({ _id: { $in: studentIds } })
          .select('name university department cgpa')
          .lean()
      : [],
    jobIds.length
      ? Job.find({ _id: { $in: jobIds } })
          .select('title companyName')
          .lean()
      : [],
  ]);

  const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
  const jobMap = new Map(applicationJobs.map((job) => [job._id.toString(), job]));

  const recentApplications = applications.slice(0, 6).map((application) => {
    const student = studentMap.get(application.studentId.toString());
    const job = jobMap.get(application.jobId.toString());

    return {
      id: application._id.toString(),
      studentName: student?.name ?? 'Unknown student',
      university: student?.university,
      department: student?.department,
      jobTitle: job?.title ?? 'Unknown role',
      status: application.status,
      fitScore: application.fitScore,
      appliedAt: application.appliedAt?.toISOString() ?? new Date().toISOString(),
    };
  });

  const topCandidates = [...applications]
    .sort((left, right) => (right.fitScore ?? 0) - (left.fitScore ?? 0))
    .slice(0, 5)
    .map((application) => {
      const student = studentMap.get(application.studentId.toString());
      const job = jobMap.get(application.jobId.toString());

      return {
        id: application._id.toString(),
        studentName: student?.name ?? 'Unknown student',
        university: student?.university,
        department: student?.department,
        jobTitle: job?.title ?? 'Unknown role',
        fitScore: application.fitScore,
        status: application.status,
      };
    });

  return {
    chromeUser: {
      name: user.name,
      email: user.email,
      image: user.image,
      subtitle: user.companyName ?? 'Employer workspace',
      ...chromeCounts,
      userId: oid.toString(),
    },
    company: {
      companyName: user.companyName ?? 'Your company',
      industry: user.industry,
      headquartersCity: user.headquartersCity,
      companyWebsite: user.companyWebsite,
      companyDescription: user.companyDescription,
    },
    stats: {
      activeJobs: jobs.filter((job) => job.isActive).length,
      totalApplications: applications.length,
      shortlisted: applications.filter((application) =>
        ['shortlisted', 'under_review', 'assessment_sent'].includes(application.status)
      ).length,
      interviews: applications.filter((application) => application.status === 'interview_scheduled')
        .length,
      hired: applications.filter((application) => application.status === 'hired').length,
    },
    pipeline: buildPipeline(applications),
    recentJobs: jobs.slice(0, 5).map((job) => ({
      id: job._id.toString(),
      title: job.title,
      type: job.type,
      locationType: job.locationType,
      city: job.city,
      isActive: job.isActive,
      applicationCount: job.applicationCount ?? 0,
      applicationDeadline: job.applicationDeadline?.toISOString(),
    })),
    recentApplications,
    topCandidates,
  };
}

export async function getAdvisorDashboardData(
  identity: string | { userId?: string; email?: string }
): Promise<AdvisorDashboardData> {
  await connectDB();
  const { user, oid } = await resolveRoleUser<{
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: 'advisor' | 'dept_head';
    image?: string;
    institutionName?: string;
    advisoryDepartment?: string;
    designation?: string;
  }>(
    identity,
    ['advisor', 'dept_head'],
    'name email role image institutionName advisoryDepartment designation'
  );

  if (!user || !oid) throw new Error('Advisor not found');
  const isDeptHead = user.role === 'dept_head';

  const [students, actions, chromeCounts] = await Promise.all([
    User.find(
      isDeptHead
        ? { role: 'student', university: user.institutionName }
        : { assignedAdvisorId: oid, role: 'student' }
    )
      .select('name university department opportunityScore profileCompleteness cgpa')
      .sort({ opportunityScore: 1, profileCompleteness: 1 })
      .lean(),
    AdvisorAction.find({ advisorId: oid })
      .select('studentId actionType advisorNote isPriorityFlagged createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    getChromeCounts(oid),
  ]);

  const studentIds = students.map((student) => student._id);
  const [applications, reviews] = await Promise.all([
    studentIds.length
      ? Application.find({ studentId: { $in: studentIds }, isEventRegistration: false })
          .select('studentId jobId status interviewScheduledAt hardGaps')
          .lean()
      : [],
    studentIds.length
      ? Review.find({
          revieweeId: { $in: studentIds },
          reviewType: 'employer_to_student',
          isPublic: true,
          isVerified: true,
        })
          .populate('reviewerId', 'name companyName')
          .lean()
      : [],
  ]);

  const interviewJobIds = applications
    .filter((application) => application.status === 'interview_scheduled')
    .map((application) => application.jobId);
  const interviewJobs = interviewJobIds.length
    ? await Job.find({ _id: { $in: interviewJobIds } })
        .select('title companyName')
        .lean()
    : [];

  const flaggedStudentIds = new Set(
    actions
      .filter((action) => action.isPriorityFlagged)
      .map((action) => action.studentId.toString())
  );
  const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
  const jobMap = new Map(interviewJobs.map((job) => [job._id.toString(), job]));

  const topSkillGaps = topTerms(
    applications.flatMap((application) => application.hardGaps ?? []),
    6
  );

  const upcomingInterviews = applications
    .filter(
      (application) =>
        application.status === 'interview_scheduled' &&
        application.interviewScheduledAt &&
        new Date(application.interviewScheduledAt) >= new Date()
    )
    .sort(
      (left, right) =>
        new Date(left.interviewScheduledAt ?? 0).getTime() -
        new Date(right.interviewScheduledAt ?? 0).getTime()
    )
    .slice(0, 5)
    .map((application) => ({
      id: application._id.toString(),
      studentName: studentMap.get(application.studentId.toString())?.name ?? 'Unknown student',
      jobTitle: jobMap.get(application.jobId.toString())?.title ?? 'Unknown role',
      companyName: jobMap.get(application.jobId.toString())?.companyName ?? 'Unknown company',
      scheduledAt: application.interviewScheduledAt?.toISOString() ?? new Date().toISOString(),
    }));

  const attentionStudents = students.slice(0, 6).map((student) => ({
    id: student._id.toString(),
    name: student.name,
    university: student.university,
    department: student.department,
    opportunityScore: student.opportunityScore ?? 0,
    profileCompleteness: student.profileCompleteness ?? 0,
    cgpa: student.cgpa,
    priorityFlagged:
      flaggedStudentIds.has(student._id.toString()) ||
      (student.opportunityScore ?? 0) < 40 ||
      (student.profileCompleteness ?? 0) < 60,
  }));

  const recentActions = actions.slice(0, 5).map((action) => ({
    id: action._id.toString(),
    studentName: studentMap.get(action.studentId.toString())?.name ?? 'Unknown student',
    actionType: action.actionType,
    createdAt: action.createdAt?.toISOString() ?? new Date().toISOString(),
    advisorNote: action.advisorNote,
  }));

  const priorityStudents = students.filter(
    (student) =>
      flaggedStudentIds.has(student._id.toString()) ||
      (student.opportunityScore ?? 0) < 40 ||
      (student.profileCompleteness ?? 0) < 60
  ).length;

  let totalWorkQuality = 0;
  let workQualityRatingCount = 0;
  let totalRecommendations = 0;
  const rawRecommendations: {
    id: string;
    studentName: string;
    companyName: string;
    text: string;
    createdAt: Date;
  }[] = [];

  reviews.forEach(
    (r: {
      _id: unknown;
      workQualityRating?: number;
      isRecommended?: boolean;
      recommendationText?: string;
      revieweeId: unknown;
      reviewerId?: { name?: string; companyName?: string };
      createdAt: Date;
    }) => {
      if (r.workQualityRating) {
        totalWorkQuality += r.workQualityRating;
        workQualityRatingCount++;
      }
      if (r.isRecommended) {
        totalRecommendations++;
      }
      if (r.recommendationText) {
        rawRecommendations.push({
          id: String(r._id),
          studentName: studentMap.get(String(r.revieweeId))?.name ?? 'Unknown Student',
          companyName: r.reviewerId?.companyName || r.reviewerId?.name || 'Company',
          text: r.recommendationText,
          createdAt: r.createdAt,
        });
      }
    }
  );

  const recentRecommendations = rawRecommendations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      studentName: r.studentName,
      companyName: r.companyName,
      text: r.text,
    }));

  return {
    chromeUser: {
      name: user.name,
      email: user.email,
      image: user.image,
      subtitle:
        [user.designation, user.institutionName].filter(Boolean).join(' at ') ||
        (isDeptHead ? 'Department head advisor view' : 'Advisor workspace'),
      ...chromeCounts,
      userId: oid.toString(),
    },
    advisor: {
      institutionName: user.institutionName,
      advisoryDepartment: user.advisoryDepartment,
      designation: user.designation,
    },
    stats: {
      totalAdvisees: students.length,
      priorityStudents,
      avgOpportunityScore: average(students.map((student) => student.opportunityScore ?? 0)),
      avgProfileCompleteness: average(students.map((student) => student.profileCompleteness ?? 0)),
      totalAdvisorActions: actions.length,
    },
    attentionStudents,
    recentActions,
    upcomingInterviews,
    topSkillGaps,
    reputationStats: {
      totalReviews: reviews.length,
      totalRecommendations,
      avgWorkQuality: workQualityRatingCount
        ? Number((totalWorkQuality / workQualityRatingCount).toFixed(1))
        : 0,
    },
    recentRecommendations,
  };
}

export async function getDeptDashboardData(
  identity: string | { userId?: string; email?: string }
): Promise<DepartmentDashboardData> {
  await connectDB();
  const { user, oid } = await resolveRoleUser<{
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    image?: string;
    institutionName?: string;
    advisoryDepartment?: string;
    designation?: string;
  }>(identity, 'dept_head', 'name email image institutionName advisoryDepartment designation');

  if (!user || !oid) throw new Error('Department head not found');

  const [benchmark, chromeCounts] = await Promise.all([
    DepartmentBenchmark.findOne({ deptHeadId: oid, isActive: true }).sort({ updatedAt: -1 }).lean(),
    getChromeCounts(oid),
  ]);

  // ── Both views: dept students + all university students ──
  const [students, allUniStudents] = await Promise.all([
    User.find({
      role: 'student',
      university: user.institutionName,
      department: user.advisoryDepartment,
    })
      .select(
        'name department yearOfStudy currentSemester opportunityScore profileCompleteness cgpa skills'
      )
      .sort({ opportunityScore: -1 })
      .lean(),
    User.find({
      role: 'student',
      university: user.institutionName,
    })
      .select(
        'name department yearOfStudy currentSemester opportunityScore profileCompleteness cgpa skills'
      )
      .lean(),
  ]);

  const studentIds = students.map((student) => student._id);
  const applications = studentIds.length
    ? await Application.find({ studentId: { $in: studentIds }, isEventRegistration: false })
        .select('status')
        .lean()
    : [];

  const allOpenJobs = await Job.find({
    isActive: true,
    applicationDeadline: { $gte: new Date() },
  })
    .select(
      'title companyName type applicationDeadline applicationCount targetUniversities targetDepartments requiredSkills'
    )
    .sort({ applicationDeadline: 1 })
    .lean();

  const relevantJobs = allOpenJobs.filter((job) => {
    const matchesUniversity =
      !job.targetUniversities?.length ||
      job.targetUniversities.includes(user.institutionName ?? '');
    const matchesDepartment =
      !job.targetDepartments?.length ||
      job.targetDepartments.includes(user.advisoryDepartment ?? '');
    return matchesUniversity && matchesDepartment;
  });

  // ── Readiness distribution (university-wide) ──
  const uniTotal = allUniStudents.length || 1;
  const readyCount = allUniStudents.filter((s) => (s.opportunityScore ?? 0) >= 70).length;
  const partialCount = allUniStudents.filter(
    (s) => (s.opportunityScore ?? 0) >= 40 && (s.opportunityScore ?? 0) < 70
  ).length;
  const notReadyCount = allUniStudents.filter((s) => (s.opportunityScore ?? 0) < 40).length;
  const readinessDistribution = {
    ready: { count: readyCount, pct: Math.round((readyCount / uniTotal) * 100) },
    partial: { count: partialCount, pct: Math.round((partialCount / uniTotal) * 100) },
    notReady: { count: notReadyCount, pct: Math.round((notReadyCount / uniTotal) * 100) },
  };

  // ── Skill heatmap (dept students) ──
  const skillFreq: Record<string, number> = {};
  students.forEach((s) => {
    (s.skills ?? []).forEach((sk: string) => {
      skillFreq[sk] = (skillFreq[sk] ?? 0) + 1;
    });
  });
  const skillHeatmap = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill, count]) => ({
      skill,
      count,
      pct: Math.round((count / (students.length || 1)) * 100),
    }));

  // ── Industry demand alignment ──
  const demandFreq: Record<string, number> = {};
  relevantJobs.forEach((job) => {
    (job.requiredSkills ?? []).forEach((sk: string) => {
      demandFreq[sk] = (demandFreq[sk] ?? 0) + 1;
    });
  });
  const industryAlignment = Object.entries(demandFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([skill, demand]) => ({
      skill,
      demand,
      supply: skillFreq[skill] ?? 0,
      supplyPct: Math.round(((skillFreq[skill] ?? 0) / (students.length || 1)) * 100),
      demandPct: Math.round((demand / (relevantJobs.length || 1)) * 100),
      gap: demand > (skillFreq[skill] ?? 0),
    }));

  // ── Semester-over-semester trend (university-wide) ──
  const semMap: Record<string, { scores: number[]; cgpas: number[] }> = {};
  allUniStudents.forEach((s) => {
    const sem = s.currentSemester ?? 'Unknown';
    if (!semMap[sem]) semMap[sem] = { scores: [], cgpas: [] };
    semMap[sem].scores.push(s.opportunityScore ?? 0);
    if (typeof s.cgpa === 'number') semMap[sem].cgpas.push(s.cgpa);
  });
  const semesterTrend = Object.entries(semMap)
    .map(([semester, d]) => ({
      semester,
      avgScore: d.scores.length
        ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length)
        : 0,
      avgCGPA: d.cgpas.length
        ? parseFloat((d.cgpas.reduce((a, b) => a + b, 0) / d.cgpas.length).toFixed(2))
        : 0,
      studentCount: d.scores.length,
    }))
    .sort((a, b) => a.semester.localeCompare(b.semester));

  // ── Top students ──
  const topStudents = students.slice(0, 6).map((student) => ({
    id: student._id.toString(),
    name: student.name,
    department: student.department,
    yearOfStudy: student.yearOfStudy,
    opportunityScore: student.opportunityScore ?? 0,
    profileCompleteness: student.profileCompleteness ?? 0,
    cgpa: student.cgpa,
  }));

  return {
    chromeUser: {
      name: user.name,
      email: user.email,
      image: user.image,
      subtitle:
        [user.designation, user.advisoryDepartment].filter(Boolean).join(' | ') ||
        'Department workspace',
      ...chromeCounts,
      userId: oid.toString(),
    },
    department: {
      institutionName: user.institutionName,
      advisoryDepartment: user.advisoryDepartment,
      designation: user.designation,
      benchmark: benchmark
        ? {
            cohort: benchmark.cohort,
            minReadinessScore: benchmark.minReadinessScore,
            minFitScore: benchmark.minFitScore,
            minCGPA: benchmark.minCGPA,
          }
        : undefined,
    },
    stats: {
      totalStudents: allUniStudents.length,
      deptStudents: students.length,
      activeOpenings: relevantJobs.length,
      totalApplications: applications.length,
      hiredStudents: applications.filter((application) => application.status === 'hired').length,
      avgOpportunityScore: average(students.map((student) => student.opportunityScore ?? 0)),
      avgCGPA: average(
        students
          .map((student) => (typeof student.cgpa === 'number' ? student.cgpa : 0))
          .filter(Boolean)
      ),
    },
    pipeline: buildPipeline(applications),
    readinessDistribution,
    skillHeatmap,
    industryAlignment,
    semesterTrend,
    topStudents,
    upcomingOpenings: relevantJobs.slice(0, 6).map((job) => ({
      id: job._id.toString(),
      title: job.title,
      companyName: job.companyName,
      type: job.type,
      applicationCount: job.applicationCount ?? 0,
      deadline: job.applicationDeadline?.toISOString(),
    })),
    skillSnapshot: topTerms(
      students.flatMap((student) => student.skills ?? []),
      8
    ),
  };
}
