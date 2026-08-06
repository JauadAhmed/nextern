// src/app/pending-approval/page.tsx — Premium redesign

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDefaultAuthenticatedRoute } from '@/lib/role-routing';
import SignOutRedirectButton from '@/components/auth/SignOutRedirectButton';
import { NexternLogo } from '@/components/brand/NexternLogo';

const ROLE_LABELS: Record<string, string> = {
  employer: 'employer account',
  advisor: 'advisor account',
  dept_head: 'department head account',
};

/* ── ICONS ─────────────────────────────────────────────────────────── */
const ClockIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const XCircleIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const CheckCircleSmIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const ArrowLeftIcon = () => (
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
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const MailIcon = () => (
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
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const ShieldIcon = () => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const UserCheckIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);
const BellIcon = () => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const LogoutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── STEP ITEM ─────────────────────────────────────────────────────── */
function StepItem({
  num,
  text,
  status,
}: {
  num: number;
  text: string;
  status: 'done' | 'active' | 'pending';
}) {
  const colors = {
    done: {
      bg: '#DCFCE7',
      border: '#BBF7D0',
      text: '#166534',
      icon: '#059669',
      numBg: '#059669',
      numColor: '#fff',
    },
    active: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1E40AF',
      icon: '#2563EB',
      numBg: '#2563EB',
      numColor: '#fff',
    },
    pending: {
      bg: '#F8FAFC',
      border: '#F1F5F9',
      text: '#64748B',
      icon: '#94A3B8',
      numBg: '#F1F5F9',
      numColor: '#94A3B8',
    },
  }[status];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: colors.numBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {status === 'done' ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.numColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : status === 'active' ? (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fff',
              display: 'block',
            }}
          />
        ) : (
          <span style={{ color: colors.numColor, fontSize: 12, fontWeight: 700 }}>{num}</span>
        )}
      </div>
      <span
        style={{ color: colors.text, fontSize: 14, fontWeight: status === 'active' ? 700 : 500 }}
      >
        {text}
      </span>
      {status === 'active' && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <span
            style={{
              background: '#DBEAFE',
              color: '#1E40AF',
              border: '1px solid #BFDBFE',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            In Progress
          </span>
        </div>
      )}
    </div>
  );
}

