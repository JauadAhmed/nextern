// src/app/api/admin/approve/[userId]/route.ts
// PATCH /api/admin/approve/[userId]
// Admin approves or rejects employer / advisor / dept_head accounts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sendEmail } from '@/lib/email';
import { getLoginUrl } from '@/lib/app-url';
import { AdminApproveSchema } from '@/lib/validations';
import { onProfileVerified } from '@/lib/events';
import { isValidObjectId } from '@/lib/object-id';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminApproveSchema.safeParse({ ...body, userId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.role === 'advisor' || user.role === 'dept_head') {
      return NextResponse.json(
        {
          error:
            'Advisor and department head accounts are no longer approved from this queue. Use the dedicated provisioning pages instead.',
        },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.action === 'approve' ? 'approved' : 'rejected';

    await User.findByIdAndUpdate(userId, {
      verificationStatus: newStatus,
      verificationNote: parsed.data.note ?? '',
      ...(user.role === 'advisor' || user.role === 'dept_head'
        ? { approvalStatus: newStatus }
        : {}),
      ...(newStatus === 'approved' && user.role === 'student' ? { isVerified: true } : {}), // Ensure isVerified syncing if needed
    });

    if (newStatus === 'approved') {
      await onProfileVerified(userId).catch(console.error);
    }

    // Notify user by email
    const subject =
      parsed.data.action === 'approve'
        ? 'Your Nextern account has been approved'
        : 'Your Nextern account application was not approved';
    const loginUrl = getLoginUrl();

    const html =
      parsed.data.action === 'approve'
        ? `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
          <div style="background:#1E293B;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;">Nextern <span style="color:#22D3EE">.</span> Account Approved</h1>
          </div>
          <div style="padding:32px;">
            <p style="color:#1E293B;font-size:16px;">Hi ${user.name},</p>
            <p style="color:#64748B;font-size:15px;line-height:1.7;">Your account has been <strong style="color:#10B981;">approved</strong>. You can now log in and access all platform features.</p>
            <a href="${loginUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Go to Dashboard</a>
          </div>
        </div>`
        : `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
          <div style="background:#1E293B;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;">Nextern <span style="color:#22D3EE">.</span> Application Status</h1>
          </div>
          <div style="padding:32px;">
            <p style="color:#1E293B;font-size:16px;">Hi ${user.name},</p>
            <p style="color:#64748B;font-size:15px;line-height:1.7;">After reviewing your application, we were unable to approve your account at this time.</p>
            ${parsed.data.note ? `<p style="color:#64748B;font-size:14px;background:#FEF2F2;padding:12px;border-radius:8px;border-left:3px solid #EF4444;"><strong>Reason:</strong> ${parsed.data.note}</p>` : ''}
            <p style="color:#94A3B8;font-size:13px;margin-top:16px;">If you believe this is an error, please contact support@nextern.app</p>
          </div>
        </div>`;

    await sendEmail({ to: user.email, subject, html }).catch(() => {});

    return NextResponse.json({
      message: `User ${parsed.data.action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      userId,
      newStatus,
    });
  } catch (error) {
    console.error('[ADMIN APPROVE ERROR]', error);
    return NextResponse.json({ error: 'Action failed. Please try again.' }, { status: 500 });
  }
}
