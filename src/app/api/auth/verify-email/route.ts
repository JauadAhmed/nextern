// src/app/api/auth/verify-email/route.ts
// POST /api/auth/verify-email
// Verifies the OTP sent to the user's email on registration.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyOTP } from '@/lib/otp';
import { sendEmail, welcomeEmailTemplate } from '@/lib/email';
import { VerifyEmailSchema } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { requiresAdminApproval } from '@/lib/role-routing';

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rl = rateLimit(`verify:${ip}`, rateLimits.verifyEmail);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // ── Validate ─────────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = VerifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    await connectDB();

    // ── Find user ─────────────────────────────────────────────────────────
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: 'Email is already verified. Please log in.' },
        { status: 200 }
      );
    }

    // ── Verify OTP ────────────────────────────────────────────────────────
    const result = await verifyOTP(email, otp, 'email_verify');
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    // ── Mark user as verified ─────────────────────────────────────────────
    await User.findByIdAndUpdate(user._id, { isVerified: true });

    // ── Send welcome email ────────────────────────────────────────────────
    await sendEmail({
      to: email,
      subject: 'Welcome to Nextern!',
      html: welcomeEmailTemplate(user.name, user.role),
    }).catch(() => {
      /* Non-critical — don't fail the request if welcome email fails */
    });

    return NextResponse.json({
      message: 'Email verified successfully. You can now log in.',
      role: user.role,
      requiresAdminApproval:
        requiresAdminApproval(user.role) && user.verificationStatus === 'pending',
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }
    console.error('[VERIFY EMAIL ERROR]', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