/* ── MAIN ──────────────────────────────────────────────────────────── */
export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const redirectTarget = getDefaultAuthenticatedRoute({
    role: session.user.role,
    verificationStatus: session.user.verificationStatus,
    mustChangePassword: session.user.mustChangePassword,
  });

  if (redirectTarget !== '/pending-approval') {
    redirect(redirectTarget);
  }

  const isRejected = session.user.verificationStatus === 'rejected';
  const roleLabel = ROLE_LABELS[session.user.role] ?? 'account';
  const userName = session.user.name?.split(' ')[0] ?? 'there';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
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
            right: '10%',
            width: 450,
            height: 450,
            background: isRejected ? 'rgba(239,68,68,0.035)' : 'rgba(37,99,235,0.04)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: '5%',
            width: 350,
            height: 350,
            background: 'rgba(8,145,178,0.035)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        style={{
          background: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <NexternLogo markSize={34} markRadius={9} textSize={19} textColor="#fff" />
          </Link>
          <SignOutRedirectButton
            redirectTo="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#64748B',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            <LogoutIcon />
            Sign out
          </SignOutRedirectButton>
        </div>
      </nav>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', maxWidth: 580 }}>
          {/* Status indicator */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 88,
                height: 88,
                background: isRejected ? '#FEF2F2' : '#EFF6FF',
                borderRadius: 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRejected ? '#DC2626' : '#2563EB',
                marginBottom: 20,
                boxShadow: isRejected
                  ? '0 8px 32px rgba(220,38,38,0.15)'
                  : '0 8px 32px rgba(37,99,235,0.15)',
                border: `1px solid ${isRejected ? '#FECACA' : '#BFDBFE'}`,
                animation: isRejected ? 'none' : 'pulse-border 2s ease-in-out infinite',
              }}
            >
              {isRejected ? <XCircleIcon /> : <ClockIcon />}
            </div>

            {/* Status badge */}
            <div style={{ marginBottom: 14 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isRejected ? '#FEF2F2' : '#FEFCE8',
                  color: isRejected ? '#991B1B' : '#92400E',
                  border: `1px solid ${isRejected ? '#FECACA' : '#FDE68A'}`,
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isRejected ? '#DC2626' : '#F59E0B',
                    display: 'inline-block',
                    boxShadow: isRejected ? 'none' : '0 0 6px #F59E0B',
                  }}
                />
                {isRejected ? 'Application Declined' : 'Pending Verification'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.5px',
                marginBottom: 10,
              }}
            >
              {isRejected ? 'Application not approved' : `Hi ${userName}, you're almost there!`}
            </h1>
            <p
              style={{
                color: '#64748B',
                fontSize: 15,
                lineHeight: 1.75,
                maxWidth: 460,
                margin: '0 auto',
              }}
            >
              {isRejected
                ? `Your ${roleLabel} application was not approved. Contact our support team if you believe this is an error or need to reapply.`
                : `Your ${roleLabel} is currently under review. Our team typically processes applications within 24 hours.`}
            </p>
          </div>

          {/* Main card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}
          >
            {isRejected ? (
              /* ── REJECTED STATE ─────────────────────────────────── */
              <div style={{ padding: '32px 36px' }}>
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 14,
                    padding: '20px 22px',
                    marginBottom: 28,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: '#991B1B',
                      fontSize: 15,
                      fontFamily: 'var(--font-display)',
                      marginBottom: 8,
                    }}
                  >
                    Why was my application declined?
                  </div>
                  <p style={{ color: '#B91C1C', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    Applications may be declined due to incomplete information, unverifiable
                    credentials, or policy restrictions. Our team reviews each case carefully.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a
                    href="mailto:support@nextern.app"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: '#0F172A',
                      color: '#fff',
                      padding: '13px 24px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: 15,
                      fontFamily: 'var(--font-display)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }}
                  >
                    <MailIcon />
                    Contact support
                  </a>
                  <Link
                    href="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: '#F8FAFC',
                      color: '#475569',
                      padding: '13px 24px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 15,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <ArrowLeftIcon />
                    Back to homepage
                  </Link>
                </div>
              </div>
            ) : (
              /* ── PENDING STATE ──────────────────────────────────── */
              <>
                {/* Progress steps */}
                <div style={{ padding: '28px 32px 0' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: '#0F172A',
                      fontSize: 14,
                      fontFamily: 'var(--font-display)',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div style={{ width: 16, height: 16, color: '#2563EB' }}>
                      <CheckCircleSmIcon />
                    </div>
                    Verification Progress
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <StepItem num={1} text="Registration submitted successfully" status="done" />
                    <StepItem num={2} text="Admin is reviewing your credentials" status="active" />
                    <StepItem num={3} text="Receive approval email" status="pending" />
                    <StepItem num={4} text="Access your full dashboard" status="pending" />
                  </div>
                </div>

                {/* Info cards */}
                <div
                  style={{
                    padding: '24px 32px 28px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                    marginTop: 8,
                  }}
                >
                  {[
                    {
                      Icon: ShieldIcon,
                      title: 'Secure Review',
                      desc: 'Your credentials are verified by our team to maintain platform trust.',
                      color: '#2563EB',
                      bg: '#EFF6FF',
                    },
                    {
                      Icon: BellIcon,
                      title: 'Email Notification',
                      desc: `You'll receive an email at your registered address once approved.`,
                      color: '#059669',
                      bg: '#F0FDF4',
                    },
                    {
                      Icon: UserCheckIcon,
                      title: 'Identity Verified',
                      desc: 'Your email address has been confirmed and is now active.',
                      color: '#7C3AED',
                      bg: '#FDF4FF',
                    },
                    {
                      Icon: ClockIcon,
                      title: '24-Hour Review',
                      desc: 'Our team typically approves applications within one business day.',
                      color: '#D97706',
                      bg: '#FFF7ED',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      style={{
                        background: item.bg,
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                      >
                        <div style={{ color: item.color }}>
                          <item.Icon />
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#0F172A',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {item.title}
                        </div>
                      </div>
                      <p style={{ color: '#64748B', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer action */}
                <div
                  style={{
                    borderTop: '1px solid #F1F5F9',
                    padding: '20px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: '#FAFBFC',
                  }}
                >
                  <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                    Questions? Email us at{' '}
                    <a
                      href="mailto:support@nextern.app"
                      style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
                    >
                      support@nextern.app
                    </a>
                  </p>
                  <Link
                    href="/"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      background: '#fff',
                      color: '#475569',
                      padding: '9px 18px',
                      borderRadius: 9,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <ArrowLeftIcon />
                    Back to homepage
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Tip note */}
          {!isRejected && (
            <div style={{ textAlign: 'center', marginTop: 24, color: '#94A3B8', fontSize: 13 }}>
              Already approved?{' '}
              <SignOutRedirectButton
                redirectTo="/login"
                style={{
                  color: '#2563EB',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                Sign in here
              </SignOutRedirectButton>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 8px 32px rgba(37,99,235,0.15); }
          50% { box-shadow: 0 8px 40px rgba(37,99,235,0.28); }
        }
      `}</style>
    </div>
  );
}
