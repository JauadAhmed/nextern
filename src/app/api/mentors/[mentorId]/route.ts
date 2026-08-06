import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Mentor } from '@/models/Mentor';
import { BadgeAward } from '@/models/BadgeAward';
import mongoose from 'mongoose';

type Params = { params: Promise<{ mentorId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { mentorId } = await params;
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return NextResponse.json({ error: 'Invalid mentor ID' }, { status: 400 });
    }
    await connectDB();

    const mentor = await Mentor.findById(mentorId).populate('userId', 'name image email').lean();

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    const badgeAwards = await BadgeAward.find({
      userId: mentor.userId._id,
      isDisplayed: true,
    }).lean();

    const mentorWithBadges = {
      ...mentor,
      badges: badgeAwards.map((ba) => ({
        badgeName: ba.badgeName,
        badgeIcon: ba.badgeIcon,
      })),
    };

    return NextResponse.json(mentorWithBadges);
  } catch (error) {
    console.error('[GET MENTOR ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch mentor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mentorId } = await params;
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return NextResponse.json({ error: 'Invalid mentor ID' }, { status: 400 });
    }
    const body = await req.json();

    await connectDB();

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Only the mentor owner can update their profile
    if (mentor.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatableFields = [
      'expertise',
      'industry',
      'currentRole',
      'currentCompany',
      'yearsOfExperience',
      'bio',
      'monthlySessionLimit',
      'isAvailable',
      'linkedinUrl',
    ];

    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        mentor[field] = body[field];
      }
    });

    await mentor.save();

    return NextResponse.json(mentor);
  } catch (error) {
    console.error('[UPDATE MENTOR ERROR]', error);
    return NextResponse.json({ error: 'Failed to update mentor' }, { status: 500 });
  }
}
