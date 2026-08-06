'use client';
// src/app/(auth)/login/page.tsx — Premium redesign

import { useEffect, useState } from 'react';
import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NexternLogo } from '@/components/brand/NexternLogo';
import { getPostLoginRedirect } from '@/lib/role-routing';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
  CredentialsSignin: 'Invalid email or password.',
  OAuthAccountNotLinked: 'This email is linked to a different sign-in method.',
  AccessDenied: 'Google sign-in is not available for this account. Use email and password.',
};

/* ── ICONS ─────────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const MailIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const AlertIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SparklesIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

/* ── BRAND PANEL STATS ─────────────────────────────────────────────── */
function BrandStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── FEATURE ROW ───────────────────────────────────────────────────── */
function BrandFeature({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(34,211,238,0.15)',
          border: '1px solid rgba(34,211,238,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#22D3EE',
          flexShrink: 0,
        }}
      >
        <CheckIcon />
      </div>
      <span style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* ── GOOGLE SVG ────────────────────────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M47.53 24.56c0-1.64-.15-3.22-.42-4.74H24v8.97h13.24c-.57 3.01-2.3 5.56-4.9 7.28v6.05h7.93c4.64-4.27 7.32-10.57 7.32-17.56z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.64 0 12.21-2.2 16.28-5.96l-7.93-6.05C30.2 37.6 27.29 38.4 24 38.4c-6.42 0-11.86-4.33-13.8-10.16H2.04v6.26C6.1 42.88 14.44 48 24 48z"
      />
      <path
        fill="#FBBC05"
        d="M10.2 28.24A14.44 14.44 0 0 1 9.6 24c0-1.47.25-2.9.6-4.24v-6.26H2.04A23.95 23.95 0 0 0 0 24c0 3.88.93 7.56 2.04 10.5l8.16-6.26z"
      />
      <path
        fill="#EA4335"
        d="M24 9.6c3.62 0 6.86 1.24 9.42 3.68l7.06-7.07C36.2 2.38 30.63 0 24 0 14.44 0 6.1 5.12 2.04 13.5l8.16 6.26C12.14 13.93 17.58 9.6 24 9.6z"
      />
    </svg>
  );
}

async function waitForSession(maxAttempts = 6, delayMs = 150) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession();
    if (session?.user) {
      return session;
    }

    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return null;
}

/* ── MAIN ──────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl') ?? '';
  const urlError = searchParams.get('error');
  const passwordSet = searchParams.get('passwordSet') === '1';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(
    urlError ? (ERROR_MESSAGES[urlError] ?? 'Sign-in error. Try again.') : ''
  );
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const redirectTarget = getPostLoginRedirect(session.user, callbackUrl);
    window.location.replace(redirectTarget);
  }, [callbackUrl, session, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
        callbackUrl: callbackUrl || '/',
      });
      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? 'Invalid email or password.');
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
          return;
        }
      } else {
        const freshSession = await waitForSession();
        const redirectTarget = freshSession?.user
          ? getPostLoginRedirect(freshSession.user, callbackUrl)
          : '/';

        window.location.replace(redirectTarget);
        return;
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl: callbackUrl || '/' });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F8FAFC' }}>
      {/* ── LEFT BRAND PANEL ──────────────────────────────────────── */}
      <div
        style={{
          width: '45%',
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F2347 100%)',
          padding: '48px 52px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        className="brand-panel"
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 260,
            height: 260,
            background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '10%',
            width: 180,
            height: 180,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ position: 'relative', marginBottom: 'auto' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <NexternLogo
              markSize={38}
              markRadius={11}
              markShadow="0 4px 14px rgba(37,99,235,0.4)"
              textSize={22}
              textColor="#fff"
            />
          </Link>
        </div>

        {/* Center content */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 36,
          }}
        >
          {/* Heading */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(37,99,235,0.15)',
                border: '1px solid rgba(37,99,235,0.3)',
                borderRadius: 999,
                padding: '5px 13px',
                marginBottom: 20,
              }}
            >
              <SparklesIcon />
              <span style={{ color: '#93C5FD', fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
                AI-powered career platform
              </span>
            </div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#F8FAFC',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-1px',
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              Your next chapter
              <br />
              <span
                style={{
                  background: 'linear-gradient(120deg, #3B82F6, #22D3EE)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                starts here
              </span>
            </h2>
            <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.75 }}>
              Sign in to access your dashboard, track your internship progress, and land your dream
              opportunity.
            </p>
          </div>

          {/* Feature checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <BrandFeature text="AI-powered skill gap analysis" />
            <BrandFeature text="Real-time internship fit scoring" />
            <BrandFeature text="Personalized learning paths" />
            <BrandFeature text="Direct access to 340+ companies" />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { value: '2,400+', label: 'Active Students' },
              { value: '89%', label: 'Placement Rate' },
              { value: '14', label: 'Universities' },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  paddingRight: i < 2 ? 20 : 0,
                  paddingLeft: i > 0 ? 20 : 0,
                }}
              >
                <BrandStat value={s.value} label={s.label} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 32 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#FCD34D">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <p
              style={{
                color: '#CBD5E1',
                fontSize: 14,
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginBottom: 12,
              }}
            >
              &quot;Nextern showed me exactly why I kept getting rejected. Within 3 weeks my fit
              score jumped from 55% to 88% and I landed a role at ShurjoPay.&quot;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                SR
              </div>
              <div>
                <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 700 }}>Samia Rahman</div>
                <div style={{ color: '#475569', fontSize: 12 }}>CS Student · BRAC University</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ──────────────────────────────────────── */}
      <div
        className="auth-form-panel"
        style={{
          flex: 1,
          width: '100%',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          background: '#F8FAFC',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.5px',
                marginBottom: 6,
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: '#64748B', fontSize: 15 }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}
              >
                Sign up free
              </Link>
            </p>
          </div>

          {/* Status Banner */}
          {passwordSet && !error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#166534',
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <CheckIcon />
              </div>
              <span>
                Password updated successfully. Please sign in again with your new password.
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#991B1B',
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <AlertIcon />
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 16px',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: 15,
              fontWeight: 600,
              color: '#0F172A',
              marginBottom: 24,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#2563EB';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
            }}
          >
            <GoogleLogo />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              or continue with email
            </span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {/* Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: emailFocused ? '#2563EB' : '#94A3B8',
                    pointerEvents: 'none',
                    transition: 'color 0.15s',
                  }}
                >
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    border: `1.5px solid ${emailFocused ? '#2563EB' : '#E2E8F0'}`,
                    borderRadius: 10,
                    fontSize: 15,
                    fontFamily: 'var(--font-body)',
                    background: emailFocused ? '#FAFCFF' : '#fff',
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Password</label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 13,
                    color: '#2563EB',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: passFocused ? '#2563EB' : '#94A3B8',
                    pointerEvents: 'none',
                    transition: 'color 0.15s',
                  }}
                >
                  <LockIcon />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    border: `1.5px solid ${passFocused ? '#2563EB' : '#E2E8F0'}`,
                    borderRadius: 10,
                    fontSize: 15,
                    fontFamily: 'var(--font-body)',
                    background: passFocused ? '#FAFCFF' : '#fff',
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                    boxShadow: passFocused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#475569')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.15s',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to dashboard
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p
            style={{
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: 12,
              marginTop: 28,
              lineHeight: 1.6,
            }}
          >
            By signing in, you agree to our{' '}
            <Link href="/terms" style={{ color: '#64748B', textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .brand-panel { display: none !important; }
          .auth-form-panel { padding: 40px 18px !important; }
        }
      `}</style>
    </div>
  );
}
