// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { generateOTP } from '@/lib/otp';
import { sendEmail, otpEmailTemplate } from '@/lib/email';
import { RegisterSchema } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const rl = rateLimit(`register:${ip}`, rateLimits.register);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // ── Parse & validate ──────────────────────────────────────────────
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase().trim();
    await connectDB();

    // ── Duplicate email check ─────────────────────────────────────────────
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && ['advisor', 'dept_head'].includes(existing.role)) {
      return NextResponse.json(
        {
          error:
            'This email is reserved for an internally provisioned academic account. Please contact the administrator responsible for academic access.',
        },
        { status: 409 }
      );
    }
    if (existing?.isVerified) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // ── Hash password ─────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // ── Build user object based on role ───────────────────────────────
    const userPayload: Record<string, unknown> = {
      name: data.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: data.role,
      isVerified: false,
      verificationStatus: data.role === 'student' ? 'approved' : 'pending',
      verificationNote: '',
      // Students are auto-approved; others require admin approval
    };

    if (data.role === 'student') {
      userPayload.university = data.university;
      userPayload.department = data.department;
      userPayload.yearOfStudy = data.yearOfStudy;
      userPayload.studentId = data.studentId;
      userPayload.opportunityScore = 0;
      userPayload.profileCompleteness = 20;
    }

    if (data.role === 'employer') {
      userPayload.companyName = data.companyName;
      userPayload.industry = data.industry;
      userPayload.tradeLicenseNo = data.tradeLicenseNo;
      userPayload.headquartersCity = data.headquartersCity;
    }

    // ── Create user ───────────────────────────────────────────────────────
    const fieldsToUnset =
      data.role === 'student'
        ? {
            companyName: 1,
            industry: 1,
            tradeLicenseNo: 1,
            headquartersCity: 1,
          }
        : {
            university: 1,
            department: 1,
            yearOfStudy: 1,
            studentId: 1,
            opportunityScore: 1,
            profileCompleteness: 1,
          };

    const user = existing
      ? await User.findByIdAndUpdate(
          existing._id,
          { $set: userPayload, $unset: fieldsToUnset },
          {
            new: true,
            runValidators: true,
          }
        )
      : await User.create(userPayload);

    if (!user) {
      throw new Error('User creation failed');
    }

    // ── Generate & send OTP ───────────────────────────────────────────────
    const otp = await generateOTP(normalizedEmail, 'email_verify');

    let emailSent = true;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify your Nextern email address',
        html: otpEmailTemplate(otp, data.name),
      });
    } catch (emailError) {
      emailSent = false;
      console.error('[REGISTER EMAIL ERROR]', emailError);
    }

    // ── Return success ────────────────────────────────────────────────
    return NextResponse.json(
      {
        message: emailSent
          ? existing
            ? 'Account updated. Please check your email for a fresh verification code.'
            : 'Account created. Please check your email for the verification code.'
          : 'Account saved, but we could not send the verification code. Please use resend code on the next screen.',
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        emailSent,
        requiresEmailVerification: true,
        requiresAdminApproval: data.role === 'employer',
      },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }
    console.error('[REGISTER ERROR]', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
