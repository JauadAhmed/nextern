'use client';
// src/app/(auth)/register/page.tsx — Premium redesign

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NexternLogo } from '@/components/brand/NexternLogo';

type Role = 'student' | 'employer';

/* ── ICONS ─────────────────────────────────────────────────────────── */
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
const ArrowRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const EyeIcon = () => (
  <svg
    width="17"
    height="17"
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
    width="17"
    height="17"
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
const AlertIcon = () => (
  <svg
    width="15"
    height="15"
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
const InfoIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const GradCapIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const BuildingIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22V12h6v10M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01" />
  </svg>
);
const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const MailIcon = () => (
  <svg
    width="16"
    height="16"
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
    width="16"
    height="16"
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
const ChevronDownIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── ROLE CONFIG ────────────────────────────────────────────────────── */
const ROLES = [
  {
    id: 'student' as Role,
    Icon: GradCapIcon,
    title: 'Student',
    desc: 'Find internships & track your career readiness',
    accent: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    badge: 'Free forever',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    perks: ['AI skill gap analysis', 'Fit scoring for every job', 'Resume builder'],
  },
  {
    id: 'employer' as Role,
    Icon: BuildingIcon,
    title: 'Employer',
    desc: 'Hire top campus talent from BD universities',
    accent: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE',
    badge: 'Requires approval',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    perks: ['AI-ranked applicant pipeline', 'Batch-hire across 14+ unis', 'Built-in interviews'],
  },
];

const BD_UNIVERSITIES = [
  'BRAC University',
  'North South University (NSU)',
  'AIUB',
  'Independent University Bangladesh (IUB)',
  'East West University (EWU)',
  'Daffodil International University (DIU)',
  'ULAB',
  'United International University (UIU)',
  'Bangladesh University of Engineering & Technology (BUET)',
  'Khulna University of Engineering & Technology (KUET)',
  'Rajshahi University of Engineering & Technology (RUET)',
  'Chittagong University of Engineering & Technology (CUET)',
  'Shahjalal University of Science and Technology (SUST)',
  'Dhaka University (DU)',
  'Islamic University of Technology (IUT)',
];
const BD_INDUSTRIES = [
  'IT/Software',
  'Banking & Finance',
  'NGO/Development',
  'RMG/Textile',
  'Telecom',
  'Pharma',
  'FMCG',
  'E-commerce/Startup',
  'Education',
  'Healthcare',
  'Manufacturing',
  'Other',
];

/* ── FIELD COMPONENT ────────────────────────────────────────────────── */
function Field({
  name,
  label,
  required = true,
  error,
  icon,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 700,
          color: '#374151',
          marginBottom: 7,
        }}
      >
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {icon}
          </div>
        )}
        {children}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <span style={{ color: '#EF4444' }}>
            <AlertIcon />
          </span>
          <span style={{ color: '#EF4444', fontSize: 12 }}>{error}</span>
        </div>
      )}
    </div>
  );
}

