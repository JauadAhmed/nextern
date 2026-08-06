/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { VERIFIED_FREELANCER_BADGE_SLUG, calculateFreelancePayout } from '@/lib/freelance';
import { FreelanceListingSchema } from '@/lib/validations';
import { BadgeAward } from '@/models/BadgeAward';
import { FreelanceListing } from '@/models/FreelanceListing';
import { parsePaginationParams } from '@/lib/pagination';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeListing(
  listing: Record<string, any>,
  currentUserId: string,
  verifiedFreelancers: Set<string>
) {
  const freelancer =
    listing.studentId && typeof listing.studentId === 'object'
      ? listing.studentId
      : { _id: listing.studentId };

  const freelancerId = freelancer?._id?.toString?.() ?? String(listing.studentId ?? '');

  return {
    _id: listing._id.toString(),
    title: listing.title,
    description: listing.description,
    category: listing.category,
    skills: listing.skills ?? [],
    priceType: listing.priceType,
    priceBDT: listing.priceBDT,
    deliveryDays: listing.deliveryDays,
    sampleFiles: listing.sampleFiles ?? [],
    averageRating: listing.averageRating ?? 0,
    totalOrdersCompleted: listing.totalOrdersCompleted ?? 0,
    isActive: Boolean(listing.isActive),
    createdAt: listing.createdAt?.toISOString?.() ?? null,
    canEdit: freelancerId === currentUserId,
    canOrder: freelancerId !== currentUserId,
    freelancer: {
      _id: freelancerId,
      name: freelancer?.name ?? 'Student freelancer',
      image: freelancer?.image ?? null,
      university: freelancer?.university ?? null,
      department: freelancer?.department ?? null,
      skills: freelancer?.skills ?? [],
      opportunityScore: freelancer?.opportunityScore ?? 0,
      hasVerifiedFreelancerBadge: verifiedFreelancers.has(freelancerId),
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, {
      defaultLimit: 12,
      maxLimit: 24,
    });
    const mine = searchParams.get('mine') === 'true';
    const search = (searchParams.get('search') ?? '').trim();
    const category = (searchParams.get('category') ?? '').trim();
    const skill = (searchParams.get('skill') ?? '').trim();
    const minBudget = Number.parseInt(searchParams.get('minBudget') ?? '', 10);
    const maxBudget = Number.parseInt(searchParams.get('maxBudget') ?? '', 10);

    await connectDB();

    const query: Record<string, any> = {};

    if (mine) {
      query.studentId = new mongoose.Types.ObjectId(session.user.id);
    } else if (session.user.role !== 'admin') {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    if (skill) {
      query.skills = { $in: [new RegExp(escapeRegExp(skill), 'i')] };
    }

    if (Number.isFinite(minBudget) || Number.isFinite(maxBudget)) {
      query.priceBDT = {};
      if (Number.isFinite(minBudget)) query.priceBDT.$gte = minBudget;
      if (Number.isFinite(maxBudget)) query.priceBDT.$lte = maxBudget;
    }

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [{ title: regex }, { description: regex }, { skills: regex }];
    }

    const [listings, total] = await Promise.all([
      FreelanceListing.find(query)
        .populate('studentId', 'name image university department skills opportunityScore')
        .sort({ isActive: -1, averageRating: -1, totalOrdersCompleted: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FreelanceListing.countDocuments(query),
    ]);

    const freelancerIds = listings
      .map((listing) =>
        listing.studentId && typeof listing.studentId === 'object'
          ? listing.studentId._id?.toString?.()
          : listing.studentId?.toString?.()
      )
      .filter(Boolean) as string[];

    const verifiedAwards = await BadgeAward.find({
      badgeSlug: VERIFIED_FREELANCER_BADGE_SLUG,
      userId: { $in: freelancerIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select('userId')
      .lean();

    const verifiedFreelancers = new Set(verifiedAwards.map((award) => award.userId.toString()));

    return NextResponse.json({
      listings: listings.map((listing) =>
        serializeListing(listing as Record<string, any>, session.user.id, verifiedFreelancers)
      ),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      pricing: calculateFreelancePayout(0),
    });
  } catch (error) {
    console.error('[FREELANCE LISTINGS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch freelance listings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can create freelance listings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = FreelanceListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await FreelanceListing.create({
      ...parsed.data,
      studentId: new mongoose.Types.ObjectId(session.user.id),
      averageRating: 0,
      totalOrdersCompleted: 0,
      isActive: parsed.data.isActive ?? true,
    });

    return NextResponse.json({ message: 'Freelance listing created.', listing }, { status: 201 });
  } catch (error) {
    console.error('[FREELANCE LISTING CREATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to create freelance listing.' }, { status: 500 });
  }
}
