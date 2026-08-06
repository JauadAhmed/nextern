import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { OpportunityRecommendationSchema } from '@/lib/validations';
import { canTeacherAccessStudent, resolveTeacherScope } from '@/lib/opportunity-recommendations';
import { Job } from '@/models/Job';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';
import { isValidObjectId } from '@/lib/object-id';

type Params = Promise<{ recommendationId: string }>;

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
    const parsed = OpportunityRecommendationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const scope = await resolveTeacherScope(session.user.id, session.user.role);
    const hasAccess = await canTeacherAccessStudent(scope, parsed.data.studentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Student is outside your scope.' }, { status: 403 });
    }

    const { recommendationId } = await params;
    if (!isValidObjectId(recommendationId)) {
      return NextResponse.json({ error: 'Invalid recommendation ID' }, { status: 400 });
    }
    await connectDB();

    // dept_head can edit any recommendation in their scope; advisor only their own
    const ownershipFilter =
      session.user.role === 'dept_head'
        ? { _id: recommendationId }
        : { _id: recommendationId, recommenderId: session.user.id };

    const existing = await OpportunityRecommendation.findOne(ownershipFilter).select(
      'studentId requestStatus employerResponseNote employerRespondedAt'
    );

    if (!existing) {
      return NextResponse.json({ error: 'Recommendation not found.' }, { status: 404 });
    }

    if (existing.studentId.toString() !== parsed.data.studentId) {
      return NextResponse.json(
        { error: 'Recommendations cannot be moved to a different student.' },
        { status: 400 }
      );
    }

    const linkedJob = await Job.findById(parsed.data.linkedJobId)
      .select('companyName type isActive employerId')
      .lean();

    if (!linkedJob) {
      return NextResponse.json({ error: 'Selected job was not found.' }, { status: 404 });
    }

    if (!linkedJob.isActive) {
      return NextResponse.json({ error: 'Selected job is no longer active.' }, { status: 400 });
    }

    if (
      linkedJob.type !== 'internship' &&
      linkedJob.type !== 'part-time' &&
      linkedJob.type !== 'full-time'
    ) {
      return NextResponse.json(
        { error: 'Only internship, part-time, or full-time jobs can be recommended here.' },
        { status: 400 }
      );
    }

    existing.category = parsed.data.category;
    existing.title = parsed.data.title;
    existing.description = parsed.data.description;
    existing.priority = parsed.data.priority;
    existing.focusSkills = parsed.data.focusSkills;
    existing.linkedJobId = parsed.data.linkedJobId;
    existing.resourceUrl = parsed.data.resourceUrl || undefined;
    existing.fitScore = parsed.data.fitScore;
    existing.employerId = linkedJob.employerId;
    existing.recommenderRole = session.user.role;
    existing.status = 'active';
    await existing.save();

    return NextResponse.json({
      message: 'Recommendation updated successfully.',
      recommendation: {
        id: existing._id.toString(),
        title: existing.title,
      },
    });
  } catch (error) {
    console.error('[OPPORTUNITY RECOMMENDATION UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update recommendation.' }, { status: 500 });
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

    const { recommendationId } = await params;
    if (!isValidObjectId(recommendationId)) {
      return NextResponse.json({ error: 'Invalid recommendation ID' }, { status: 400 });
    }
    await connectDB();

    // dept_head can delete any recommendation in their scope; advisor only their own
    const ownershipFilter =
      session.user.role === 'dept_head'
        ? { _id: recommendationId }
        : { _id: recommendationId, recommenderId: session.user.id };

    const deleted = await OpportunityRecommendation.findOneAndDelete(ownershipFilter).lean();

    if (!deleted) {
      return NextResponse.json({ error: 'Recommendation not found.' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Recommendation deleted successfully.',
      recommendation: { id: deleted._id.toString() },
    });
  } catch (error) {
    console.error('[OPPORTUNITY RECOMMENDATION DELETE ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete recommendation.' }, { status: 500 });
  }
}
