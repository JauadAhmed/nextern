// src/app/page.tsx
// Nextern Landing Page — world-class, premium redesign
// Sections: Navbar, Hero, Logos/Stats, Features, For Students, For Employers, Universities, Testimonials, CTA, Footer

import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import { getDefaultAuthenticatedRoute } from '@/lib/role-routing';

const Icons = {
  Brain: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5A2.5 2.5 0 0 1 17 5v.5a2.5 2.5 0 0 1 0 5v.5a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 11v-.5a2.5 2.5 0 0 1 0-5V5A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M12 13v9" />
      <path d="M9 22h6" />
    </svg>
  ),
  Chart: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Trophy: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  ),
  FileText: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  GraduationCap: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Users: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Building: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22V12h6v10M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01" />
    </svg>
  ),
  School: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
      <path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10Z" />
      <path d="M18 5v5" />
      <path d="m4 6 8-4 8 4" />
      <path d="M6 10v5" />
    </svg>
  ),
  CheckCircle: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Sparkles: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  ),
  Target: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  TrendingUp: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  Zap: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Shield: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  BarChart: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Map: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  ),
  ClipboardList: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Quote: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  ),
  Menu: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  X: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Mail: () => (
    <svg
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
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Linkedin: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
};

/* â”€â”€â”€ STAT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatCard({
  value,
  label,
  Icon,
  color,
}: {
  value: string;
  label: string;
  Icon: () => React.JSX.Element;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '28px 20px',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          background: color,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563EB',
        }}
      >
        <div style={{ width: 24, height: 24 }}>
          <Icon />
        </div>
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          color: '#1E293B',
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ color: '#64748B', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
        {label}
      </div>
    </div>
  );
}

/* â”€â”€â”€ FEATURE CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FeatureCard({
  icon,
  title,
  desc,
  accent,
  bg,
}: {
  icon: () => React.JSX.Element;
  title: string;
  desc: string;
  accent: string;
  bg: string;
}) {
  const IconComp = icon;
  return (
    <div
      className="landing-feature-card"
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '28px 28px 32px',
        border: '1px solid #E2E8F0',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          background: bg,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
        }}
      >
        <div style={{ width: 26, height: 26 }}>
          <IconComp />
        </div>
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#1E293B',
          fontFamily: 'var(--font-display)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.75, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* â”€â”€â”€ STEP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Step({
  num,
  title,
  desc,
  last,
}: {
  num: string;
  title: string;
  desc: string;
  last?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: '#2563EB',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          {num}
        </div>
        {!last && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: 'rgba(37, 99, 235, 0.16)',
              margin: '8px 0',
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: last ? 0 : 28 }}>
        <div
          style={{
            fontWeight: 700,
            color: '#1E293B',
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ TESTIMONIAL CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TestimonialCard({
  name,
  role,
  uni,
  text,
  initials,
  color,
}: {
  name: string;
  role: string;
  uni: string;
  text: string;
  initials: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '28px 28px 32px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ color: '#FCD34D', display: 'flex', gap: 2 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 14, height: 14 }}>
            <Icons.Star />
          </div>
        ))}
      </div>
      <div style={{ color: '#334155', fontSize: 15, lineHeight: 1.75, fontStyle: 'italic' }}>
        &quot;{text}&quot;
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderTop: '1px solid #F1F5F9',
          paddingTop: 16,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              color: '#1E293B',
              fontSize: 14,
              fontFamily: 'var(--font-display)',
            }}
          >
            {name}
          </div>
          <div style={{ color: '#64748B', fontSize: 12 }}>
            {role} · {uni}
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ CHECK POINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CheckPoint({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 20, height: 20, color: '#2563EB', flexShrink: 0, marginTop: 1 }}>
        <Icons.CheckCircle />
      </div>
      <span style={{ color: '#475569', fontSize: 15, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* â”€â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect(
      getDefaultAuthenticatedRoute({
        role: session.user.role,
        verificationStatus: session.user.verificationStatus,
        mustChangePassword: session.user.mustChangePassword,
      })
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: '#F8FAFC', overflowX: 'hidden' }}>
      {/* â”€â”€ NAVBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="landing-nav-inner"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <NexternLogo
              markSize={36}
              markRadius={10}
              markShadow="0 4px 12px rgba(37,99,235,0.4)"
              textSize={21}
              textColor="#fff"
              priority
            />
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 32 }}>
            {[
              { label: 'Features', href: '#features' },
              { label: 'For Students', href: '#for-students' },
              { label: 'For Employers', href: '#for-employers' },
              { label: 'Universities', href: '#universities' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="landing-nav-link"
                style={{
                  color: '#94A3B8',
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                  letterSpacing: '0.1px',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href="/login"
              style={{
                color: '#CBD5E1',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                padding: '9px 18px',
                borderRadius: 8,
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              Sign in
            </Link>
            <Link
              className="landing-get-started"
              href="/register"
              style={{
                background: '#2563EB',
                color: '#fff',
                padding: '9px 20px',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 2px 10px rgba(37,99,235,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Get started
              <div style={{ width: 14, height: 14 }}>
                <Icons.ArrowRight />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        className="landing-hero"
        style={{
          background: '#0F172A',
          padding: '100px 0 120px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: '5%',
            width: 600,
            height: 600,
            background: 'rgba(37,99,235,0.12)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: '0%',
            width: 500,
            height: 500,
            background: 'rgba(8,145,178,0.08)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '30%',
            width: 300,
            height: 300,
            background: 'rgba(124,58,237,0.06)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 64,
              alignItems: 'center',
            }}
            className="hero-grid"
          >
            {/* Left */}
            <div className="hero-copy" style={{ minWidth: 0 }}>
              {/* Pill badge */}
              <div
                className="hero-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(37,99,235,0.12)',
                  border: '1px solid rgba(37,99,235,0.35)',
                  borderRadius: 999,
                  padding: '7px 16px',
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#22D3EE',
                    boxShadow: '0 0 8px #22D3EE',
                  }}
                />
                <span
                  style={{
                    color: '#93C5FD',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                  }}
                >
                  Now serving 14+ Bangladesh universities
                </span>
              </div>

              <h1
                className="hero-heading"
                style={{
                  fontSize: 'clamp(38px, 4.5vw, 64px)',
                  fontWeight: 900,
                  color: '#F8FAFC',
                  lineHeight: 1.07,
                  letterSpacing: '-1.5px',
                  marginBottom: 22,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Your internship
                <br />
                journey{' '}
                <span
                  style={{
                    background: '#38BDF8',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  starts here
                </span>
              </h1>

              <p
                style={{
                  fontSize: 17,
                  color: '#94A3B8',
                  lineHeight: 1.8,
                  marginBottom: 44,
                  maxWidth: 500,
                }}
              >
                Nextern connects Bangladesh university students with the right internships through
                AI-powered skill matching, personalized career guidance, and direct employer access.
              </p>

              {/* CTA Buttons */}
              <div
                className="hero-actions"
                style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 52 }}
              >
                <Link
                  href="/register"
                  style={{
                    background: '#2563EB',
                    color: '#fff',
                    padding: '15px 32px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-display)',
                    boxShadow: '0 6px 24px rgba(37,99,235,0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'transform 0.15s',
                  }}
                >
                  Start for free
                  <div style={{ width: 16, height: 16 }}>
                    <Icons.ArrowRight />
                  </div>
                </Link>
                <Link
                  href="/register?role=employer"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: '#E2E8F0',
                    padding: '15px 32px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-display)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ width: 16, height: 16 }}>
                    <Icons.Building />
                  </div>
                  Hire students
                </Link>
              </div>

              {/* Social proof */}
              <div
                className="hero-social-proof"
                style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}
              >
                <div style={{ display: 'flex' }}>
                  {['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706'].map((bg, i) => (
                    <div
                      key={i}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: '2.5px solid #0F172A',
                        marginLeft: i === 0 ? 0 : -10,
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {['S', 'R', 'A', 'M', 'T'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>
                    2,400+ students enrolled
                  </div>
                  <div style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                    From BRAC, NSU, AIUB, EWU & more
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Hero visual card */}
            <div style={{ position: 'relative' }} className="hero-visual">
              {/* Main card */}
              <div
                style={{
                  background: '#1E293B',
                  borderRadius: 24,
                  padding: 28,
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                }}
              >
                {/* Top bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: '#64748B',
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Internship Fit Score
                    </div>
                    <div
                      style={{
                        color: '#fff',
                        fontSize: 42,
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      78<span style={{ fontSize: 22, color: '#64748B', fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      color: '#34D399',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid rgba(52,211,153,0.25)',
                    }}
                  >
                    Strong Match
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 999,
                    height: 8,
                    marginBottom: 24,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '78%',
                      height: '100%',
                      background: '#2563EB',
                      borderRadius: 999,
                    }}
                  />
                </div>

                {/* Skill gaps */}
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    paddingTop: 20,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      color: '#64748B',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    Skill Analysis
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      {
                        skill: 'React.js',
                        type: 'Hard Gap',
                        color: '#FCA5A5',
                        bg: 'rgba(239,68,68,0.1)',
                        border: 'rgba(239,68,68,0.2)',
                      },
                      {
                        skill: 'REST APIs',
                        type: 'Soft Gap',
                        color: '#FDE68A',
                        bg: 'rgba(245,158,11,0.1)',
                        border: 'rgba(245,158,11,0.2)',
                      },
                      {
                        skill: 'Git & GitHub',
                        type: 'Fulfilled',
                        color: '#6EE7B7',
                        bg: 'rgba(16,185,129,0.1)',
                        border: 'rgba(16,185,129,0.2)',
                      },
                    ].map((g) => (
                      <div
                        key={g.skill}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: g.bg,
                          border: `1px solid ${g.border}`,
                          borderRadius: 10,
                          padding: '9px 14px',
                        }}
                      >
                        <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500 }}>
                          {g.skill}
                        </span>
                        <span style={{ color: g.color, fontSize: 12, fontWeight: 700 }}>
                          {g.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI suggestion */}
                <div
                  style={{
                    background: 'rgba(37,99,235,0.12)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid rgba(37,99,235,0.2)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{ width: 20, height: 20, color: '#60A5FA', flexShrink: 0, marginTop: 1 }}
                  >
                    <Icons.Sparkles />
                  </div>
                  <div>
                    <div
                      style={{ color: '#93C5FD', fontSize: 12, fontWeight: 700, marginBottom: 4 }}
                    >
                      AI Recommended Path
                    </div>
                    <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6 }}>
                      Complete <strong style={{ color: '#fff' }}>React for Beginners</strong> on
                      Coursera to close your top gap and boost your fit score to 91%.
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card 1 */}
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  background: '#fff',
                  borderRadius: 14,
                  padding: '10px 16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ width: 20, height: 20, color: '#059669' }}>
                  <Icons.TrendingUp />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    89% placement rate
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>This semester</div>
                </div>
              </div>

              {/* Floating card 2 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -16,
                  left: -24,
                  background: '#fff',
                  borderRadius: 14,
                  padding: '10px 16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  S
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    New match found
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    Frontend Dev @ bKash — 94% fit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ STATS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={{ background: '#F8FAFC', padding: '60px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p
              style={{
                color: '#94A3B8',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Trusted by students across Bangladesh
            </p>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
            className="stats-grid"
          >
            <StatCard value="2,400+" label="Active Students" Icon={Icons.Users} color="#EFF6FF" />
            <StatCard value="340+" label="Companies Hiring" Icon={Icons.Building} color="#F0FDF4" />
            <StatCard value="14" label="Partner Universities" Icon={Icons.School} color="#FFF7ED" />
            <StatCard value="89%" label="Placement Rate" Icon={Icons.TrendingUp} color="#FDF4FF" />
          </div>
        </div>
      </section>

      {/* â”€â”€ FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="features" style={{ background: '#fff', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#EFF6FF',
                color: '#1D4ED8',
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
                border: '1px solid #BFDBFE',
              }}
            >
              <div style={{ width: 14, height: 14 }}>
                <Icons.Sparkles />
              </div>
              Platform Features
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-1px',
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              Everything you need to
              <br />
              launch your career
            </h2>
            <p
              style={{
                color: '#64748B',
                fontSize: 17,
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              From AI-powered matching to real-time mentorship — Nextern has every tool you need.
            </p>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="features-grid"
          >
            <FeatureCard
              icon={Icons.Brain}
              title="AI Skill Gap Analysis"
              accent="#2563EB"
              bg="#EFF6FF"
              desc="Nextern AI compares your profile against job requirements and generates a personalized learning path to close every skill gap."
            />
            <FeatureCard
              icon={Icons.Target}
              title="Internship Fit Score"
              accent="#059669"
              bg="#F0FDF4"
              desc="See a precise percentage score for how well you match each internship. Know exactly where you stand before you apply."
            />
            <FeatureCard
              icon={Icons.Trophy}
              title="Opportunity Score"
              accent="#D97706"
              bg="#FFF7ED"
              desc="Earn points for skills added, applications sent, and gaps closed. Climb your university's leaderboard and stand out."
            />
            <FeatureCard
              icon={Icons.FileText}
              title="Resume Builder"
              accent="#9333EA"
              bg="#FDF4FF"
              desc="Build a polished PDF resume in minutes from your profile data. Choose from three premium templates with live preview."
            />
            <FeatureCard
              icon={Icons.GraduationCap}
              title="Graduation Report"
              accent="#0284C7"
              bg="#F0F9FF"
              desc="A verified achievement document scoring your entire university career — shareable directly with top recruiters."
            />
            <FeatureCard
              icon={Icons.Users}
              title="Alumni Mentorship"
              accent="#E11D48"
              bg="#FFF1F2"
              desc="Connect with alumni and professionals for video sessions, resume reviews, and mock interview practice sessions."
            />
          </div>
        </div>
      </section>

      {/* â”€â”€ FOR STUDENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="for-students" style={{ background: '#F8FAFC', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 72,
              alignItems: 'center',
            }}
            className="split-grid"
          >
            {/* Left content */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#DCFCE7',
                  color: '#15803D',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 20,
                  border: '1px solid #BBF7D0',
                }}
              >
                <div style={{ width: 14, height: 14 }}>
                  <Icons.GraduationCap />
                </div>
                For Students
              </div>
              <h2
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 42px)',
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.8px',
                  marginBottom: 18,
                  lineHeight: 1.15,
                }}
              >
                Know exactly whats blocking your dream internship
              </h2>
              <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.8, marginBottom: 36 }}>
                Stop applying blindly. See your exact skill gaps, get an AI-generated learning path,
                and track your readiness score in real time.
              </p>
              <div style={{ marginBottom: 36 }}>
                <Step
                  num="01"
                  title="Build your academic profile"
                  desc="Add your CGPA, skills, completed courses, and portfolio projects in minutes."
                />
                <Step
                  num="02"
                  title="Get your Fit Score instantly"
                  desc="AI compares your profile to every job's requirements and scores your match."
                />
                <Step
                  num="03"
                  title="Follow your learning path"
                  desc="Get curated courses and resources to close gaps and boost your score."
                />
                <Step
                  num="04"
                  title="Apply with full confidence"
                  desc="Submit applications when your fit score is strong and stand out."
                  last
                />
              </div>
              <Link
                href="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#2563EB',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 15,
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                }}
              >
                Create student account
                <div style={{ width: 16, height: 16 }}>
                  <Icons.ArrowRight />
                </div>
              </Link>
            </div>

            {/* Right — dark card */}
            <div
              style={{
                background: '#172033',
                borderRadius: 24,
                padding: 32,
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
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
                  pointerEvents: 'none',
                }}
              />
              {/* Score display */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    color: '#475569',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Your Fit Score — bKash Frontend Role
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <span
                    style={{
                      color: '#F8FAFC',
                      fontSize: 52,
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1,
                    }}
                  >
                    78<span style={{ fontSize: 24, color: '#475569', fontWeight: 600 }}>%</span>
                  </span>
                  <span
                    style={{
                      background: 'rgba(52,211,153,0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(52,211,153,0.25)',
                      padding: '5px 13px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Strong Match
                  </span>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    height: 6,
                    marginTop: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '78%',
                      height: '100%',
                      background: '#2563EB',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  paddingTop: 20,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    color: '#475569',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 14,
                  }}
                >
                  Skill Gaps to Close
                </div>
                {[
                  {
                    skill: 'React.js',
                    badge: 'Hard Gap',
                    c: '#FCA5A5',
                    bg: 'rgba(239,68,68,0.1)',
                    b: 'rgba(239,68,68,0.2)',
                  },
                  {
                    skill: 'REST APIs',
                    badge: 'Soft Gap',
                    c: '#FDE68A',
                    bg: 'rgba(245,158,11,0.08)',
                    b: 'rgba(245,158,11,0.2)',
                  },
                  {
                    skill: 'Git & GitHub',
                    badge: 'Fulfilled',
                    c: '#6EE7B7',
                    bg: 'rgba(16,185,129,0.1)',
                    b: 'rgba(16,185,129,0.2)',
                  },
                ].map((g) => (
                  <div
                    key={g.skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: g.bg,
                      border: `1px solid ${g.b}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500 }}>
                      {g.skill}
                    </span>
                    <span style={{ color: g.c, fontSize: 12, fontWeight: 700 }}>{g.badge}</span>
                  </div>
                ))}
              </div>

              {/* AI suggestion */}
              <div
                style={{
                  background: 'rgba(37,99,235,0.12)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid rgba(37,99,235,0.2)',
                  display: 'flex',
                  gap: 12,
                }}
              >
                <div
                  style={{ width: 18, height: 18, color: '#60A5FA', flexShrink: 0, marginTop: 2 }}
                >
                  <Icons.Sparkles />
                </div>
                <div>
                  <div
                    style={{
                      color: '#93C5FD',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    AI Suggested Path
                  </div>
                  <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6 }}>
                    Complete <strong style={{ color: '#fff' }}>React for Beginners</strong> on
                    Coursera (free) + build one portfolio project to boost your score to 91%.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ FOR EMPLOYERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="for-employers" style={{ background: '#fff', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 72,
              alignItems: 'center',
            }}
            className="split-grid"
          >
            {/* Left — Applicant pipeline card */}
            <div
              style={{
                background: '#fff',
                borderRadius: 24,
                padding: 28,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: '#0F172A',
                      fontSize: 17,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Applicant Pipeline
                  </div>
                  <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
                    Frontend Developer Intern — Dhaka
                  </div>
                </div>
                <span
                  style={{
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid #BBF7D0',
                  }}
                >
                  12 New
                </span>
              </div>

              {/* Applicant rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  {
                    name: 'Samia T.',
                    uni: 'BRAC University',
                    score: 92,
                    status: 'Shortlisted',
                    sc: '#059669',
                    sb: '#DCFCE7',
                    sb2: '#BBF7D0',
                    init: 'ST',
                    bc: '#2563EB',
                  },
                  {
                    name: 'Sabbir A.',
                    uni: 'North South University',
                    score: 85,
                    status: 'Under Review',
                    sc: '#D97706',
                    sb: '#FEF9C3',
                    sb2: '#FDE68A',
                    init: 'SA',
                    bc: '#7C3AED',
                  },
                  {
                    name: 'Jauad S.',
                    uni: 'AIUB',
                    score: 78,
                    status: 'Applied',
                    sc: '#2563EB',
                    sb: '#DBEAFE',
                    sb2: '#BFDBFE',
                    init: 'JS',
                    bc: '#059669',
                  },
                  {
                    name: 'Nadia H.',
                    uni: 'EWU',
                    score: 74,
                    status: 'Applied',
                    sc: '#2563EB',
                    sb: '#DBEAFE',
                    sb2: '#BFDBFE',
                    init: 'NH',
                    bc: '#E11D48',
                  },
                ].map((a, i) => (
                  <div
                    key={a.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 0',
                      borderBottom: i < 3 ? '1px solid #F8FAFC' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: a.bc,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {a.init}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>
                          {a.name}
                        </div>
                        <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 1 }}>{a.uni}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: '#2563EB',
                            fontSize: 16,
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {a.score}%
                        </div>
                        <div style={{ color: '#94A3B8', fontSize: 11 }}>Fit score</div>
                      </div>
                      <span
                        style={{
                          background: a.sb,
                          color: a.sc,
                          border: `1px solid ${a.sb2}`,
                          padding: '4px 11px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom action bar */}
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: '#F8FAFC',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#64748B', fontSize: 13 }}>48 total applicants</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    36 Reviewed
                  </span>
                  <span
                    style={{
                      background: '#FEF9C3',
                      color: '#92400E',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    12 Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Right content */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#EDE9FE',
                  color: '#6D28D9',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 20,
                  border: '1px solid #DDD6FE',
                }}
              >
                <div style={{ width: 14, height: 14 }}>
                  <Icons.Building />
                </div>
                For Employers
              </div>
              <h2
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 42px)',
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.8px',
                  marginBottom: 18,
                  lineHeight: 1.15,
                }}
              >
                Hire the right campus talent, faster
              </h2>
              <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
                Post your requirements once. Get every applicant ranked by AI-computed fit score. No
                more manually screening hundreds of resumes.
              </p>
              <div style={{ marginBottom: 36 }}>
                <CheckPoint text="AI automatically ranks all applicants by fit score" />
                <CheckPoint text="Batch-hire across 14+ BD universities in one campaign" />
                <CheckPoint text="Built-in coding challenges and video interviews" />
                <CheckPoint text="Verified student profiles with academic records" />
                <CheckPoint text="Direct messaging and interview scheduling tools" />
              </div>
              <Link
                href="/register?role=employer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0F172A',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 15,
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                Post a job today
                <div style={{ width: 16, height: 16 }}>
                  <Icons.ArrowRight />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ UNIVERSITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="universities" style={{ background: '#F8FAFC', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FEF9C3',
                color: '#92400E',
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
                border: '1px solid #FDE68A',
              }}
            >
              <div style={{ width: 14, height: 14 }}>
                <Icons.School />
              </div>
              For Universities
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-1px',
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              Strategic insight into your
              <br />
              students career readiness
            </h2>
            <p
              style={{
                color: '#64748B',
                fontSize: 17,
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Advisors and Department Heads get AI analytics, skill heatmaps, and readiness
              dashboards across their entire cohort.
            </p>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="features-grid"
          >
            {[
              {
                Icon: Icons.BarChart,
                title: 'Readiness Dashboard',
                accent: '#2563EB',
                bg: '#EFF6FF',
                desc: 'See exactly which percentage of your cohort is ready, partially ready, or not ready for internships this semester.',
              },
              {
                Icon: Icons.Map,
                title: 'Skill Heatmap',
                accent: '#D97706',
                bg: '#FFF7ED',
                desc: 'Instantly identify the most common skill gaps across your department. Align curriculum to what employers actually need.',
              },
              {
                Icon: Icons.ClipboardList,
                title: 'Advisor Reports',
                accent: '#9333EA',
                bg: '#FDF4FF',
                desc: 'Generate per-student PDF reports with AI training plans, skill gap analysis, and opportunity score trend data.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="landing-feature-card"
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '32px 28px',
                  border: '1px solid #E2E8F0',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: f.bg,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: f.accent,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ width: 26, height: 26 }}>
                    <f.Icon />
                  </div>
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                    marginBottom: 12,
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ TESTIMONIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={{ background: '#fff', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFF1F2',
                color: '#BE123C',
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
                border: '1px solid #FECDD3',
              }}
            >
              Student Stories
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-1px',
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              What students are saying
            </h2>
            <p
              style={{
                color: '#64748B',
                fontSize: 17,
                maxWidth: 480,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Real stories from students who landed internships using Nextern.
            </p>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="features-grid"
          >
            <TestimonialCard
              name="Samia Rahman"
              role="CS Student"
              uni="BRAC University"
              initials="SR"
              color="#2563EB"
              text="Nextern showed me exactly why I kept getting rejected. Within 3 weeks of following the AI-suggested path, my fit score jumped from 55% to 88% and I landed a role at ShurjoPay."
            />
            <TestimonialCard
              name="Arman Khan"
              role="EEE Student"
              uni="NSU"
              initials="AK"
              color="#7C3AED"
              text="The graduation report feature is incredible. I shared it directly with 3 recruiters and got interview calls from all three. It feels like a verified LinkedIn but smarter."
            />
            <TestimonialCard
              name="Nadia Hossain"
              role="BBA Student"
              uni="IBA, DU"
              initials="NH"
              color="#059669"
              text="I thought the AI suggestions would be generic, but they were spot-on. It recommended specific free Coursera courses and I completed them in two weeks. Life-changing platform."
            />
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        style={{
          background: '#172033',
          padding: '96px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 700,
            height: 700,
            background: 'rgba(37,99,235,0.1)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: '10%',
            width: 400,
            height: 400,
            background: 'rgba(8,145,178,0.07)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '0 24px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: 999,
              padding: '7px 16px',
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22D3EE',
                boxShadow: '0 0 8px #22D3EE',
              }}
            />
            <span style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600 }}>
              Free to start, always
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              fontWeight: 900,
              color: '#F8FAFC',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-1.2px',
              marginBottom: 18,
              lineHeight: 1.08,
            }}
          >
            Ready to find your first internship?
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 18, marginBottom: 44, lineHeight: 1.7 }}>
            Join 2,400+ students already using Nextern to land internships at top BD companies.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
            <Link
              href="/register"
              style={{
                background: '#2563EB',
                color: '#fff',
                padding: '16px 36px',
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 800,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 8px 32px rgba(37,99,235,0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Create free account
              <div style={{ width: 18, height: 18 }}>
                <Icons.ArrowRight />
              </div>
            </Link>
            <Link
              href="/register?role=employer"
              style={{
                background: 'rgba(255,255,255,0.09)',
                color: '#E2E8F0',
                padding: '16px 36px',
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                border: '1px solid rgba(255,255,255,0.14)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ width: 18, height: 18 }}>
                <Icons.Building />
              </div>
              Post a job
            </Link>
          </div>

          {/* Trust row */}
          <div
            style={{
              marginTop: 48,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 32,
            }}
          >
            {[
              { icon: Icons.Shield, text: 'No credit card required' },
              { icon: Icons.CheckCircle, text: 'Set up in under 5 minutes' },
              { icon: Icons.Users, text: '2,400+ students trusted us' },
            ].map((item) => (
              <div
                key={item.text}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B' }}
              >
                <div style={{ width: 16, height: 16, color: '#475569' }}>
                  <item.icon />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ RESPONSIVE STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
          .split-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .landing-nav-inner { padding: 0 16px !important; }
          .landing-get-started { display: none !important; }
          .landing-hero { padding: 72px 0 88px !important; }
          .hero-copy { width: 100% !important; min-width: 0 !important; }
          .hero-badge { max-width: 100% !important; }
          .hero-heading { font-size: 34px !important; letter-spacing: -1px !important; }
          .hero-actions { flex-direction: column !important; align-items: stretch !important; }
          .hero-actions > a { justify-content: center !important; }
          .hero-social-proof { align-items: flex-start !important; }
          .hero-social-proof > div:last-child { min-width: 0 !important; }
        }
        .landing-nav-link:hover { color: #fff !important; }
        .landing-feature-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}
