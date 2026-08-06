import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyOTP } from '@/lib/otp';
import { ResetPasswordSchema } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

const BCRYPT_ROUNDS = 12;
const INVALID_CODE_MESSAGE = 'The code is invalid or expired. Request a new code and try again.';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rl = rateLimit(`password-reset:${ip}`, rateLimits.verifyEmail);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email }).select('_id');
    if (!user) {
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
    }

    const result = await verifyOTP(email, otp, 'password_reset');
    if (!result.valid) {
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
    }

    const password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await User.findByIdAndUpdate(user._id, { password, mustChangePassword: false });

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }
    console.error('[RESET PASSWORD ERROR]', error);
    return NextResponse.json(
      { error: 'Password reset failed. Please try again.' },
      { status: 500 }
    );
  }
}
