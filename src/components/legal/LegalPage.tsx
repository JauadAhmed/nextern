import Link from 'next/link';
import { NexternLogo } from '@/components/brand/NexternLogo';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export function LegalPage({
  title,
  introduction,
  sections,
}: {
  title: string;
  introduction: string;
  sections: LegalSection[];
}) {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', padding: '28px 18px 72px' }}>
      <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>
        <nav
          aria-label="Legal page navigation"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Link href="/" aria-label="Nextern home">
            <NexternLogo textColor="#0F172A" />
          </Link>
          <Link href="/login" style={{ color: '#2563EB', fontSize: 14, fontWeight: 700 }}>
            Sign in
          </Link>
        </nav>

        <article
          style={{
            marginTop: 28,
            padding: 'clamp(24px, 5vw, 52px)',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 18,
            boxShadow: '0 16px 45px rgba(15, 23, 42, 0.07)',
          }}
        >
          <p style={{ margin: 0, color: '#2563EB', fontSize: 12, fontWeight: 800 }}>
            EFFECTIVE 6 AUGUST 2026
          </p>
          <h1
            style={{
              margin: '10px 0 12px',
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(30px, 5vw, 44px)',
            }}
          >
            {title}
          </h1>
          <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.8 }}>{introduction}</p>

          {sections.map((section) => (
            <section key={section.heading} style={{ marginTop: 30 }}>
              <h2
                style={{
                  margin: '0 0 10px',
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                  fontSize: 21,
                }}
              >
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  style={{ margin: '8px 0', color: '#475569', fontSize: 15, lineHeight: 1.8 }}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <p style={{ margin: '34px 0 0', color: '#64748B', fontSize: 14 }}>
            Questions may be sent to{' '}
            <a href="mailto:support@nextern.app" style={{ color: '#2563EB', fontWeight: 700 }}>
              support@nextern.app
            </a>
            .
          </p>
        </article>
      </div>
    </main>
  );
}
