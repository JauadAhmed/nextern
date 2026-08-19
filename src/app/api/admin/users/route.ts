import type { SortOrder } from 'mongoose';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Subscription } from '@/models/Subscription';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';

function getSort(sort: string | null): Record<string, SortOrder> {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 as SortOrder };
    case 'name':
      return { name: 1 as SortOrder };
    case 'updated':
      return { updatedAt: -1 as SortOrder };
    case 'premium':
      return {
        isPremium: -1 as SortOrder,
        premiumExpiresAt: -1 as SortOrder,
        createdAt: -1 as SortOrder,
      };
    default:
      return { createdAt: -1 as SortOrder };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const searchRegex = buildSearchRegex(searchParams.get('search'));
    const premium = parseBooleanParam(searchParams.get('premium'));
    const emailVerified = parseBooleanParam(searchParams.get('emailVerified'));
    const university = searchParams.get('university')?.trim();
    const department = searchParams.get('department')?.trim();
    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    await connectDB();

    const query: Record<string, unknown> = {};
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.verificationStatus = status;
    if (typeof premium === 'boolean') query.isPremium = premium;
    if (typeof emailVerified === 'boolean') query.isVerified = emailVerified;
    if (university) query.university = buildSearchRegex(university);
    if (department) query.department = buildSearchRegex(department);
    if (searchRegex) {
      const search = searchParams.get('search')?.trim() ?? '';
      query.$or = [
        ...(mongoose.Types.ObjectId.isValid(search)
          ? [{ _id: new mongoose.Types.ObjectId(search) }]
          : []),
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { companyName: searchRegex },
        { institutionName: searchRegex },
        { university: searchRegex },
        { department: searchRegex },
        { tradeLicenseNo: searchRegex },
      ];
    }

    const [
      users,
      total,
      totalUsers,
      verifiedEmails,
      premiumUsers,
      roleCounts,
      pendingByRole,
      activeSubscriptions,
    ] = await Promise.all([
      User.find(query)
        .select(
          [
            'name',
            'email',
            'phone',
            'role',
            'image',
            'isPremium',
            'premiumExpiresAt',
            'isVerified',
            'verificationStatus',
            'verificationNote',
            'studentId',
            'university',
            'department',
            'yearOfStudy',
            'currentSemester',
            'cgpa',
            'city',
            'skills',
            'completedCourses',
            'companyName',
            'industry',
            'companySize',
            'companyWebsite',
            'tradeLicenseNo',
            'headquartersCity',
            'institutionName',
            'advisorStaffId',
            'designation',
            'advisoryDepartment',
            'createdAt',
            'updatedAt',
          ].join(' ')
        )
        .sort(getSort(searchParams.get('sort')))
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isPremium: true }),
      User.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.aggregate<{ _id: string; count: number }>([
        { $match: { verificationStatus: 'pending' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ status: 'active', endDate: { $gt: new Date() } }),
    ]);

    const roleCountsMap = Object.fromEntries(roleCounts.map((row) => [row._id, row.count]));
    const pendingMap = Object.fromEntries(pendingByRole.map((row) => [row._id, row.count]));

    return NextResponse.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalUsers,
        verifiedEmails,
        premiumUsers,
        activeSubscriptions,
        pendingReviews:
          (pendingMap.employer ?? 0) +
          (pendingMap.advisor ?? 0) +
          (pendingMap.dept_head ?? 0) +
          (pendingMap.admin ?? 0),
        roleCounts: {
          student: roleCountsMap.student ?? 0,
          employer: roleCountsMap.employer ?? 0,
          advisor: roleCountsMap.advisor ?? 0,
          dept_head: roleCountsMap.dept_head ?? 0,
          admin: roleCountsMap.admin ?? 0,
        },
        pendingByRole: {
          employer: pendingMap.employer ?? 0,
          advisor: pendingMap.advisor ?? 0,
          dept_head: pendingMap.dept_head ?? 0,
          student: pendingMap.student ?? 0,
          admin: pendingMap.admin ?? 0,
        },
      },
      filters: {
        role: role ?? 'all',
        status: status ?? 'all',
        premium,
        emailVerified,
        university: university ?? '',
        department: department ?? '',
        search: searchParams.get('search') ?? '',
        sort: searchParams.get('sort') ?? 'newest',
      },
    });
  } catch (error) {
    console.error('[ADMIN USERS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
