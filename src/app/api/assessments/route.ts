import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { dhakaDateTimeInputToISOString } from '@/lib/datetime';
import { CreateAssessmentSchema } from '@/lib/validations';
import {
  createAssessment,
  PremiumAccessError,
  syncAssessmentAssignmentStates,
} from '@/lib/hiring-suite';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { isValidObjectId } from '@/lib/object-id';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (jobId && !isValidObjectId(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    if (session.user.role === 'employer') {
      const query: Record<string, unknown> = { employerId: session.user.id };
      if (jobId) query.jobId = jobId;

      const pendingAssignmentIds = await AssessmentAssignment.find({
        employerId: session.user.id,
        ...(jobId ? { jobId } : {}),
        status: { $in: ['assigned', 'started'] },
      })
        .select('_id')
        .lean();

      if (pendingAssignmentIds.length > 0) {
        await syncAssessmentAssignmentStates(
          pendingAssignmentIds.map((assignment) => assignment._id.toString())
        );
      }

      const assessments = await Assessment.find(query).sort({ createdAt: -1 }).lean();
      const assessmentIds = assessments.map((item) => item._id);

      const summaryRows =
        assessmentIds.length > 0
          ? await AssessmentAssignment.aggregate([
              { $match: { assessmentId: { $in: assessmentIds } } },
              {
                $group: {
                  _id: '$assessmentId',
                  assigned: { $sum: 1 },
                  submitted: {
                    $sum: {
                      $cond: [{ $in: ['$status', ['submitted', 'graded']] }, 1, 0],
                    },
                  },
                  graded: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'graded'] }, 1, 0],
                    },
                  },
                  averageScore: { $avg: '$totalScore' },
                },
              },
            ])
          : [];

      const summaryMap = new Map(summaryRows.map((row) => [row._id.toString(), row]));
      return NextResponse.json({
        assessments: assessments.map((assessment) => {
          const summary = summaryMap.get(assessment._id.toString());
          return {
            ...assessment,
            summary: {
              assigned: summary?.assigned ?? 0,
              submitted: summary?.submitted ?? 0,
              graded: summary?.graded ?? 0,
              averageScore:
                typeof summary?.averageScore === 'number' ? Math.round(summary.averageScore) : null,
            },
          };
        }),
      });
    }

    if (session.user.role === 'student') {
      const pendingAssignmentIds = await AssessmentAssignment.find({
        studentId: session.user.id,
        status: { $in: ['assigned', 'started'] },
      })
        .select('_id')
        .lean();

      if (pendingAssignmentIds.length > 0) {
        await syncAssessmentAssignmentStates(
          pendingAssignmentIds.map((assignment) => assignment._id.toString())
        );
      }

      const assignments = await AssessmentAssignment.find({ studentId: session.user.id })
        .populate('assessmentId', 'title durationMinutes dueAt')
        .populate('jobId', 'title companyName')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ assignments });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[ASSESSMENTS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch assessments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const assessment = await createAssessment({
      employerId: session.user.id,
      jobId: parsed.data.jobId,
      title: parsed.data.title,
      type: parsed.data.type,
      questions: parsed.data.questions,
      totalMarks: parsed.data.totalMarks,
      passingMarks: parsed.data.passingMarks,
      durationMinutes: parsed.data.durationMinutes,
      instructions: parsed.data.instructions || undefined,
      isTimedAutoSubmit: parsed.data.isTimedAutoSubmit,
      allowLateSubmission: parsed.data.allowLateSubmission,
      dueAt: parsed.data.dueAt
        ? (() => {
            const iso = dhakaDateTimeInputToISOString(parsed.data.dueAt);
            return iso ? new Date(iso) : null;
          })()
        : null,
      reminderOffsetsMinutes: parsed.data.reminderOffsetsMinutes,
      applicationIds: parsed.data.applicationIds,
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error('[ASSESSMENTS POST ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create assessment.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