/* ── INPUT STYLES ───────────────────────────────────────────────────── */
function inputStyle(hasIcon = false, hasError = false): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: `11px 14px 11px ${hasIcon ? '38px' : '14px'}`,
    border: `1.5px solid ${hasError ? '#FECACA' : '#E2E8F0'}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    background: hasError ? '#FFF5F5' : '#fff',
    color: '#0F172A',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    appearance: 'none' as const,
  };
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#94A3B8',
        }}
      >
        <ChevronDownIcon />
      </div>
    </div>
  );
}

/* ── PASSWORD STRENGTH ──────────────────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8, label: '8+ chars' },
    { ok: /[A-Z]/.test(password), label: 'Uppercase' },
    { ok: /[0-9]/.test(password), label: 'Number' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Symbol' },
  ];
  const score = checks.filter((c) => c.ok).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][score];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
        {checks.map((c, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 999,
              background: c.ok ? strengthColor : '#E2E8F0',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {checks.map((c, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                color: c.ok ? '#475569' : '#CBD5E1',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {c.ok && (
                <span style={{ color: '#10B981' }}>
                  <CheckIcon />
                </span>
              )}
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: strengthColor }}>
            {strengthLabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── MAIN ──────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role');
  const defaultRole =
    requestedRole === 'student' || requestedRole === 'employer' ? requestedRole : null;

  const [step, setStep] = useState<1 | 2>(defaultRole ? 2 : 1);
  const [role, setRole] = useState<Role | null>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
    department: '',
    yearOfStudy: '',
    studentId: '',
    companyName: '',
    industry: '',
    tradeLicenseNo: '',
    headquartersCity: '',
  });

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setErrors({});

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      password: form.password,
      role,
    };
    if (role === 'student') {
      Object.assign(payload, {
        university: form.university,
        department: form.department,
        yearOfStudy: parseInt(form.yearOfStudy) || undefined,
        studentId: form.studentId,
      });
    } else if (role === 'employer') {
      Object.assign(payload, {
        companyName: form.companyName,
        industry: form.industry,
        tradeLicenseNo: form.tradeLicenseNo,
        headquartersCity: form.headquartersCity,
      });
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const flat: Record<string, string> = {};
          Object.entries(data.details as Record<string, string[]>).forEach(([k, v]) => {
            flat[k] = v[0];
          });
          setErrors(flat);
        } else {
          setErrors({ _form: data.error ?? 'Registration failed.' });
        }
        return;
      }
      const params = new URLSearchParams({
        email: form.email.trim().toLowerCase(),
        role,
      });
      if (data.emailSent === false) {
        params.set('delivery', 'failed');
      }
      router.push(`/verify-email?${params.toString()}`);
    } catch {
      setErrors({ _form: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const activeRole = ROLES.find((r) => r.id === role);
  const needsApproval = role === 'employer';

  const focusStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    borderColor: hasError ? '#FECACA' : focusedField === field ? '#2563EB' : '#E2E8F0',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
    background: hasError ? '#FFF5F5' : focusedField === field ? '#FAFCFF' : '#fff',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── LEFT BRAND PANEL ─────────────────────────────────────── */}
      <div
        style={{
          width: '42%',
          minHeight: '100vh',
          flexShrink: 0,
          background: 'linear-gradient(150deg, #0F172A 0%, #1E293B 50%, #0F2040 100%)',
          padding: '48px 48px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="brand-panel"
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
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
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
            marginBottom: 'auto',
          }}
        >
          <NexternLogo
            markSize={36}
            markRadius={10}
            markShadow="0 4px 12px rgba(37,99,235,0.4)"
            textSize={21}
            textColor="#fff"
          />
        </Link>

        {/* Dynamic role preview OR default content */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 28,
            paddingTop: 32,
          }}
        >
          {activeRole ? (
            <>
              <div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: activeRole.bg,
                    border: `1px solid ${activeRole.border}`,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeRole.accent,
                    marginBottom: 18,
                  }}
                >
                  <activeRole.Icon />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span
                    style={{
                      background: activeRole.badgeBg,
                      color: activeRole.badgeColor,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      letterSpacing: 0.3,
                    }}
                  >
                    {activeRole.badge}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.8px',
                    marginTop: 10,
                    marginBottom: 10,
                    lineHeight: 1.15,
                  }}
                >
                  Registering as
                  <br />
                  <span
                    style={{
                      backgroundImage: `linear-gradient(120deg, ${activeRole.accent}, #22D3EE)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {activeRole.title}
                  </span>
                </h2>
                <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.75 }}>
                  {activeRole.desc}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  What you get
                </div>
                {activeRole.perks.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(34,211,238,0.12)',
                        border: '1px solid rgba(34,211,238,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#22D3EE',
                        flexShrink: 0,
                      }}
                    >
                      <CheckIcon />
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: 14 }}>{p}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div>
                <h2
                  style={{
                    fontSize: 34,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-1px',
                    lineHeight: 1.1,
                    marginBottom: 14,
                  }}
                >
                  Join 2,400+
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(120deg, #3B82F6, #22D3EE)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ambitious students
                  </span>
                </h2>
                <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.75 }}>
                  Create your free account and get AI-powered career guidance tailored to the
                  Bangladesh job market.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Takes less than 2 minutes to sign up',
                  'Free for all students, always',
                  'AI matches you to the right internships',
                  'Trusted by 14+ BD universities',
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(34,211,238,0.12)',
                        border: '1px solid rgba(34,211,238,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#22D3EE',
                        flexShrink: 0,
                      }}
                    >
                      <CheckIcon />
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: 14 }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                {[
                  { v: '2,400+', l: 'Students' },
                  { v: '340+', l: 'Companies' },
                  { v: '89%', l: 'Placement' },
                ].map((s, i) => (
                  <div
                    key={s.l}
                    style={{
                      flex: 1,
                      borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      paddingRight: i < 2 ? 16 : 0,
                      paddingLeft: i > 0 ? 16 : 0,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: '#fff',
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      {s.v}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────────── */}
      <div
        className="auth-form-panel"
        style={{
          flex: 1,
          width: '100%',
          minWidth: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '48px 32px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 500 }}>
          {/* Progress stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              marginBottom: 36,
            }}
          >
            {[
              { n: 1, label: 'Choose role' },
              { n: 2, label: 'Your details' },
              { n: 3, label: 'Verify email' },
            ].map((s, idx) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      background: s.n < step ? '#059669' : s.n === step ? '#2563EB' : '#E2E8F0',
                      color: s.n <= step ? '#fff' : '#94A3B8',
                      boxShadow: s.n === step ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {s.n < step ? <CheckIcon /> : s.n}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: s.n === step ? '#0F172A' : '#94A3B8',
                      fontWeight: s.n === step ? 700 : 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className="register-step-connector"
                    style={{
                      width: 56,
                      height: 2,
                      background: s.n < step ? '#059669' : '#E2E8F0',
                      margin: '0 6px',
                      marginBottom: 20,
                      transition: 'background 0.2s',
                      borderRadius: 999,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── STEP 1 ─────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.5px',
                    marginBottom: 6,
                  }}
                >
                  Create your account
                </h1>
                <p style={{ color: '#64748B', fontSize: 15 }}>
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      setStep(2);
                    }}
                    style={{
                      padding: '22px 18px',
                      borderRadius: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: `2px solid ${role === r.id ? r.accent : '#E2E8F0'}`,
                      background: role === r.id ? r.bg : '#fff',
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = r.accent;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.08)`;
                    }}
                    onMouseOut={(e) => {
                      if (role !== r.id) e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background: r.bg,
                        border: `1px solid ${r.border}`,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: r.accent,
                      }}
                    >
                      <r.Icon />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#0F172A',
                          fontSize: 15,
                          fontFamily: 'var(--font-display)',
                          marginBottom: 4,
                        }}
                      >
                        {r.title}
                      </div>
                      <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.5 }}>
                        {r.desc}
                      </div>
                    </div>
                    <span
                      style={{
                        background: r.badgeBg,
                        color: r.badgeColor,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 999,
                        alignSelf: 'flex-start',
                      }}
                    >
                      {r.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2 ─────────────────────────────────────────── */}
          {step === 2 && role && activeRole && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '6px 0',
                    marginBottom: 16,
                  }}
                >
                  <ArrowLeftIcon /> Back to role selection
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: activeRole.bg,
                      border: `1px solid ${activeRole.border}`,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activeRole.accent,
                      flexShrink: 0,
                    }}
                  >
                    <activeRole.Icon />
                  </div>
                  <div>
                    <h1
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '-0.3px',
                        lineHeight: 1,
                      }}
                    >
                      {activeRole.title} Registration
                    </h1>
                    <p style={{ color: '#64748B', fontSize: 13, marginTop: 3 }}>
                      Fill in your details to create your account
                    </p>
                  </div>
                </div>
              </div>

              {errors._form && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#991B1B',
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  <AlertIcon />
                  <span>{errors._form}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* ── COMMON FIELDS ── */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 14,
                    padding: '18px 18px',
                    border: '1px solid #F1F5F9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#94A3B8',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    Account Info
                  </div>
                  <Field name="name" label="Full Name" error={errors.name} icon={<UserIcon />}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Your full name"
                      required
                      style={{
                        ...inputStyle(true, !!errors.name),
                        ...focusStyle('name', !!errors.name),
                      }}
                    />
                  </Field>
                  <Field
                    name="email"
                    label="Email Address"
                    error={errors.email}
                    icon={<MailIcon />}
                  >
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@email.com"
                      required
                      autoComplete="email"
                      style={{
                        ...inputStyle(true, !!errors.email),
                        ...focusStyle('email', !!errors.email),
                      }}
                    />
                  </Field>
                  <Field
                    name="password"
                    label="Password"
                    error={errors.password}
                    icon={<LockIcon />}
                  >
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => set('password', e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        required
                        autoComplete="new-password"
                        style={{
                          ...inputStyle(true, !!errors.password),
                          ...focusStyle('password', !!errors.password),
                          paddingRight: 44,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94A3B8',
                          pointerEvents: 'none',
                        }}
                      >
                        <LockIcon />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94A3B8',
                          display: 'flex',
                        }}
                      >
                        {showPass ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <PasswordStrength password={form.password} />
                  </Field>
                </div>

                {/* ── ROLE-SPECIFIC FIELDS ── */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 14,
                    padding: '18px 18px',
                    border: '1px solid #F1F5F9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#94A3B8',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {role === 'student' ? 'Academic Details' : 'Company Details'}
                  </div>

                  {/* STUDENT */}
                  {role === 'student' && (
                    <>
                      <Field name="university" label="University" error={errors.university}>
                        <SelectWrapper>
                          <select
                            value={form.university}
                            onChange={(e) => set('university', e.target.value)}
                            onFocus={() => setFocusedField('university')}
                            onBlur={() => setFocusedField(null)}
                            required
                            style={{
                              ...inputStyle(false, !!errors.university),
                              ...focusStyle('university', !!errors.university),
                              paddingRight: 36,
                            }}
                          >
                            <option value="">Select your university</option>
                            {BD_UNIVERSITIES.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </SelectWrapper>
                      </Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field name="department" label="Department" error={errors.department}>
                          <input
                            type="text"
                            value={form.department}
                            onChange={(e) => set('department', e.target.value)}
                            onFocus={() => setFocusedField('dept')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="e.g. CSE, BBA"
                            required
                            style={{
                              ...inputStyle(false, !!errors.department),
                              ...focusStyle('dept'),
                            }}
                          />
                        </Field>
                        <Field name="yearOfStudy" label="Year of Study" error={errors.yearOfStudy}>
                          <SelectWrapper>
                            <select
                              value={form.yearOfStudy}
                              onChange={(e) => set('yearOfStudy', e.target.value)}
                              onFocus={() => setFocusedField('year')}
                              onBlur={() => setFocusedField(null)}
                              required
                              style={{
                                ...inputStyle(false, !!errors.yearOfStudy),
                                ...focusStyle('year', !!errors.yearOfStudy),
                                paddingRight: 36,
                              }}
                            >
                              <option value="">Select year</option>
                              {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map(
                                (y, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {y}
                                  </option>
                                )
                              )}
                            </select>
                          </SelectWrapper>
                        </Field>
                      </div>
                      <Field name="studentId" label="Student ID" required={false}>
                        <input
                          type="text"
                          value={form.studentId}
                          onChange={(e) => set('studentId', e.target.value)}
                          onFocus={() => setFocusedField('sid')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="e.g. 22301206"
                          style={{ ...inputStyle(false, false), ...focusStyle('sid') }}
                        />
                      </Field>
                    </>
                  )}

                  {/* EMPLOYER */}
                  {role === 'employer' && (
                    <>
                      <Field name="companyName" label="Company Name" error={errors.companyName}>
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(e) => set('companyName', e.target.value)}
                          onFocus={() => setFocusedField('cn')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Your registered company name"
                          required
                          style={{
                            ...inputStyle(false, !!errors.companyName),
                            ...focusStyle('cn'),
                          }}
                        />
                      </Field>
                      <Field name="industry" label="Industry" error={errors.industry}>
                        <SelectWrapper>
                          <select
                            value={form.industry}
                            onChange={(e) => set('industry', e.target.value)}
                            onFocus={() => setFocusedField('ind')}
                            onBlur={() => setFocusedField(null)}
                            required
                            style={{
                              ...inputStyle(false, !!errors.industry),
                              ...focusStyle('ind'),
                              paddingRight: 36,
                            }}
                          >
                            <option value="">Select industry</option>
                            {BD_INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind}>
                                {ind}
                              </option>
                            ))}
                          </select>
                        </SelectWrapper>
                      </Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field name="tradeLicenseNo" label="Trade License No." required={false}>
                          <input
                            type="text"
                            value={form.tradeLicenseNo}
                            onChange={(e) => set('tradeLicenseNo', e.target.value)}
                            onFocus={() => setFocusedField('tl')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="BD Trade License"
                            style={{ ...inputStyle(false, false), ...focusStyle('tl') }}
                          />
                        </Field>
                        <Field name="headquartersCity" label="City / District" required={false}>
                          <input
                            type="text"
                            value={form.headquartersCity}
                            onChange={(e) => set('headquartersCity', e.target.value)}
                            onFocus={() => setFocusedField('hq')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="e.g. Dhaka"
                            style={{ ...inputStyle(false, false), ...focusStyle('hq') }}
                          />
                        </Field>
                      </div>
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }}>
                    <InfoIcon />
                  </div>
                  <div style={{ color: '#1E3A8A', fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ display: 'block', marginBottom: 2 }}>
                      Academic accounts are provisioned internally
                    </strong>
                    Advisor and department head accounts can no longer sign up from the public
                    website. They are created from the superadmin or department head workspace.
                  </div>
                </div>

                {/* Approval notice */}
                {needsApproval && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }}>
                      <InfoIcon />
                    </div>
                    <div style={{ color: '#92400E', fontSize: 13, lineHeight: 1.6 }}>
                      <strong style={{ display: 'block', marginBottom: 2 }}>
                        Admin approval required
                      </strong>
                      Your account will be reviewed within 24 hours. You will receive an email
                      confirmation once approved.
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: loading
                      ? '#93C5FD'
                      : `linear-gradient(135deg, ${activeRole.accent}, ${activeRole.accent}dd)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : `0 4px 16px ${activeRole.accent}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.15s',
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 6px 22px ${activeRole.accent}50`;
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 16px ${activeRole.accent}40`;
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
                      />{' '}
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account <ArrowRightIcon />
                    </>
                  )}
                </button>

                <p
                  style={{
                    textAlign: 'center',
                    color: '#94A3B8',
                    fontSize: 12,
                    lineHeight: 1.6,
                    marginTop: 4,
                  }}
                >
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" style={{ color: '#64748B', textDecoration: 'underline' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'underline' }}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .brand-panel { display: none !important; }
          .auth-form-panel { padding: 40px 18px !important; }
          .register-step-connector { width: 36px !important; }
        }
        select option { background: #fff; color: #0F172A; }
      `}</style>
    </div>
  );
}
