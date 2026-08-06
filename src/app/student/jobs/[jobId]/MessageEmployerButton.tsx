'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ShieldAlert, X } from 'lucide-react';

const ELIGIBLE_STATUSES = ['shortlisted', 'assessment_sent', 'interview_scheduled', 'hired'];

export default function MessageEmployerButton({
  employerId,
  applicationStatus,
}: {
  employerId: string;
  applicationStatus: string | null;
}) {
  const [showWarning, setShowWarning] = useState(false);
  const isEligible = applicationStatus ? ELIGIBLE_STATUSES.includes(applicationStatus) : false;

  if (isEligible) {
    return (
      <Link
        href={`/student/messages?user=${employerId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          background: '#7C3AED',
          color: '#fff',
          padding: '9px 18px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
          transition: 'all 0.15s',
        }}
      >
        <MessageCircle size={14} /> Message Employer
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowWarning(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          background: 'rgba(255,255,255,0.08)',
          color: '#94A3B8',
          padding: '9px 18px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <MessageCircle size={14} /> Message Employer
      </button>

      {showWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowWarning(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '32px 36px',
              maxWidth: 420,
              width: '90vw',
              boxShadow: '0 32px 80px rgba(15,23,42,0.22)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#F1F5F9',
                border: 'none',
                borderRadius: 8,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={16} />
            </button>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#D97706',
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                margin: '0 0 8px',
              }}
            >
              Not eligible to message yet
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: '0 0 20px' }}>
              You can message the employer once your application status reaches{' '}
              <strong style={{ color: '#0F172A' }}>Shortlisted</strong>,{' '}
              <strong style={{ color: '#0F172A' }}>Assessment Sent</strong>,{' '}
              <strong style={{ color: '#0F172A' }}>Interview Scheduled</strong>, or{' '}
              <strong style={{ color: '#0F172A' }}>Hired</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              style={{
                background: '#0F172A',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
