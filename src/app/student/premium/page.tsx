'use client';

import { useEffect, useState, type ElementType } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  CreditCard,
  Crown,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { PLANS } from '@/lib/subscription-plans';
import StripeCheckoutModal from '@/components/payments/StripeCheckoutModal';
import { NexternLogo } from '@/components/brand/NexternLogo';
import { PaymentMethodLogo, type PaymentMethodId } from '@/components/payments/PaymentMethodLogo';

const plan = PLANS.student_premium;

const C = {
  blue: '#2563EB',
  bg: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  success: '#10B981',
};

type PayMethod = PaymentMethodId;

const PAY_METHODS: { id: PayMethod; label: string; hint: string }[] = [
  { id: 'bkash', label: 'bKash', hint: 'Redirect to bKash checkout' },
  { id: 'visa', label: 'Visa', hint: 'Secure card payment via Stripe' },
  { id: 'mastercard', label: 'Mastercard', hint: 'Secure card payment via Stripe' },
];

const FEATURE_ICONS: Record<string, ElementType> = {
  ai: Brain,
  fit: Target,
  mock: MessageSquare,
  resume: FileText,
  mentor: Users,
  analytics: BarChart3,
};

function getIcon(feature: string) {
  const match = Object.entries(FEATURE_ICONS).find(([key]) => feature.toLowerCase().includes(key));
  return match ? match[1] : CheckCircle2;
}

