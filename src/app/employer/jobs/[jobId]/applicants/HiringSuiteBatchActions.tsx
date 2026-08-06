'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ClipboardCheck, Crown, Loader2, Sparkles, Video } from 'lucide-react';
import { dhakaDateTimeInputToISOString } from '@/lib/datetime';

type SelectedApplication = {
  _id: string;
  status: string;
  student: {
    name: string;
    university: string;
  };
};

type AssessmentOption = {
  _id: string;
  title: string;
  dueAt?: string | null;
  summary?: {
    assigned?: number;
    submitted?: number;
    graded?: number;
  };
};

type Props = {
  jobId: string;
  selectedApplications: SelectedApplication[];
};

function cardStyle(accent: string) {
  return {
    background: '#fff',
    borderRadius: 20,
    border: `1px solid ${accent}33`,
    boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
    overflow: 'hidden',
  } as const;
}

const fieldStyle = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 12,
  border: '1px solid #D9E2EC',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: 13,
  outline: 'none',
} as const;

export default function HiringSuiteBatchActions({ jobId, selectedApplications }: Props) {
  const [assessmentOptions, setAssessmentOptions] = useState<AssessmentOption[]>([]);
  const [assessmentId, setAssessmentId] = useState('');
  const [assessmentDueAt, setAssessmentDueAt] = useState('');
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [interviewTitle, setInterviewTitle] = useState('Live interview session');
  const [interviewDescription, setInterviewDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [interviewMode, setInterviewMode] = useState<'one_on_one' | 'panel'>('one_on_one');
  const [panelistsText, setPanelistsText] = useState('');

  const selectedIds = useMemo(
    () => selectedApplications.map((application) => application._id),
    [selectedApplications]
  );

  useEffect(() => {
    let ignore = false;

    async function loadAssessments() {
      try {
        const res = await fetch(`/api/assessments?jobId=${jobId}`, { cache: 'no-store' });
        const data = (await res.json()) as { assessments?: AssessmentOption[] };
        if (!ignore) {
          setAssessmentOptions(data.assessments ?? []);
        }
      } catch {
        if (!ignore) {
          setAssessmentOptions([]);
        }
      }
    }

    loadAssessments();
    return () => {
      ignore = true;
    };
  }, [jobId]);

  async function handleSendAssessment() {
    if (!assessmentId || selectedIds.length === 0) return;
    setAssessmentLoading(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          applicationIds: selectedIds,
          dueAt: dhakaDateTimeInputToISOString(assessmentDueAt) ?? undefined,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotice({
          tone: 'error',
          text: data.error ?? 'Unable to send the selected assessment right now.',
        });
        return;
      }

      setNotice({
        tone: 'success',
        text: `Assessment sent to ${selectedIds.length} selected candidate${selectedIds.length > 1 ? 's' : ''}.`,
      });
      window.setTimeout(() => window.location.reload(), 900);
    } catch {
      setNotice({
        tone: 'error',
        text: 'Network error while sending the assessment. Please try again.',
      });
    } finally {
      setAssessmentLoading(false);
    }
  }

  async function handleScheduleInterview() {
    if (!scheduledAt || selectedIds.length === 0) return;
    setInterviewLoading(true);
    setNotice(null);

    try {
      const panelists = panelistsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, email] = line.split(',').map((part) => part.trim());
          return { name, email: email || undefined };
        })
        .filter((panelist) => panelist.name);

      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedIds,
          title: interviewTitle,
          description: interviewDescription || undefined,
          mode: interviewMode,
          scheduledAt: dhakaDateTimeInputToISOString(scheduledAt) ?? undefined,
          durationMinutes: Number(durationMinutes) || 45,
          panelists,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotice({
          tone: 'error',
          text: data.error ?? 'Unable to schedule the interview session right now.',
        });
        return;
      }

      setNotice({
        tone: 'success',
        text: `Interview scheduled for ${selectedIds.length} selected candidate${selectedIds.length > 1 ? 's' : ''}.`,
      });
      window.setTimeout(() => window.location.reload(), 900);
    } catch {
      setNotice({
        tone: 'error',
        text: 'Network error while scheduling the interview. Please try again.',
      });
    } finally {
      setInterviewLoading(false);
    }
  }

  const selectionLabel =
    selectedApplications.length === 0
      ? 'Select applicants below to unlock batch assessment and interview actions.'
      : `${selectedApplications.length} candidate${selectedApplications.length > 1 ? 's' : ''} selected`;

  return (
    <section
      className="hiring-suite-batch-grid"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}
    >
      <div style={cardStyle('#2563EB')}>
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #DBEAFE',
            background: '#EFF6FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <ClipboardCheck size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Assessment dispatch
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: '#64748B' }}>{selectionLabel}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              fontSize: 12,
              color: '#475569',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                padding: '5px 10px',
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                fontWeight: 800,
              }}
            >
              <Crown size={13} />
              Premium Required
            </span>
            <span>
              Send a custom assessment and automatically move the applicants to Assessment Sent.
            </span>
          </div>

          <label style={{ display: 'grid', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              Choose assessment
            </span>
            <select
              value={assessmentId}
              onChange={(event) => setAssessmentId(event.target.value)}
              style={fieldStyle}
            >
              <option value="">Select an existing assessment</option>
              {assessmentOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.title}
                  {option.summary?.assigned ? ` • ${option.summary.assigned} assigned` : ''}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              Due date and time
            </span>
            <input
              type="datetime-local"
              value={assessmentDueAt}
              onChange={(event) => setAssessmentDueAt(event.target.value)}
              style={fieldStyle}
            />
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSendAssessment}
              disabled={!assessmentId || selectedIds.length === 0 || assessmentLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background:
                  !assessmentId || selectedIds.length === 0 || assessmentLoading
                    ? '#E2E8F0'
                    : '#2563EB',
                color:
                  !assessmentId || selectedIds.length === 0 || assessmentLoading
                    ? '#64748B'
                    : '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '11px 15px',
                fontSize: 13,
                fontWeight: 800,
                cursor:
                  !assessmentId || selectedIds.length === 0 || assessmentLoading
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {assessmentLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              {assessmentLoading ? 'Sending assessment...' : 'Send to selected'}
            </button>

            <Link
              href={`/employer/assessments?jobId=${jobId}${selectedIds.length ? `&applicationIds=${selectedIds.join(',')}` : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFFFF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                borderRadius: 14,
                padding: '11px 15px',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <ClipboardCheck size={15} />
              Build new assessment
            </Link>
          </div>

          {assessmentOptions.length === 0 ? (
            <div
              style={{
                borderRadius: 14,
                border: '1px dashed #BFDBFE',
                background: '#F8FBFF',
                padding: '12px 14px',
                color: '#475569',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              No assessments created for this job yet. Use the builder to create MCQ, short answer,
              coding, or case-study evaluations first.
            </div>
          ) : null}
        </div>
      </div>

      <div style={cardStyle('#7C3AED')}>
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #E9D5FF',
            background: '#F5F3FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Video size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Interview scheduling
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: '#64748B' }}>
                Schedule 1:1 or panel interviews and push them into the student calendar
                automatically.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Session title</span>
              <input
                value={interviewTitle}
                onChange={(event) => setInterviewTitle(event.target.value)}
                style={fieldStyle}
                placeholder="Technical panel interview"
              />
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Mode</span>
              <select
                value={interviewMode}
                onChange={(event) => setInterviewMode(event.target.value as 'one_on_one' | 'panel')}
                style={fieldStyle}
              >
                <option value="one_on_one">One-on-one</option>
                <option value="panel">Panel</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Date and time</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                style={fieldStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Duration</span>
              <input
                type="number"
                min={15}
                max={240}
                step={5}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                style={fieldStyle}
              />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Interview brief</span>
            <textarea
              value={interviewDescription}
              onChange={(event) => setInterviewDescription(event.target.value)}
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical', minHeight: 88 }}
              placeholder="Share what the candidate should prepare, what you plan to evaluate, and any joining expectations."
            />
          </label>

          {interviewMode === 'panel' ? (
            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Panel members</span>
              <textarea
                value={panelistsText}
                onChange={(event) => setPanelistsText(event.target.value)}
                rows={3}
                style={{ ...fieldStyle, resize: 'vertical', minHeight: 88 }}
                placeholder={
                  'One person per line\nHiring Manager, manager@nextern.com\nLead Engineer, lead@nextern.com'
                }
              />
            </label>
          ) : null}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleScheduleInterview}
              disabled={!scheduledAt || selectedIds.length === 0 || interviewLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background:
                  !scheduledAt || selectedIds.length === 0 || interviewLoading
                    ? '#E2E8F0'
                    : '#7C3AED',
                color:
                  !scheduledAt || selectedIds.length === 0 || interviewLoading
                    ? '#64748B'
                    : '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '11px 15px',
                fontSize: 13,
                fontWeight: 800,
                cursor:
                  !scheduledAt || selectedIds.length === 0 || interviewLoading
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {interviewLoading ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <CalendarClock size={15} />
              )}
              {interviewLoading ? 'Scheduling...' : 'Schedule interview'}
            </button>

            <Link
              href={`/employer/interviews?jobId=${jobId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFFFF',
                color: '#7C3AED',
                border: '1px solid #DDD6FE',
                borderRadius: 14,
                padding: '11px 15px',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Video size={15} />
              Open interview suite
            </Link>
          </div>
        </div>
      </div>

      {notice ? (
        <div
          style={{
            gridColumn: '1 / -1',
            borderRadius: 16,
            padding: '12px 16px',
            background: notice.tone === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: notice.tone === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${notice.tone === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {selectedApplications.slice(0, 6).map((application) => (
          <span
            key={application._id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: '6px 10px',
              background: '#FFFFFF',
              color: '#334155',
              border: '1px solid #E2E8F0',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {application.student.name}
            {application.student.university ? ` • ${application.student.university}` : ''}
          </span>
        ))}
        {selectedApplications.length > 6 ? (
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
            +{selectedApplications.length - 6} more selected
          </span>
        ) : null}
      </div>

      <style>{`
        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1040px) {
          .hiring-suite-batch-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
