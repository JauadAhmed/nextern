import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AcademicReviewSchema } from '@/lib/validations';
import { canTeacherAccessStudent, resolveTeacherScope } from '@/lib/opportunity-recommendations';
import { AcademicReview } from '@/models/AcademicReview';
import { isValidObjectId } from '@/lib/object-id';

type Params = Promise<{ reviewId: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = AcademicReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const scope = await resolveTeacherScope(session.user.id, session.user.role);
    const hasAccess = await canTeacherAccessStudent(scope, parsed.data.studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Student is outside your scoped cohort.' },
        { status: 403 }
      );
    }

    const { reviewId } = await params;
    if (!isValidObjectId(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }
    await connectDB();

    // dept_head can edit any review in their scope; advisor only their own
    const ownershipFilter =
      session.user.role === 'dept_head'
        ? { _id: reviewId }
        : { _id: reviewId, reviewerId: session.user.id };

    const existing = await AcademicReview.findOne(ownershipFilter).select('studentId');

    if (!existing) {
      return NextResponse.json({ error: 'Academic review not found.' }, { status: 404 });
    }

    if (existing.studentId.toString() !== parsed.data.studentId) {
      return NextResponse.json(
        { error: 'Academic reviews cannot be moved to a different student.' },
        { status: 400 }
      );
    }

    existing.headline = parsed.data.headline;
    existing.summary = parsed.data.summary;
    existing.strengths = parsed.data.strengths;
    existing.growthAreas = parsed.data.growthAreas;
    existing.readinessLevel = parsed.data.readinessLevel;
    existing.profileScore = parsed.data.profileScore;
    existing.university = scope.institutionName ?? '';
    existing.department = scope.advisoryDepartment ?? '';
    existing.status = 'active';
    await existing.save();

    return NextResponse.json({
      message: 'Academic review updated successfully.',
      review: { id: existing._id.toString(), headline: existing.headline },
    });
  } catch (error) {
    console.error('[ACADEMIC REVIEW UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update academic review.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reviewId } = await params;
    if (!isValidObjectId(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }
    await connectDB();

    // dept_head can delete any review in their scope; advisor only their own
    const ownershipFilter =
      session.user.role === 'dept_head'
        ? { _id: reviewId }
        : { _id: reviewId, reviewerId: session.user.id };

    const deleted = await AcademicReview.findOneAndDelete(ownershipFilter).lean();

    if (!deleted) {
      return NextResponse.json({ error: 'Academic review not found.' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Academic review deleted successfully.',
      review: { id: deleted._id.toString() },
    });
  } catch (error) {
    console.error('[ACADEMIC REVIEW DELETE ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete academic review.' }, { status: 500 });
  }
}
