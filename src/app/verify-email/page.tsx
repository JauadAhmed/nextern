'use client';
// src/app/(auth)/verify-email/page.tsx — Premium redesign

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NexternLogo } from '@/components/brand/NexternLogo';

/* ── ICONS ─────────────────────────────────────────────────────────── */
const MailOpenIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6z" />
    <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
  </svg>
);
const RefreshIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
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
const ArrowLeftIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const deliveryFailed = searchParams.get('delivery') === 'failed';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  function handleOtpInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && !next.includes('')) {
      submitOtp(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    if (pasted.length === 6) submitOtp(pasted);
    else inputRefs.current[pasted.length]?.focus();
  }

  async function submitOtp(code: string) {
    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Verification failed. Please try again.');
        setOtp(['', '', '', '', '', '']);
        setShakeTrigger(true);
        setTimeout(() => setShakeTrigger(false), 600);
        inputRefs.current[0]?.focus();
      } else {
        setVerified(true);
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          router.push(data.requiresAdminApproval ? '/pending-approval' : '/login?verified=1');
        }, 2000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email_verify' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('New code sent! Check your inbox.');
        setCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error ?? 'Failed to resend. Try again.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setResending(false);
    }
  }

  const filledCount = otp.filter((d) => d !== '').length;
  const progress = (filledCount / 6) * 100;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: 'rgba(37,99,235,0.05)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 350,
            height: 350,
            background: 'rgba(8,145,178,0.04)',
            borderRadius: '50%',
          }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
              markSize={36}
              markRadius={10}
              markShadow="0 4px 12px rgba(37,99,235,0.3)"
              textSize={21}
              textColor="#0F172A"
              dotColor="#2563EB"
            />
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '44px 40px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          {/* Verified state */}
          {verified ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  color: '#059669',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <CheckCircleIcon />
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                  marginBottom: 8,
                }}
              >
                Email verified!
              </h2>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7 }}>
                Your account is now active. Redirecting you shortly…
              </p>
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#64748B',
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #E2E8F0',
                    borderTopColor: '#2563EB',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Redirecting…
              </div>
            </div>
          ) : (
            <>
              {/* Icon + heading */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    background: '#EFF6FF',
                    borderRadius: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                    marginBottom: 20,
                    boxShadow: '0 4px 16px rgba(37,99,235,0.15)',
                  }}
                >
                  <MailOpenIcon />
                </div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                    marginBottom: 8,
                  }}
                >
                  Check your inbox
                </h1>
                <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7 }}>
                  We sent a 6-digit verification code to
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '5px 12px',
                    marginTop: 6,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {email || 'your email address'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {filledCount > 0 && filledCount < 6 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      background: '#F1F5F9',
                      borderRadius: 999,
                      height: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: '#2563EB',
                        borderRadius: 999,
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                  <div
                    style={{ color: '#94A3B8', fontSize: 12, marginTop: 6, textAlign: 'center' }}
                  >
                    {filledCount} of 6 digits entered
                  </div>
                </div>
              )}

              {/* Error/Success */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 10,
                    padding: '11px 14px',
                    color: '#991B1B',
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}
              {deliveryFailed && !error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    borderRadius: 10,
                    padding: '11px 14px',
                    color: '#9A3412',
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  <AlertIcon />
                  <span>
                    We saved your account, but the first OTP email did not send. Use resend code.
                  </span>
                </div>
              )}
              {success && !verified && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 10,
                    padding: '11px 14px',
                    color: '#166534',
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
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
                  <span>{success}</span>
                </div>
              )}

              {/* OTP inputs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 10,
                  marginBottom: 28,
                  animation: shakeTrigger ? 'shake 0.5s ease' : 'none',
                }}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    disabled={loading}
                    style={{
                      width: 52,
                      height: 60,
                      textAlign: 'center',
                      fontSize: 24,
                      fontWeight: 800,
                      border: `2px solid ${error ? '#FECACA' : digit ? '#2563EB' : '#E2E8F0'}`,
                      borderRadius: 12,
                      outline: 'none',
                      background: error ? '#FFF5F5' : digit ? '#EFF6FF' : '#FAFAFA',
                      color: '#0F172A',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-display)',
                      cursor: loading ? 'not-allowed' : 'text',
                      boxShadow: digit ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563EB';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                      e.target.style.background = '#F0F7FF';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? '#2563EB' : '#E2E8F0';
                      e.target.style.boxShadow = digit ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none';
                      e.target.style.background = digit ? '#EFF6FF' : '#FAFAFA';
                    }}
                  />
                ))}
              </div>

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#64748B',
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid #E2E8F0',
                        borderTopColor: '#2563EB',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Verifying your code…
                  </div>
                </div>
              )}

              {/* Resend */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ color: '#64748B', fontSize: 14 }}>
                  Didn&apos;t receive it?{' '}
                  <button
                    onClick={resendOtp}
                    disabled={resending || cooldown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: cooldown > 0 ? '#94A3B8' : '#2563EB',
                      fontWeight: 700,
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {resending ? (
                      <>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            border: '2px solid #E2E8F0',
                            borderTopColor: '#2563EB',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.7s linear infinite',
                          }}
                        />
                        Sending…
                      </>
                    ) : cooldown > 0 ? (
                      `Resend in ${cooldown}s`
                    ) : (
                      <>
                        <RefreshIcon />
                        Resend code
                      </>
                    )}
                  </button>
                </p>
              </div>

              {/* Bottom info */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {[
                  { icon: ShieldCheckIcon, text: 'The code expires in 10 minutes' },
                  {
                    icon: () => (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ),
                    text: 'Maximum 3 attempts per code',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#64748B',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ color: '#94A3B8', flexShrink: 0 }}>
                      <item.icon />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Back link */}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#64748B',
                    fontSize: 14,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <ArrowLeftIcon />
                  Wrong email? Go back
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
