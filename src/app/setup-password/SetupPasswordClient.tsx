'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function SetupPasswordClient({ email }: { email: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const checks = [
    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(newPassword) },
    { label: 'One number', ok: /[0-9]/.test(newPassword) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_initial_password',
          newPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to update password.');
        return;
      }

      await signOut({ callbackUrl: '/login?passwordSet=1' });
      return;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#FFFFFF',
          borderRadius: 28,
          overflow: 'hidden',
          border: '1px solid #D9E2EC',
          boxShadow: '0 24px 60px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            padding: '32px 32px 26px',
            background: '#172033',
            color: '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.08)',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            First login
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1.1,
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
            }}
          >
            Set your new password
          </h1>
          <p style={{ margin: '12px 0 0', color: '#DBEAFE', fontSize: 14, lineHeight: 1.7 }}>
            You signed in with a one-time password for <strong>{email}</strong>. Create your own
            password now to finish activating this account. After saving it, you will sign in again
            with your email and new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 32 }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Create a strong password"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 14,
                  border: '1px solid #CBD5E1',
                  padding: '13px 15px',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 14,
                  border: '1px solid #CBD5E1',
                  padding: '13px 15px',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Password rules
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {checks.map((check) => (
                  <div
                    key={check.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: check.ok ? '#166534' : '#64748B',
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: check.ok ? '#10B981' : '#CBD5E1',
                        flexShrink: 0,
                      }}
                    />
                    {check.label}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  borderRadius: 14,
                  padding: '12px 14px',
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 'none',
                borderRadius: 14,
                padding: '14px 18px',
                background: saving ? '#93C5FD' : '#2563EB',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 18px 28px rgba(37,99,235,0.2)',
              }}
            >
              {saving ? 'Saving password...' : 'Save password and return to login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
