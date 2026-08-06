'use client';

import { useState } from 'react';
import { Rocket, CalendarDays } from 'lucide-react';

export default function JobApplyButton({
  jobId,
  jobType,
  hasApplied,
  isActive,
  isExpired,
}: {
  jobId: string;
  jobType: string;
  hasApplied: boolean;
  isActive: boolean;
  isExpired: boolean;
}) {
  const [applied, setApplied] = useState(hasApplied);
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEvent = jobType === 'webinar' || jobType === 'workshop';

  async function handleApply() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEvent ? 'Failed to register' : 'Failed to apply'));
        return;
      }
      setApplied(true);
      setShowModal(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <div
        style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 12,
          padding: '12px 20px',
          color: '#065F46',
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        {isEvent ? '✓ Registered for event' : '✓ Application submitted'}
      </div>
    );
  }

  if (!isActive || isExpired) {
    return (
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '12px 20px',
          color: '#94A3B8',
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {isExpired ? (isEvent ? 'Registration closed' : 'Deadline passed') : 'Listing closed'}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isEvent ? '#7C3AED' : '#2563EB',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '13px 24px',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          boxShadow: isEvent ? '0 4px 16px rgba(124,58,237,0.4)' : '0 4px 16px rgba(37,99,235,0.4)',
        }}
      >
        {isEvent ? (
          <>
            <CalendarDays size={16} /> Register for Event
          </>
        ) : (
          <>
            <Rocket size={16} /> Apply Now
          </>
        )}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                marginBottom: 6,
              }}
            >
              {isEvent ? 'Register for Event' : 'Submit Application'}
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>
              {isEvent
                ? 'Confirm your registration. Event details will be sent to your email.'
                : 'Your profile resume will be automatically attached.'}
            </p>
            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#991B1B',
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {!isEvent && (
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: 7,
                  }}
                >
                  Cover Letter <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder="Introduce yourself and explain why you are a great fit…"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    resize: 'vertical',
                    color: '#0F172A',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={loading}
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '12px',
                  background: loading ? '#93C5FD' : isEvent ? '#7C3AED' : '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {loading ? (
                  isEvent ? (
                    'Registering…'
                  ) : (
                    'Submitting…'
                  )
                ) : isEvent ? (
                  <>
                    <CalendarDays size={14} /> Confirm Registration
                  </>
                ) : (
                  <>
                    <Rocket size={14} /> Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
