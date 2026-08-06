// src/app/api/auth/resend-otp/route.ts
// POST /api/auth/resend-otp
// Resends a new OTP to the user's email. Rate limited to 3 per hour.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateOTP } from '@/lib/otp';
import { sendEmail, otpEmailTemplate, passwordResetOtpEmailTemplate } from '@/lib/email';
import { ResendOTPSchema } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rl = rateLimit(`resend:${ip}`, rateLimits.resendOTP);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many resend requests. Try again in ${rl.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ResendOTPSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, type } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a new code has been sent.' });
    }

    if (type === 'email_verify' && user.isVerified) {
      return NextResponse.json({ message: 'Email is already verified.' });
    }

    const otp = await generateOTP(email, type);
    await sendEmail({
      to: email,
      subject:
        type === 'password_reset'
          ? 'Reset your Nextern password'
          : 'Your new Nextern verification code',
      html:
        type === 'password_reset'
          ? passwordResetOtpEmailTemplate(otp, user.name)
          : otpEmailTemplate(otp, user.name),
    });

    return NextResponse.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }
    console.error('[RESEND OTP ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to resend code. Please try again.' },
      { status: 500 }
    );
  }
}
