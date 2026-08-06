import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { notifyRecommendationRequestDecision } from '@/lib/notify';
import { EmployerRecommendationRequestDecisionSchema } from '@/lib/validations';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';
import { User } from '@/models/User';
import { isValidObjectId } from '@/lib/object-id';

type Params = Promise<{ recommendationId: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = EmployerRecommendationRequestDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { recommendationId } = await params;
    if (!isValidObjectId(recommendationId)) {
      return NextResponse.json({ error: 'Invalid recommendation ID' }, { status: 400 });
    }

    await connectDB();

    const recommendation = await OpportunityRecommendation.findOne({
      _id: recommendationId,
      employerId: session.user.id,
      status: 'active',
      category: 'job',
    })
      .populate('studentId', 'name email')
      .populate('linkedJobId', 'title')
      .lean();

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation request not found.' }, { status: 404 });
    }

    const updated = await OpportunityRecommendation.findByIdAndUpdate(
      recommendationId,
      {
        $set: {
          requestStatus: parsed.data.requestStatus,
          employerResponseNote: parsed.data.employerResponseNote || undefined,
          employerRespondedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    const employer = await User.findById(session.user.id).select('companyName name').lean();
    const employerName =
      employer?.companyName?.trim() || employer?.name?.trim() || 'The employer team';

    await notifyRecommendationRequestDecision({
      recommendationId,
      recommenderId: recommendation.recommenderId.toString(),
      recommenderRole: recommendation.recommenderRole,
      employerName,
      studentId:
        recommendation.studentId && typeof recommendation.studentId === 'object'
          ? recommendation.studentId._id.toString()
          : '',
      studentName:
        recommendation.studentId && typeof recommendation.studentId === 'object'
          ? recommendation.studentId.name
          : 'the student',
      jobId:
        recommendation.linkedJobId && typeof recommendation.linkedJobId === 'object'
          ? recommendation.linkedJobId._id.toString()
          : '',
      jobTitle:
        recommendation.linkedJobId && typeof recommendation.linkedJobId === 'object'
          ? recommendation.linkedJobId.title
          : recommendation.title,
      requestStatus: parsed.data.requestStatus,
      employerResponseNote: parsed.data.employerResponseNote,
    });

    return NextResponse.json({
      message: 'Recommendation request updated successfully.',
      recommendation: {
        id: updated?._id.toString(),
        requestStatus: updated?.requestStatus,
        employerResponseNote: updated?.employerResponseNote ?? null,
      },
    });
  } catch (error) {
    console.error('[EMPLOYER RECOMMENDATION REQUEST UPDATE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation request.' },
      { status: 500 }
    );
  }
}
