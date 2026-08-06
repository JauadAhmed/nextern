import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { Application } from '@/models/Application';
import { evaluateBadges } from '@/lib/badge-engine';
import { JobReviewSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const parsed = JobReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { applicationId, reviewType, revieweeId } = parsed.data;

    // Validate Application Status
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'hired') {
      return NextResponse.json(
        { error: 'Review only allowed for hired candidates' },
        { status: 400 }
      );
    }

    const expectedReviewerId =
      reviewType === 'student_to_employer'
        ? application.studentId.toString()
        : application.employerId.toString();
    const expectedRevieweeId =
      reviewType === 'student_to_employer'
        ? application.employerId.toString()
        : application.studentId.toString();

    if (session.user.id !== expectedReviewerId) {
      return NextResponse.json(
        {
          error:
            reviewType === 'student_to_employer'
              ? 'Only the hired student can leave this review'
              : 'Only the employer can leave this review',
        },
        { status: 403 }
      );
    }

    if (revieweeId !== expectedRevieweeId) {
      return NextResponse.json(
        { error: 'Review recipient does not match application' },
        { status: 400 }
      );
    }

    const review = await Review.findOneAndUpdate(
      { applicationId, reviewType },
      {
        ...parsed.data,
        reviewerId: session.user.id,
        revieweeId: expectedRevieweeId,
        isVerified: true,
        isPublic: true,
      },
      { new: true, upsert: true }
    );

    const badgeResults =
      reviewType === 'student_to_employer'
        ? await Promise.allSettled([
            evaluateBadges(session.user.id, 'onReviewSubmitted', 'student'),
            evaluateBadges(expectedRevieweeId, 'onReviewReceived', 'employer'),
          ])
        : await Promise.allSettled([
            evaluateBadges(session.user.id, 'onReviewSubmitted', 'employer'),
            evaluateBadges(expectedRevieweeId, 'onReviewReceived', 'student'),
          ]);
    for (const result of badgeResults) {
      if (result.status === 'rejected') {
        console.error('Badge evaluation error on review:', result.reason);
      }
    }
    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    console.error('Create/Update review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
