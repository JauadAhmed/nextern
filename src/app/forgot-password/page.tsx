'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { NexternLogo } from '@/components/brand/NexternLogo';

type Step = 'request' | 'reset' | 'success';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 10,
  fontSize: 15,
  fontFamily: 'var(--font-body)',
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'password_reset' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not send the reset code. Please try again.');
        return;
      }

      setMessage('If an account exists for that email, a reset code has been sent.');
      setStep('reset');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fieldErrors = data.details as Record<string, string[]> | undefined;
        setError(
          fieldErrors
            ? Object.values(fieldErrors).flat()[0]
            : (data.error ?? 'Password reset failed.')
        );
        return;
      }

      setStep('success');
      setMessage(data.message ?? 'Password reset successfully.');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 18px',
        background: '#F8FAFC',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 460,
          minWidth: 0,
          padding: '32px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 18,
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
        }}
      >
        <Link href="/" aria-label="Nextern home" style={{ display: 'inline-flex' }}>
          <NexternLogo textColor="#0F172A" />
        </Link>

        <div style={{ marginTop: 28, marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            {step === 'success' ? 'Password updated' : 'Reset your password'}
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', lineHeight: 1.65, fontSize: 14 }}>
            {step === 'request'
              ? 'Enter your account email and we will send you a six-digit security code.'
              : step === 'reset'
                ? `Enter the code sent to ${email} and choose a new password.`
                : 'You can now sign in using your new password.'}
          </p>
        </div>

        {(error || message) && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginBottom: 18,
              padding: '11px 13px',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.55,
              color: error ? '#991B1B' : '#166534',
              background: error ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`,
            }}
          >
            {error || message}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={requestCode} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 7, color: '#374151', fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                style={inputStyle}
              />
            </label>
            <SubmitButton loading={loading}>Send reset code</SubmitButton>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetPassword} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 7, color: '#374151', fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>Six-digit code</span>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
                style={{ ...inputStyle, letterSpacing: 6, fontWeight: 800 }}
              />
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#374151', fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                style={inputStyle}
              />
              <small style={{ color: '#64748B', lineHeight: 1.5 }}>
                At least 8 characters with an uppercase letter, number, and symbol.
              </small>
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#374151', fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                style={inputStyle}
              />
            </label>
            <SubmitButton loading={loading}>Reset password</SubmitButton>
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setOtp('');
                setMessage('');
                setError('');
              }}
              style={{ border: 0, background: 'transparent', color: '#2563EB', cursor: 'pointer' }}
            >
              Use a different email
            </button>
          </form>
        )}

        {step === 'success' && (
          <Link
            href="/login"
            style={{
              display: 'block',
              padding: '12px 16px',
              borderRadius: 10,
              background: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 800,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Return to sign in
          </Link>
        )}

        {step !== 'success' && (
          <p style={{ margin: '22px 0 0', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
            Remembered your password?{' '}
            <Link href="/login" style={{ color: '#2563EB', fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        padding: '12px 16px',
        border: 0,
        borderRadius: 10,
        background: loading ? '#93C5FD' : '#2563EB',
        color: '#FFFFFF',
        fontWeight: 800,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
