import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AdvisorAction } from '@/models/AdvisorAction';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { createNotification } from '@/lib/notify';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const actions = await AdvisorAction.find({
      actionType: { $in: ['plan_endorsed', 'plan_modified', 'note_added'] },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const advisorIds = [...new Set(actions.map((action) => action.advisorId.toString()))];
    const advisors = await User.find({ _id: { $in: advisorIds } })
      .select('name')
      .lean();
    const advisorNameMap = new Map(
      advisors.map((advisor) => [advisor._id.toString(), advisor.name])
    );

    let notificationsSent = 0;

    for (const action of actions) {
      const alreadySent = await Notification.exists({
        userId: action.studentId,
        'meta.advisorActionId': action._id.toString(),
      });

      if (alreadySent) continue;

      const advisorName = advisorNameMap.get(action.advisorId.toString()) ?? 'Your advisor';

      if (action.actionType === 'note_added') {
        await createNotification({
          userId: action.studentId.toString(),
          type: 'advisor_note',
          title: 'New note from your advisor',
          body: `${advisorName}: "${(action.advisorNote ?? 'Your advisor added a new note.').slice(0, 120)}${(action.advisorNote ?? '').length > 120 ? '…' : ''}"`,
          link: '/student/skills',
          meta: {
            advisorActionId: action._id.toString(),
            advisorId: action.advisorId.toString(),
            actionType: action.actionType,
            icon: 'MessageSquare',
          },
          preferenceKey: 'advisor_notes',
        });
        notificationsSent++;
        continue;
      }

      const title =
        action.actionType === 'plan_endorsed'
          ? 'Advisor endorsed your training plan'
          : 'Advisor updated your training plan';
      const body =
        action.actionType === 'plan_endorsed'
          ? `${advisorName} endorsed your current AI training roadmap. Review the recommended steps and continue building momentum.`
          : `${advisorName} updated your AI training roadmap with new recommendations. Review the latest guidance in your skills workspace.`;

      await createNotification({
        userId: action.studentId.toString(),
        type: 'advisor_note',
        title,
        body,
        link: '/student/skills',
        meta: {
          advisorActionId: action._id.toString(),
          advisorId: action.advisorId.toString(),
          actionType: action.actionType,
          planSteps: action.aiTrainingPlanSnapshot ?? [],
          advisorModifications: action.advisorModifications ?? [],
          icon: 'Sparkles',
        },
        preferenceKey: 'advisor_notes',
      });
      notificationsSent++;
    }

    return NextResponse.json({
      message: 'Advisor action notification sweep complete',
      notificationsSent,
      actionsChecked: actions.length,
    });
  } catch (error) {
    console.error('[ADVISOR ACTION NOTIFICATION ERROR]', error);
    return NextResponse.json(
      { error: 'Advisor action notification sweep failed' },
      { status: 500 }
    );
  }
}
