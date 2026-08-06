import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { dhakaDateTimeInputToISOString } from '@/lib/datetime';
import {
  AssessmentActionSchema,
  GradeAssessmentSchema,
  UpdateAssessmentSchema,
} from '@/lib/validations';
import {
  assignAssessmentToApplications,
  gradeAssessmentAssignment,
  PremiumAccessError,
  syncAssessmentAssignmentStates,
} from '@/lib/hiring-suite';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { isValidObjectId } from '@/lib/object-id';

type Params = { params: Promise<{ assessmentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assessmentId } = await params;
    if (!isValidObjectId(assessmentId)) {
      return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
    }
    await connectDB();

    const pendingAssignmentIds = await AssessmentAssignment.find({
      assessmentId,
      employerId: session.user.id,
      status: { $in: ['assigned', 'started'] },
    })
      .select('_id')
      .lean();

    if (pendingAssignmentIds.length > 0) {
      await syncAssessmentAssignmentStates(
        pendingAssignmentIds.map((assignment) => assignment._id.toString())
      );
    }

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      employerId: session.user.id,
    }).lean();
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    const [assignments, submissions] = await Promise.all([
      AssessmentAssignment.find({ assessmentId })
        .populate('studentId', 'name email university department isPremium')
        .populate('applicationId', 'status fitScore')
        .sort({ createdAt: -1 })
        .lean(),
      AssessmentSubmission.find({ assessmentId })
        .select('assignmentId answers objectiveScore manualScore totalScore isPassed submittedAt')
        .lean(),
    ]);

    const submissionMap = new Map(submissions.map((item) => [item.assignmentId.toString(), item]));

    return NextResponse.json({
      assessment,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        submission: submissionMap.get(assignment._id.toString()) ?? null,
        application:
          assignment.applicationId && typeof assignment.applicationId === 'object'
            ? {
                _id: String((assignment.applicationId as { _id?: unknown })._id ?? ''),
                status: (assignment.applicationId as { status?: string }).status ?? '',
                fitScore: (assignment.applicationId as { fitScore?: number }).fitScore ?? null,
              }
            : null,
      })),
    });
  } catch (error) {
    console.error('[ASSESSMENT DETAIL GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch assessment.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assessmentId } = await params;
    if (!isValidObjectId(assessmentId)) {
      return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
    }
    const body = await req.json();

    if (body?.action === 'grade_assignment') {
      const parsed = GradeAssessmentSchema.safeParse(body);
      if (!parsed.success || typeof body.assignmentId !== 'string') {
        return NextResponse.json({ error: 'Invalid grading payload.' }, { status: 400 });
      }

      const submission = await gradeAssessmentAssignment({
        employerId: session.user.id,
        assignmentId: body.assignmentId,
        manualAdjustments: parsed.data.manualAdjustments,
      });
      return NextResponse.json({ submission });
    }

    await connectDB();
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      employerId: session.user.id,
    });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    if (typeof body?.action === 'string') {
      const parsedAction = AssessmentActionSchema.safeParse(body);
      if (!parsedAction.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: parsedAction.error.flatten().fieldErrors,
            issues: parsedAction.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      if (parsedAction.data.action === 'assign') {
        const normalizedDueAt = dhakaDateTimeInputToISOString(parsedAction.data.dueAt);
        const assignments = await assignAssessmentToApplications({
          employerId: session.user.id,
          assessmentId,
          applicationIds: parsedAction.data.applicationIds,
          dueAt: normalizedDueAt ? new Date(normalizedDueAt) : undefined,
        });
        return NextResponse.json({ assignments });
      }

      assessment.isActive = parsedAction.data.action === 'reactivate';
      if (parsedAction.data.dueAt) {
        const normalizedDueAt = dhakaDateTimeInputToISOString(parsedAction.data.dueAt);
        if (normalizedDueAt) {
          assessment.dueAt = new Date(normalizedDueAt);
        }
      }
      await assessment.save();

      return NextResponse.json({ assessment });
    }

    const parsedUpdate = UpdateAssessmentSchema.safeParse(body);
    if (!parsedUpdate.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsedUpdate.error.flatten().fieldErrors,
          issues: parsedUpdate.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const existingAssignments = await AssessmentAssignment.countDocuments({ assessmentId });
    if (existingAssignments > 0) {
      return NextResponse.json(
        {
          error:
            'This assessment has already been assigned, so it is locked to protect candidate records. Create a new version instead.',
        },
        { status: 409 }
      );
    }

    assessment.set({
      jobId: parsedUpdate.data.jobId,
      title: parsedUpdate.data.title,
      type: parsedUpdate.data.type,
      questions: parsedUpdate.data.questions,
      totalMarks: parsedUpdate.data.totalMarks,
      passingMarks: parsedUpdate.data.passingMarks,
      durationMinutes: parsedUpdate.data.durationMinutes,
      instructions: parsedUpdate.data.instructions || undefined,
      isTimedAutoSubmit: true,
      allowLateSubmission: parsedUpdate.data.allowLateSubmission ?? false,
    });
    await assessment.save();

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('[ASSESSMENT DETAIL PATCH ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update assessment.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assessmentId } = await params;
    if (!isValidObjectId(assessmentId)) {
      return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
    }
    await connectDB();

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      employerId: session.user.id,
    });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    const existingAssignments = await AssessmentAssignment.countDocuments({ assessmentId });
    if (existingAssignments > 0) {
      return NextResponse.json(
        {
          error:
            'This assessment has already been assigned, so it cannot be deleted. Create a new version instead.',
        },
        { status: 409 }
      );
    }

    await assessment.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ASSESSMENT DETAIL DELETE ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete assessment.' },
      { status: 500 }
    );
  }
}
