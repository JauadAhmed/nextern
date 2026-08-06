import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AssessmentSubmitSchema } from '@/lib/validations';
import {
  PremiumAccessError,
  saveAssessmentDraft,
  syncAssessmentAssignmentState,
} from '@/lib/hiring-suite';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { Assessment } from '@/models/Assessment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { isValidObjectId } from '@/lib/object-id';

type Params = { params: Promise<{ assignmentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;
    if (!isValidObjectId(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }
    await connectDB();
    await syncAssessmentAssignmentState(assignmentId);

    const assignment = await AssessmentAssignment.findById(assignmentId)
      .populate('jobId', 'title companyName')
      .lean();
    if (!assignment) {
      return NextResponse.json({ error: 'Assessment assignment not found.' }, { status: 404 });
    }

    const isEmployer =
      session.user.role === 'employer' && assignment.employerId.toString() === session.user.id;
    const isStudent =
      session.user.role === 'student' && assignment.studentId.toString() === session.user.id;
    if (!isEmployer && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [assessment, submission] = await Promise.all([
      Assessment.findById(assignment.assessmentId).lean(),
      AssessmentSubmission.findOne({ assignmentId }).lean(),
    ]);

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    if (isStudent) {
      const studentAssessment = {
        ...assessment,
        questions: assessment.questions.map((question: (typeof assessment.questions)[number]) => ({
          index: question.index,
          type: question.type,
          questionText: question.questionText,
          marks: question.marks,
          options: question.options ?? [],
          enablePlagiarismCheck: question.enablePlagiarismCheck ?? false,
          language: question.language,
          starterCode: question.starterCode ?? '',
          rubric: question.rubric ?? '',
          attachments: question.attachments ?? [],
          maxWords: question.maxWords,
          testCases: (question.testCases ?? []).filter(
            (testCase: NonNullable<typeof question.testCases>[number]) => testCase.isSample
          ),
        })),
      };

      return NextResponse.json({
        assignment,
        assessment: studentAssessment,
        submission,
      });
    }

    return NextResponse.json({
      assignment,
      assessment,
      submission,
    });
  } catch (error) {
    console.error('[ASSESSMENT ASSIGNMENT GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch assessment assignment.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AssessmentSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { assignmentId } = await params;
    if (!isValidObjectId(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }
    const submission = await saveAssessmentDraft({
      assignmentId,
      studentId: session.user.id,
      answers: parsed.data.answers,
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('[ASSESSMENT ASSIGNMENT PATCH ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save assessment draft.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
