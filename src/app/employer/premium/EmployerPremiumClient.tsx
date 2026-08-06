'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Crown,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { PLANS } from '@/lib/subscription-plans';
import StripeCheckoutModal from '@/components/payments/StripeCheckoutModal';
import { PaymentMethodLogo, type PaymentMethodId } from '@/components/payments/PaymentMethodLogo';

const plan = PLANS.employer_premium;
type PayMethod = PaymentMethodId;

const PAY_METHODS: { id: PayMethod; label: string }[] = [
  { id: 'bkash', label: 'bKash' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
];

const C = {
  blue: '#2563EB',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F1F5F9',
};

type EmployerPremiumUsage = {
  counts: {
    aiApplicantShortlist: number;
    jobPosting: number;
  };
  limits: {
    aiApplicantShortlist: number | null;
    jobPosting: number | null;
  };
  remaining: {
    aiApplicantShortlist: number | null;
    jobPosting: number | null;
  };
};

function usageText(remaining?: number | null) {
  if (remaining === null) return 'Unlimited';
  if (typeof remaining === 'number') return `${remaining} left this month`;
  return 'Usage loading';
}

export default function EmployerPremiumClient({
  isPremium,
  usage,
}: {
  isPremium: boolean;
  usage?: EmployerPremiumUsage;
}) {
  const [method, setMethod] = useState<PayMethod>('bkash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);

  if (isPremium) {
    return (
      <div
        style={{
          background: '#172033',
          borderRadius: 24,
          padding: 40,
          textAlign: 'center',
          border: '1px solid rgba(37,99,235,0.3)',
        }}
      >
        <Crown size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
        <h2
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            marginBottom: 8,
          }}
        >
          You&apos;re on Premium
        </h2>
        <p style={{ color: '#B8C5D6', fontSize: 15, marginBottom: 24 }}>
          All premium hiring features are active on your account.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/employer/subscription"
            style={{
              display: 'inline-block',
              background: '#2563EB',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Manage Subscription
          </Link>
          <Link
            href="/employer/ai"
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.08)',
              color: '#CBD5E1',
              padding: '12px 24px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Open AI Hiring Center
          </Link>
        </div>
      </div>
    );
  }

  async function handlePay() {
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
          setError(data.details ?? data.error ?? 'Failed to initiate payment.');
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
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isCard = method !== 'bkash';

  return (
    <>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}
        className="emp-premium-grid"
      >
        <div
          style={{
            background: '#172033',
            borderRadius: 24,
            padding: 32,
            border: '1px solid rgba(37,99,235,0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 180,
              height: 180,
              background: 'rgba(37,99,235,0.11)',
              borderRadius: '50%',
            }}
          />
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              ★ EMPLOYER PREMIUM
            </div>
            <h2
              style={{
                color: '#fff',
                fontSize: 28,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                marginBottom: 6,
              }}
            >
              {plan.name}
            </h2>
            <p style={{ color: '#B8C5D6', fontSize: 15, marginBottom: 16 }}>{plan.tagline}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  color: '#fff',
                  fontSize: 44,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                ৳{plan.price}
              </span>
              <span style={{ color: '#B8C5D6', fontSize: 14 }}>/month</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: 'AI shortlists',
                free: usageText(usage?.remaining.aiApplicantShortlist),
                premium: 'Unlimited',
              },
              {
                label: 'Job postings',
                free: usageText(usage?.remaining.jobPosting),
                premium: 'Unlimited',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 800 }}>{item.label}</div>
                <div style={{ color: '#F8FAFC', fontSize: 13, fontWeight: 900, marginTop: 5 }}>
                  Regular: {item.free}
                </div>
                <div style={{ color: '#FDE68A', fontSize: 12, fontWeight: 800, marginTop: 3 }}>
                  Premium: {item.premium}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {plan.features.map((feature, index) => {
              const icons = [Users, BarChart3, Sparkles, CheckCircle2];
              const Icon = icons[index % icons.length];
              return (
                <div
                  key={feature}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    alignItems: 'flex-start',
                  }}
                >
                  <Icon size={14} color="#22D3EE" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.5 }}>{feature}</span>
                </div>
              );
            })}
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
              fontSize: 18,
              fontWeight: 800,
              color: C.text,
              fontFamily: 'var(--font-display)',
              marginBottom: 6,
            }}
          >
            Subscribe now
          </h3>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            ৳{plan.price}/month · Cancel anytime
          </p>

          {error ? (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 16,
                color: '#991B1B',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>{plan.name} × 1 month</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>৳{plan.price}</span>
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 15 }}>Total</span>
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

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.text,
                display: 'block',
                marginBottom: 8,
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
                    padding: '11px 8px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    border: `2px solid ${method === paymentMethod.id ? C.blue : C.border}`,
                    background: method === paymentMethod.id ? '#EFF6FF' : '#fff',
                    color: method === paymentMethod.id ? C.blue : C.muted,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <PaymentMethodLogo method={paymentMethod.id} height={24} />
                  <span>{paymentMethod.label}</span>
                </button>
              ))}
            </div>
          </div>

          {isCard ? (
            <div
              style={{
                marginBottom: 16,
                background: '#F8FAFC',
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                padding: '16px',
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
                    Card details stay inside Stripe&apos;s secure payment form.
                  </div>
                </div>
              </div>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                Click pay to open a secure Visa or Mastercard flow, then you&apos;ll return to your
                billing page automatically.
              </p>
            </div>
          ) : null}

          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#93C5FD' : C.blue,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Zap size={16} />
            {loading ? 'Processing...' : `Pay ৳${plan.price}`}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
            {[
              { icon: ShieldCheck, text: 'Secure payment' },
              { icon: CheckCircle2, text: 'Cancel anytime' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.muted }}
              >
                <Icon size={11} />
                <span style={{ fontSize: 11 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .emp-premium-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <StripeCheckoutModal
        open={showCardModal}
        role="employer"
        planId={plan.id}
        planName={plan.name}
        amount={plan.price}
        method={method === 'mastercard' ? 'mastercard' : 'visa'}
        onClose={() => setShowCardModal(false)}
      />
    </>
  );
}