export default function StudentPremiumPage() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [method, setMethod] = useState<PayMethod>('bkash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  useEffect(() => {
    if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled. Please try again.');
    }
    if (paymentStatus === 'failed') {
      setError('Payment failed. Please try another method.');
    }
    if (paymentStatus === 'error') {
      setError('Something went wrong. Please contact support.');
    }
  }, [paymentStatus]);

  useEffect(() => {
    let cancelled = false;

    async function loadPremiumStatus() {
      try {
        const res = await fetch('/api/premium/status', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as { isPremium?: boolean };
        if (!cancelled) {
          setIsPremium(Boolean(data.isPremium));
        }
      } catch {
        // Keep the checkout screen usable even if the status endpoint is unavailable.
      } finally {
        if (!cancelled) {
          setPremiumLoaded(true);
        }
      }
    }

    loadPremiumStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePay() {
    if (isPremium) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (method === 'bkash') {
        const res = await fetch('/api/payment/bkash/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan.id }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.details ?? data.error ?? 'Failed to initiate bKash payment.');
          return;
        }

        if (typeof data.bkashURL !== 'string' || !data.bkashURL.startsWith('http')) {
          setError('bKash did not return a valid checkout URL.');
          return;
        }

        window.location.assign(data.bkashURL);
        return;
      }

      setShowCardModal(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const isCard = method === 'visa' || method === 'mastercard';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      <header
        style={{
          background: '#172033',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 60,
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/student/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}
          >
            <NexternLogo
              markSize={40}
              markRadius={14}
              markShadow="0 12px 24px rgba(34,211,238,0.2)"
              textSize={20}
              textColor="#fff"
              subtitle="Student"
              subtitleColor="#9FB4D0"
            />
          </Link>

          <Link
            href="/student/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontSize: 14,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#EFF6FF',
              border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 999,
              padding: '7px 18px',
              marginBottom: 20,
            }}
          >
            <Crown size={14} color="#F59E0B" />
            <span style={{ color: '#2563EB', fontSize: 13, fontWeight: 700 }}>Nextern Premium</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 900,
              color: C.text,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-1px',
              marginBottom: 14,
            }}
          >
            Unlock your full career potential
          </h1>
          <p
            style={{
              color: C.muted,
              fontSize: 17,
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Get unlimited AI skill analysis, mock interviews, and mentorship - everything you need
            to land your dream internship.
          </p>
        </div>

        {error ? (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 14,
              padding: '14px 20px',
              marginBottom: 28,
              color: '#991B1B',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
            }}
          >
            <ShieldCheck size={16} />
            {error}
          </div>
        ) : null}

        {premiumLoaded && isPremium ? (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 18,
              padding: '16px 18px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: '#FFF7ED',
                  border: '1px solid rgba(245,158,11,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crown size={20} color="#D97706" />
              </div>
              <div>
                <div style={{ color: '#92400E', fontSize: 15, fontWeight: 800 }}>
                  Premium is already active on your account
                </div>
                <div style={{ color: '#9A3412', fontSize: 13, marginTop: 4 }}>
                  Your unlimited AI tools and premium recommendations are unlocked.
                </div>
              </div>
            </div>
            <Link
              href="/student/subscription"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 12,
                background: '#2563EB',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Manage subscription
            </Link>
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: 28,
            alignItems: 'start',
          }}
          className="premium-grid"
        >
          <div>
            <div
              style={{
                background: '#172033',
                borderRadius: 28,
                padding: 32,
                border: '1px solid rgba(37,99,235,0.3)',
                boxShadow: '0 24px 64px rgba(15,23,42,0.2)',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  background: 'rgba(37,99,235,0.12)',
                  borderRadius: '50%',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 999,
                      padding: '4px 12px',
                      marginBottom: 10,
                    }}
                  >
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>
                      Most Popular
                    </span>
                  </div>
                  <h2
                    style={{
                      color: '#fff',
                      fontSize: 24,
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {plan.name}
                  </h2>
                  <p style={{ color: '#B8C5D6', fontSize: 14, marginTop: 4 }}>{plan.tagline}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      color: '#fff',
                      fontSize: 40,
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1,
                    }}
                  >
                    ৳{plan.price}
                  </div>
                  <div style={{ color: '#B8C5D6', fontSize: 13, marginTop: 4 }}>per month</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {plan.features.map((feature) => {
                  const Icon = getIcon(feature);
                  return (
                    <div
                      key={feature}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'rgba(37,99,235,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={14} color="#22D3EE" />
                      </div>
                      <span style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.5 }}>
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                borderRadius: 24,
                padding: 24,
                border: `1px solid ${C.border}`,
                boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
              }}
            >
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                  marginBottom: 18,
                }}
              >
                Free vs Premium
              </h3>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', fontSize: 13 }}
              >
                <div
                  style={{
                    padding: '8px 0',
                    fontWeight: 700,
                    color: C.muted,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Feature
                </div>
                <div
                  style={{
                    padding: '8px 0',
                    fontWeight: 700,
                    color: C.muted,
                    textAlign: 'center',
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Free
                </div>
                <div
                  style={{
                    padding: '8px 0',
                    fontWeight: 700,
                    color: C.blue,
                    textAlign: 'center',
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Premium
                </div>
                {[
                  { feature: 'Skill Gap Analysis', free: '5/month', premium: 'Unlimited' },
                  { feature: 'Mock Interviews', free: '2/month', premium: 'Unlimited' },
                  { feature: 'Mentorship Requests', free: '2/month', premium: 'Unlimited' },
                  { feature: 'Internship Fit Score', free: 'Basic', premium: 'Full AI' },
                  { feature: 'Training Paths', free: 'No', premium: 'Yes' },
                  { feature: 'Resume AI Review', free: 'No', premium: 'Yes' },
                  { feature: 'GER PDF Export', free: 'No', premium: 'Yes' },
                  { feature: 'Smart Job Recommendations', free: '10/month', premium: 'Unlimited' },
                ].map((row) => (
                  <div key={row.feature} style={{ display: 'contents' }}>
                    <div
                      style={{
                        padding: '11px 0',
                        color: C.text,
                        borderBottom: `1px solid ${C.border}`,
                        fontWeight: 500,
                      }}
                    >
                      {row.feature}
                    </div>
                    <div
                      style={{
                        padding: '11px 0',
                        textAlign: 'center',
                        color: C.muted,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {row.free}
                    </div>
                    <div
                      style={{
                        padding: '11px 0',
                        textAlign: 'center',
                        color: C.blue,
                        borderBottom: `1px solid ${C.border}`,
                        fontWeight: 700,
                      }}
                    >
                      {row.premium}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: 28,
              border: `1px solid ${C.border}`,
              boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
              position: 'sticky',
              top: 100,
            }}
          >
            <h3
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: C.text,
                fontFamily: 'var(--font-display)',
                marginBottom: 6,
              }}
            >
              Complete your subscription
            </h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              ৳{plan.price}/month · Cancel anytime · Access until billing period ends
            </p>

            <div
              style={{ background: C.bg, borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: C.muted, fontSize: 13 }}>{plan.name} × 1 month</span>
                <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>৳{plan.price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.muted, fontSize: 13 }}>Discount</span>
                <span style={{ color: C.success, fontWeight: 700, fontSize: 13 }}>-</span>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  marginTop: 10,
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>Total</span>
                <span
                  style={{
                    fontWeight: 900,
                    color: C.blue,
                    fontSize: 18,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  ৳{plan.price}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                Payment Method
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PAY_METHODS.map((paymentMethod) => (
                  <button
                    key={paymentMethod.id}
                    onClick={() => setMethod(paymentMethod.id)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: `2px solid ${method === paymentMethod.id ? C.blue : C.border}`,
                      background: method === paymentMethod.id ? '#EFF6FF' : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <PaymentMethodLogo method={paymentMethod.id} height={28} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: method === paymentMethod.id ? C.blue : C.muted,
                      }}
                    >
                      {paymentMethod.label}
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
                {PAY_METHODS.find((item) => item.id === method)?.hint}
              </p>
            </div>

            {isCard ? (
              <div
                style={{
                  marginBottom: 20,
                  background: '#F8FAFC',
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  padding: '16px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCard size={18} color={C.blue} />
                  </div>
                  <div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>
                      Secure Stripe checkout
                    </div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                      Card fields open inside Stripe&apos;s PCI-compliant payment form.
                    </div>
                  </div>
                </div>
                <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                  Click pay to open the secure Visa or Mastercard form, then you&apos;ll be
                  redirected back automatically once the payment is confirmed.
                </p>
              </div>
            ) : null}

            <button
              onClick={handlePay}
              disabled={loading || isPremium}
              style={{
                width: '100%',
                padding: '14px',
                background: loading || isPremium ? '#93C5FD' : C.blue,
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                cursor: loading || isPremium ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: loading || isPremium ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
                marginBottom: 14,
              }}
            >
              {isPremium ? (
                'Premium already active'
              ) : loading ? (
                'Processing...'
              ) : (
                <>
                  <Zap size={18} />
                  Pay ৳{plan.price} with{' '}
                  {method === 'bkash' ? 'bKash' : method === 'visa' ? 'Visa' : 'Mastercard'}
                </>
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[
                { icon: ShieldCheck, text: 'Secure payment' },
                { icon: CheckCircle2, text: 'Cancel anytime' },
                { icon: Sparkles, text: 'Instant access' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.muted }}
                >
                  <Icon size={12} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .premium-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <StripeCheckoutModal
        open={showCardModal}
        role="student"
        planId={plan.id}
        planName={plan.name}
        amount={plan.price}
        method={method === 'mastercard' ? 'mastercard' : 'visa'}
        onClose={() => setShowCardModal(false)}
      />
    </div>
  );
}
