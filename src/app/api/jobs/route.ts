// src/app/api/jobs/route.ts
// GET  /api/jobs  — paginated job feed (personalized for students, own jobs for employers)
// POST /api/jobs  — create a new job (employer, advisor, dept_head — must be approved)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { User } from '@/models/User';
import { CreateJobSchema } from '@/lib/validations';
import { checkFeatureAccess, syncPremiumStatus } from '@/lib/premium';
import { syncOwnedEventToCalendar } from '@/lib/calendar';
import { onJobPosted, onEventCreated } from '@/lib/events';
import { parsePaginationParams } from '@/lib/pagination';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search') ?? '';
    const { page, limit, skip } = parsePaginationParams(searchParams, {
      defaultLimit: 12,
      maxLimit: 20,
    });
    const active = searchParams.get('active');

    await connectDB();

    const query: Record<string, unknown> = {};

    if (session.user.role === 'employer') {
      // Employers see only their own jobs
      query.employerId = session.user.id;
      if (active !== null) query.isActive = active === 'true';
    } else {
      // Students / advisors / dept_head see active public jobs
      query.isActive = true;
      query.applicationDeadline = { $gte: new Date() };

      // Personalized targeting for students
      if (session.user.role === 'student') {
        const student = await User.findById(session.user.id)
          .select('university department yearOfStudy')
          .lean();
        if (student?.university) {
          query.$or = [
            { targetUniversities: { $size: 0 } },
            { targetUniversities: student.university },
          ];
        }
      }
    }

    if (type) query.type = type;
    if (search) {
      const regex = { $regex: escapeRegExp(search), $options: 'i' };
      const searchClause = {
        $or: [{ title: regex }, { companyName: regex }, { description: regex }],
      };
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchClause];
        delete query.$or;
      } else {
        Object.assign(query, searchClause);
      }
    }

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ isPremiumListing: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(query),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET JOBS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── STEP 1: Role variables — declared first before any usage ──────────
    const isEmployer = session.user.role === 'employer';
    const isAdvisorOrDept = session.user.role === 'advisor' || session.user.role === 'dept_head';

    // ── STEP 2: Permission check ───────────────────────────────────────────
    if (!isEmployer && !isAdvisorOrDept) {
      return NextResponse.json(
        { error: 'Only employers, advisors, and department heads can post listings' },
        { status: 403 }
      );
    }
    if (session.user.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Your account must be approved before posting listings' },
        { status: 403 }
      );
    }

    // ── STEP 3: Parse and validate body ───────────────────────────────────
    const body = await req.json();
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // ── STEP 4: Restrict advisor/dept_head to webinar/workshop only ───────
    if (isAdvisorOrDept && !['webinar', 'workshop'].includes(parsed.data.type)) {
      return NextResponse.json(
        { error: 'Advisors and department heads can only post webinars or workshops' },
        { status: 403 }
      );
    }

    // ── STEP 5: DB operations ─────────────────────────────────────────────
    await connectDB();

    const premiumStatus = await syncPremiumStatus(session.user.id);
    if (isEmployer) {
      const access = await checkFeatureAccess(session.user.id, 'jobPosting');
      if (!access.allowed) {
        return NextResponse.json(
          { error: access.reason, requiresPremium: true, usage: access.usage },
          { status: 403 }
        );
      }
    }

    const poster = await User.findById(session.user.id)
      .select('companyName companyLogo institutionName image role')
      .lean();
    if (!poster) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use companyName for employers, institutionName for advisors/dept_head
    const displayName = isEmployer
      ? (poster.companyName ?? '')
      : (poster.institutionName ?? 'University');

    const data = parsed.data;

    const job = await Job.create({
      title: data.title,
      type: data.type,
      description: data.description,
      responsibilities: data.responsibilities ?? [],
      locationType: data.locationType,
      city: data.city,
      stipendBDT: data.stipendBDT,
      isStipendNegotiable: data.isStipendNegotiable ?? false,
      applicationDeadline: data.applicationDeadline
        ? new Date(data.applicationDeadline)
        : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      durationMonths: data.durationMonths,
      targetUniversities: data.targetUniversities ?? [],
      targetDepartments: data.targetDepartments ?? [],
      targetYears: data.targetYears ?? [],
      requiredSkills: data.requiredSkills ?? [],
      minimumCGPA: data.minimumCGPA,
      requiredCourses: data.requiredCourses ?? [],
      experienceExpectations: data.experienceExpectations,
      preferredCertifications: data.preferredCertifications ?? [],
      isBatchHiring: data.isBatchHiring ?? false,
      batchUniversities: data.batchUniversities ?? [],
      isActive: data.isActive ?? true,
      isPremiumListing: isEmployer ? premiumStatus.isPremium : false,
      academicSession: data.academicSession,
      employerId: session.user.id,
      companyName: displayName,
      companyLogo: poster.companyLogo ?? poster.image,
    });

    if (
      isAdvisorOrDept &&
      (job.type === 'webinar' || job.type === 'workshop') &&
      job.startDate &&
      job.startDate > new Date()
    ) {
      await syncOwnedEventToCalendar(
        session.user.id,
        job._id.toString(),
        job.title,
        job.companyName,
        job.startDate,
        job.type,
        job.applicationDeadline
      );
    }

    // Trigger badge evaluation
    if (isEmployer) {
      await onJobPosted(session.user.id).catch(console.error);
    } else if (isAdvisorOrDept) {
      await onEventCreated(session.user.id).catch(console.error);
    }

    return NextResponse.json({ message: 'Job posted successfully', job }, { status: 201 });
  } catch (error) {
    console.error('[CREATE JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
