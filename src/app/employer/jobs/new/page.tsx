'use client';
// src/app/employer/jobs/new/page.tsx
// Multi-step job creation form — 4 steps, uses brand colors

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EmployerClientShell from '@/components/employer/EmployerClientShell';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronRight,
  ChevronLeft,
  Layers3,
  Rocket,
  Sparkles,
  Target,
  Users2,
} from 'lucide-react';

const C = {
  blue: '#2563EB',
  indigo: '#1E293B',
  cyan: '#22D3EE',
  bg: '#F1F5F9',
  gray: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#fff',
  dark: '#0F172A',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#374151',
  light: '#94A3B8',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warnBg: '#FFFBEB',
  warnBorder: '#FDE68A',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
};

const BD_UNIS = [
  'BRAC University',
  'North South University (NSU)',
  'AIUB',
  'Independent University Bangladesh (IUB)',
  'East West University (EWU)',
  'Daffodil International University (DIU)',
  'ULAB',
  'United International University (UIU)',
  'KUET',
  'RUET',
  'CUET',
  'BUET',
  'SUST',
  'Dhaka University (DU)',
  'IUT',
];
const BD_DEPTS = [
  'CSE',
  'EEE',
  'BBA',
  'MBA',
  'ECE',
  'Civil',
  'Architecture',
  'Pharmacy',
  'Law',
  'English',
  'Economics',
  'Finance',
  'Marketing',
  'Accounting',
];

const inputBase: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  color: C.text,
  background: C.white,
};

function Field({
  label,
  required = true,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 7 }}
      >
        {label}
        {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 5,
            color: C.danger,
            fontSize: 12,
          }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.light,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 18,
        paddingBottom: 10,
        borderBottom: `1px solid ${C.bg}`,
      }}
    >
      {label}
    </div>
  );
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }
  return (
    <Field label={label} required={false}>
      <div
        style={{
          border: `1.5px solid ${C.border}`,
          borderRadius: 10,
          padding: '8px 10px',
          background: C.white,
          minHeight: 46,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: tags.length > 0 ? 8 : 0,
          }}
        >
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: C.blueBg,
                color: C.blue,
                border: `1px solid ${C.blueBorder}`,
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.blue,
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={placeholder ?? 'Type and press Enter'}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: C.text,
              background: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={add}
            style={{
              background: C.blueBg,
              color: C.blue,
              border: 'none',
              borderRadius: 7,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Field>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Field label={label} required={false}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(on ? selected.filter((x) => x !== opt) : [...selected, opt])}
              style={{
                padding: '6px 13px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: `1.5px solid ${on ? C.blue : C.border}`,
                background: on ? C.blueBg : C.white,
                color: on ? C.blue : C.gray,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

function normalizeCgpaInput(value: string) {
  if (!value) return '';
  const sanitized = value.replace(/[^\d.]/g, '');
  if (!/^\d*(\.\d{0,2})?$/.test(sanitized)) return null;
  const numeric = Number(sanitized);
  if (Number.isNaN(numeric)) return sanitized;
  return numeric > 4 ? '4.00' : sanitized;
}

function formatSelectionSummary(items: string[], emptyLabel = 'All') {
  if (items.length === 0) return emptyLabel;
  if (items.length <= 3) return items.join(', ');
  return `${items.slice(0, 3).join(', ')} +${items.length - 3} more`;
}

function ModeCard({
  active,
  title,
  description,
  meta,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  meta: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 18,
        border: `1.5px solid ${active ? C.blueBorder : C.border}`,
        background: active ? '#EFF6FF' : '#FFFFFF',
        padding: '18px 18px 16px',
        cursor: 'pointer',
        boxShadow: active ? '0 16px 28px rgba(37,99,235,0.12)' : '0 6px 14px rgba(15,23,42,0.04)',
        transition: 'all 0.18s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: active ? '#2563EB' : '#F1F5F9',
            color: active ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            minWidth: 0,
            padding: '5px 10px',
            borderRadius: 999,
            background: active ? '#DBEAFE' : '#F8FAFC',
            border: `1px solid ${active ? '#BFDBFE' : '#E2E8F0'}`,
            color: active ? '#1D4ED8' : '#64748B',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.2,
          }}
        >
          {active ? 'Selected' : 'Available'}
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: C.gray, marginBottom: 12 }}>
        {description}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: active ? C.blue : '#475569',
        }}
      >
        {meta}
      </div>
    </button>
  );
}

function MetricTile({
  label,
  value,
  tone = 'blue',
}: {
  label: string;
  value: string;
  tone?: 'blue' | 'cyan' | 'green' | 'amber';
}) {
  const toneMap = {
    blue: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    cyan: { bg: '#ECFEFF', border: '#A5F3FC', color: '#0F766E' },
    green: { bg: '#ECFDF5', border: '#A7F3D0', color: '#047857' },
    amber: { bg: '#FFFBEB', border: '#FDE68A', color: '#B45309' },
  }[tone];

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${toneMap.border}`,
        background: toneMap.bg,
        padding: '14px 15px',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: C.gray, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: toneMap.color,
          marginTop: 6,
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '',
    type: 'internship',
    description: '',
    responsibilities: [] as string[],
    locationType: 'onsite',
    city: '',
    stipendBDT: '',
    isStipendNegotiable: false,
    applicationDeadline: '',
    startDate: '',
    durationMonths: '',
    targetUniversities: [] as string[],
    targetDepartments: [] as string[],
    targetYears: [] as number[],
    isBatchHiring: false,
    batchUniversities: [] as string[],
    requiredSkills: [] as string[],
    minimumCGPA: '',
    requiredCourses: [] as string[],
    experienceExpectations: '',
    preferredCertifications: [] as string[],
    academicSession: '',
    isActive: true,
  });

  function set(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  }

  function setBatchHiringMode(nextValue: boolean) {
    setForm((prev) => {
      if (nextValue === prev.isBatchHiring) return prev;

      if (nextValue) {
        return {
          ...prev,
          isBatchHiring: true,
          batchUniversities:
            prev.batchUniversities.length > 0 ? prev.batchUniversities : prev.targetUniversities,
        };
      }

      return {
        ...prev,
        isBatchHiring: false,
        targetUniversities:
          prev.targetUniversities.length > 0 ? prev.targetUniversities : prev.batchUniversities,
      };
    });

    setErrors((prev) => {
      const next = { ...prev };
      delete next.batchUniversities;
      return next;
    });
  }

  const isEvent = form.type === 'webinar' || form.type === 'workshop';
  const todayDate = toDateInputValue(new Date());
  const effectiveTargetUniversities = form.isBatchHiring
    ? form.batchUniversities
    : form.targetUniversities;
  const selectedDepartmentsLabel = formatSelectionSummary(form.targetDepartments);
  const selectedYearsLabel =
    form.targetYears.length > 0
      ? formatSelectionSummary(form.targetYears.map((year) => `Year ${year}`))
      : 'All years';
  const selectedUniversityCount = effectiveTargetUniversities.length;
  const universityReachPercent = Math.round((selectedUniversityCount / BD_UNIS.length) * 100);
  const batchHiringPresets = [
    {
      label: 'Top private universities',
      values: BD_UNIS.filter((uni) =>
        [
          'BRAC University',
          'North South University (NSU)',
          'AIUB',
          'Independent University Bangladesh (IUB)',
          'East West University (EWU)',
          'Daffodil International University (DIU)',
          'ULAB',
          'United International University (UIU)',
        ].includes(uni)
      ),
    },
    {
      label: 'Engineering-heavy campuses',
      values: BD_UNIS.filter((uni) =>
        ['BUET', 'KUET', 'RUET', 'CUET', 'SUST', 'IUT'].includes(uni)
      ),
    },
    {
      label: 'Dhaka-focused mix',
      values: BD_UNIS.filter((uni) =>
        [
          'BRAC University',
          'North South University (NSU)',
          'AIUB',
          'Independent University Bangladesh (IUB)',
          'East West University (EWU)',
          'ULAB',
          'United International University (UIU)',
          'Dhaka University (DU)',
          'IUT',
        ].includes(uni)
      ),
    },
  ];

  function getValidationErrors(target: 'step1' | 'step3' | 'submit') {
    const errs: Record<string, string> = {};

    if (target === 'step1' || target === 'submit') {
      if (!form.title.trim()) errs.title = 'Title is required';
      if (form.description.length < 20) errs.description = 'At least 20 characters required';

      if (!form.applicationDeadline) {
        errs.applicationDeadline = isEvent
          ? 'Registration deadline is required'
          : 'Deadline is required';
      } else if (form.applicationDeadline < todayDate) {
        errs.applicationDeadline = 'Deadline cannot be earlier than today';
      }

      if (isEvent) {
        if (!form.startDate) {
          errs.startDate = 'Event date is required';
        } else if (form.startDate < form.applicationDeadline) {
          errs.startDate = 'Event date must be on or after the registration deadline';
        }
      } else if (form.startDate && form.startDate < todayDate) {
        errs.startDate = 'Start date cannot be earlier than today';
      }
    }

    if (target === 'step3' || target === 'submit') {
      if (form.minimumCGPA) {
        const cgpa = Number(form.minimumCGPA);
        if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
          errs.minimumCGPA = 'CGPA must stay between 0.00 and 4.00';
        }
      }
    }

    if (target === 'submit' && form.isBatchHiring && form.batchUniversities.length === 0) {
      errs.batchUniversities = 'Select at least one university to launch a batch campaign';
    }

    return errs;
  }

  function validateStep(s: number) {
    const errs: Record<string, string> = {};
    if (s === 1) Object.assign(errs, getValidationErrors('step1'));
    if (s === 2 && form.isBatchHiring && form.batchUniversities.length === 0) {
      errs.batchUniversities = 'Select at least one university to continue with batch hiring';
    }
    if (s === 3) Object.assign(errs, getValidationErrors('step3'));
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((p) => Math.min(4, p + 1));
  }

  async function handleSubmit(isActive: boolean) {
    const errs = getValidationErrors('submit');
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.title || errs.description || errs.applicationDeadline || errs.startDate) {
        setStep(1);
      } else if (errs.batchUniversities) {
        setStep(2);
      } else if (errs.minimumCGPA) {
        setStep(3);
      }
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description,
        responsibilities: form.responsibilities,
        locationType: form.locationType,
        city: form.city || undefined,
        stipendBDT: form.stipendBDT ? parseInt(form.stipendBDT) : undefined,
        isStipendNegotiable: form.isStipendNegotiable,
        applicationDeadline: form.applicationDeadline,
        startDate: form.startDate || undefined,
        durationMonths: form.durationMonths ? parseInt(form.durationMonths) : undefined,
        targetUniversities: effectiveTargetUniversities,
        targetDepartments: form.targetDepartments,
        targetYears: form.targetYears,
        isBatchHiring: form.isBatchHiring,
        batchUniversities: form.batchUniversities,
        requiredSkills: form.requiredSkills,
        minimumCGPA: form.minimumCGPA ? parseFloat(form.minimumCGPA) : undefined,
        requiredCourses: form.requiredCourses,
        experienceExpectations: form.experienceExpectations || undefined,
        preferredCertifications: form.preferredCertifications,
        academicSession: form.academicSession || undefined,
        isActive,
      };
      const res = await fetch('/api/jobs', {
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
          setStep(1);
        } else {
          setError(data.error ?? 'Failed to create job');
        }
        return;
      }
      router.push('/employer/jobs');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const STEPS = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Targeting' },
    { n: 3, label: 'Requirements' },
    { n: 4, label: 'Review' },
  ];

  return (
    <EmployerClientShell>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
        {/* Header */}
        <div
          style={{
            background: C.dark,
            padding: '24px 0 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ marginBottom: 20 }}>
              <Link
                href="/employer/jobs"
                style={{ color: C.gray, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
              >
                ← Back to Jobs
              </Link>
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#F8FAFC',
                fontFamily: 'var(--font-display)',
                marginBottom: 4,
              }}
            >
              Post a New Job
            </h1>
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 28 }}>
              Reach verified students across Bangladesh universities. Your requirement profile feeds
              the AI fit engine.
            </p>

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((s, idx) => (
                <div
                  key={s.n}
                  style={{ display: 'flex', alignItems: 'center', flex: idx < 3 ? 1 : 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        background:
                          s.n < step ? C.success : s.n === step ? C.blue : 'rgba(255,255,255,0.1)',
                        color: s.n <= step ? '#fff' : C.gray,
                        boxShadow: s.n === step ? `0 0 0 4px rgba(37,99,235,0.3)` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {s.n < step ? <CheckCircle2 size={16} /> : s.n}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: s.n === step ? '#E2E8F0' : C.gray,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: s.n < step ? C.success : 'rgba(255,255,255,0.1)',
                        margin: '0 8px',
                        marginBottom: 20,
                        borderRadius: 999,
                        transition: 'background 0.2s',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div style={{ maxWidth: 820, margin: '28px auto', padding: '0 24px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: C.dangerBg,
                border: `1px solid ${C.dangerBorder}`,
                borderRadius: 12,
                padding: '12px 16px',
                color: '#991B1B',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div
            style={{
              background: C.white,
              borderRadius: 20,
              border: `1px solid ${C.border}`,
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* ── STEP 1: Basic Info ── */}
            {step === 1 && (
              <div style={{ padding: '32px 36px' }}>
                <SectionLabel label="Listing Type & Basic Details" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Field label="Listing Type">
                    <div
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}
                    >
                      {[
                        { v: 'internship', l: '🎓 Internship' },
                        { v: 'part-time', l: '⏰ Part-time' },
                        { v: 'full-time', l: '💼 Full-time' },
                        { v: 'campus-drive', l: '🏫 Campus Drive' },
                        { v: 'webinar', l: '🌐 Webinar' },
                        { v: 'workshop', l: '🔧 Workshop' },
                      ].map((t) => (
                        <button
                          key={t.v}
                          type="button"
                          onClick={() => set('type', t.v)}
                          style={{
                            padding: '12px',
                            borderRadius: 12,
                            border: `2px solid ${form.type === t.v ? C.blue : C.border}`,
                            background: form.type === t.v ? C.blueBg : C.white,
                            color: form.type === t.v ? C.blue : C.gray,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Job Title" error={errors.title}>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      placeholder="e.g. Frontend Developer Intern"
                      style={{
                        ...inputBase,
                        borderColor: errors.title ? C.dangerBorder : C.border,
                      }}
                    />
                  </Field>

                  <Field label="Description" error={errors.description}>
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="Describe the role, what the intern will work on, team size, tech stack…"
                      rows={5}
                      style={{
                        ...inputBase,
                        resize: 'vertical',
                        borderColor: errors.description ? C.dangerBorder : C.border,
                      }}
                    />
                  </Field>

                  <TagInput
                    label="Key Responsibilities"
                    tags={form.responsibilities}
                    onChange={(v) => set('responsibilities', v)}
                    placeholder="Add a responsibility and press Enter"
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Work Mode">
                      <select
                        value={form.locationType}
                        onChange={(e) => set('locationType', e.target.value)}
                        style={{ ...inputBase, appearance: 'none' as const }}
                      >
                        <option value="onsite">Onsite</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </Field>
                    <Field label="City / District" required={false}>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set('city', e.target.value)}
                        placeholder="e.g. Dhaka"
                        style={inputBase}
                      />
                    </Field>
                  </div>

                  {!isEvent && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <Field label="Stipend (BDT/month)" required={false}>
                        <input
                          type="number"
                          value={form.stipendBDT}
                          onChange={(e) => set('stipendBDT', e.target.value)}
                          placeholder="e.g. 10000"
                          min="0"
                          style={inputBase}
                        />
                      </Field>
                      <Field label="Duration (months)" required={false}>
                        <input
                          type="number"
                          value={form.durationMonths}
                          onChange={(e) => set('durationMonths', e.target.value)}
                          placeholder="e.g. 3"
                          min="1"
                          max="24"
                          style={inputBase}
                        />
                      </Field>
                      <Field label="Academic Session" required={false}>
                        <input
                          type="text"
                          value={form.academicSession}
                          onChange={(e) => set('academicSession', e.target.value)}
                          placeholder="e.g. Spring 2026"
                          style={inputBase}
                        />
                      </Field>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Application Deadline" error={errors.applicationDeadline}>
                      <input
                        type="date"
                        value={form.applicationDeadline}
                        onChange={(e) => set('applicationDeadline', e.target.value)}
                        min={todayDate}
                        style={{
                          ...inputBase,
                          borderColor: errors.applicationDeadline ? C.dangerBorder : C.border,
                        }}
                      />
                    </Field>
                    <Field
                      label={isEvent ? 'Event Date' : 'Expected Start Date'}
                      required={isEvent}
                      error={errors.startDate}
                    >
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set('startDate', e.target.value)}
                        min={isEvent ? form.applicationDeadline || todayDate : todayDate}
                        style={{
                          ...inputBase,
                          borderColor: errors.startDate ? C.dangerBorder : C.border,
                        }}
                      />
                    </Field>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      color: C.gray,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isStipendNegotiable}
                      onChange={(e) => set('isStipendNegotiable', e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: C.blue }}
                    />
                    Stipend is negotiable
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 2: Targeting ── */}
            {step === 2 && (
              <div style={{ padding: '32px 36px' }}>
                <SectionLabel label="Targeting — Who Should See This?" />
                <p style={{ color: C.gray, fontSize: 14, marginBottom: 24, marginTop: -10 }}>
                  Leave blank to show to all students across all universities and departments.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Batch hiring toggle */}
                  <div
                    style={{
                      display: 'none',
                      background: form.isBatchHiring ? C.blueBg : C.bg,
                      border: `1.5px solid ${form.isBatchHiring ? C.blueBorder : C.border}`,
                      borderRadius: 14,
                      padding: '16px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: form.isBatchHiring ? 20 : 0,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            color: C.text,
                            fontSize: 14,
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          🏭 Batch Hiring Mode
                        </div>
                        <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>
                          Distribute this role across multiple universities simultaneously
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => set('isBatchHiring', !form.isBatchHiring)}
                        style={{
                          width: 48,
                          height: 26,
                          borderRadius: 999,
                          background: form.isBatchHiring ? C.blue : C.border,
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: C.white,
                            position: 'absolute',
                            top: 3,
                            left: form.isBatchHiring ? 25 : 3,
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>
                    </div>
                    {false && form.isBatchHiring && (
                      <ChipGroup
                        label="Select Universities for Batch Hiring"
                        options={BD_UNIS}
                        selected={form.batchUniversities}
                        onChange={(v) => set('batchUniversities', v)}
                      />
                    )}
                  </div>

                  {false && !form.isBatchHiring && (
                    <ChipGroup
                      label="Target Universities (leave blank = all)"
                      options={BD_UNIS}
                      selected={form.targetUniversities}
                      onChange={(v) => set('targetUniversities', v)}
                    />
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 14,
                    }}
                  >
                    <ModeCard
                      active={!form.isBatchHiring}
                      title="Precision targeting"
                      description="Send this role to one campus, a few campuses, or everyone. Great for focused internships and department-specific openings."
                      meta={
                        form.targetUniversities.length > 0
                          ? `${form.targetUniversities.length} universities selected`
                          : 'Open to all universities'
                      }
                      icon={<Target size={18} />}
                      onClick={() => setBatchHiringMode(false)}
                    />
                    <ModeCard
                      active={form.isBatchHiring}
                      title="Batch hiring campaign"
                      description="Launch one shared role across multiple universities, then monitor applicants in one centralized funnel with campus-wise analytics."
                      meta={
                        form.batchUniversities.length > 0
                          ? `${form.batchUniversities.length} campuses in campaign`
                          : 'Select campuses to start'
                      }
                      icon={<Layers3 size={18} />}
                      onClick={() => setBatchHiringMode(true)}
                    />
                  </div>

                  {form.isBatchHiring ? (
                    <div
                      style={{
                        borderRadius: 20,
                        border: `1px solid ${C.blueBorder}`,
                        background: '#EFF6FF',
                        padding: 22,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                        boxShadow: '0 18px 32px rgba(37,99,235,0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ maxWidth: 560 }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              borderRadius: 999,
                              background: '#DBEAFE',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 800,
                              marginBottom: 12,
                            }}
                          >
                            <Sparkles size={14} />
                            Batch hiring mode is on
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              lineHeight: 1.15,
                              fontWeight: 900,
                              color: C.text,
                              fontFamily: 'var(--font-display)',
                              marginBottom: 8,
                            }}
                          >
                            Build one multi-campus campaign instead of duplicate job posts
                          </div>
                          <div style={{ color: C.gray, fontSize: 14, lineHeight: 1.65 }}>
                            Choose the universities below, then apply the same department and year
                            filters across all of them. Students still see a personalized feed while
                            your team reviews everyone in one hiring workspace.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBatchHiringMode(false)}
                          style={{
                            border: `1px solid ${C.border}`,
                            background: C.white,
                            color: C.gray,
                            borderRadius: 999,
                            padding: '9px 14px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Switch to precision mode
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: 12,
                        }}
                      >
                        <MetricTile
                          label="Campuses"
                          value={`${form.batchUniversities.length}/${BD_UNIS.length}`}
                          tone="blue"
                        />
                        <MetricTile
                          label="Departments"
                          value={
                            form.targetDepartments.length > 0
                              ? `${form.targetDepartments.length} selected`
                              : 'All departments'
                          }
                          tone="cyan"
                        />
                        <MetricTile
                          label="Academic years"
                          value={
                            form.targetYears.length > 0
                              ? `${form.targetYears.length} selected`
                              : 'All years'
                          }
                          tone="amber"
                        />
                        <MetricTile label="AI fit engine" value="Connected" tone="green" />
                      </div>

                      <div
                        style={{
                          borderRadius: 16,
                          border: `1px solid ${errors.batchUniversities ? C.dangerBorder : C.border}`,
                          background: C.white,
                          padding: 18,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap',
                            marginBottom: 10,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 15,
                                fontWeight: 800,
                                color: C.text,
                              }}
                            >
                              <Building2 size={16} color={C.blue} />
                              Select campaign universities
                            </div>
                            <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
                              These campuses will receive the same posting, filters, and analytics
                              breakdown.
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => set('batchUniversities', BD_UNIS)}
                              style={{
                                border: `1px solid ${C.border}`,
                                background: '#F8FAFC',
                                color: C.gray,
                                borderRadius: 999,
                                padding: '8px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Select all
                            </button>
                            {batchHiringPresets.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => set('batchUniversities', preset.values)}
                                style={{
                                  border: `1px solid ${C.blueBorder}`,
                                  background: '#F8FBFF',
                                  color: C.blue,
                                  borderRadius: 999,
                                  padding: '8px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {preset.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => set('batchUniversities', [])}
                              style={{
                                border: `1px solid ${C.border}`,
                                background: C.white,
                                color: C.gray,
                                borderRadius: 999,
                                padding: '8px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: 10,
                          }}
                        >
                          {BD_UNIS.map((uni, index) => {
                            const selected = form.batchUniversities.includes(uni);
                            return (
                              <button
                                key={uni}
                                type="button"
                                onClick={() =>
                                  set(
                                    'batchUniversities',
                                    selected
                                      ? form.batchUniversities.filter((item) => item !== uni)
                                      : [...form.batchUniversities, uni]
                                  )
                                }
                                style={{
                                  borderRadius: 16,
                                  border: `1.5px solid ${selected ? C.blueBorder : C.border}`,
                                  background: selected ? '#EFF6FF' : '#FFFFFF',
                                  padding: '14px 14px 13px',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  boxShadow: selected
                                    ? '0 10px 20px rgba(37,99,235,0.08)'
                                    : '0 2px 8px rgba(15,23,42,0.03)',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                    marginBottom: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 9,
                                      background: selected ? C.blue : '#F1F5F9',
                                      color: selected ? '#fff' : '#64748B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {selected ? <Check size={14} /> : index + 1}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 800,
                                      color: selected ? C.blue : '#94A3B8',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {selected ? 'Included' : 'Tap to add'}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    fontWeight: 700,
                                    color: C.text,
                                  }}
                                >
                                  {uni}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {errors.batchUniversities && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              color: C.danger,
                              fontSize: 12,
                              fontWeight: 600,
                              marginTop: 12,
                            }}
                          >
                            <AlertCircle size={13} />
                            {errors.batchUniversities}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          borderRadius: 18,
                          border: `1px solid ${C.border}`,
                          background: '#FFFFFF',
                          padding: 18,
                          display: 'grid',
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                              Campaign delivery preview
                            </div>
                            <div style={{ color: C.gray, fontSize: 13, marginTop: 3 }}>
                              How this role will be distributed once published
                            </div>
                          </div>
                          <div
                            style={{
                              borderRadius: 999,
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              fontSize: 12,
                              fontWeight: 800,
                              padding: '7px 12px',
                            }}
                          >
                            {selectedUniversityCount > 0
                              ? `${universityReachPercent}% campus coverage`
                              : 'No campuses selected yet'}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              borderRadius: 15,
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              padding: 14,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: '#0F172A',
                                fontSize: 13,
                                fontWeight: 800,
                                marginBottom: 6,
                              }}
                            >
                              <Building2 size={14} color={C.blue} />
                              Campus coverage
                            </div>
                            <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.6 }}>
                              {formatSelectionSummary(
                                form.batchUniversities,
                                'Select campuses to begin'
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              borderRadius: 15,
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              padding: 14,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: '#0F172A',
                                fontSize: 13,
                                fontWeight: 800,
                                marginBottom: 6,
                              }}
                            >
                              <Users2 size={14} color="#0F766E" />
                              Student filters
                            </div>
                            <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.6 }}>
                              {selectedDepartmentsLabel} - {selectedYearsLabel}
                            </div>
                          </div>
                          <div
                            style={{
                              borderRadius: 15,
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              padding: 14,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: '#0F172A',
                                fontSize: 13,
                                fontWeight: 800,
                                marginBottom: 6,
                              }}
                            >
                              <Sparkles size={14} color="#047857" />
                              Hiring workflow
                            </div>
                            <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.6 }}>
                              One posting, one deadline, one applicant funnel, plus university-wise
                              analytics inside the hiring panel.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRadius: 20,
                        border: `1px solid ${C.border}`,
                        background: '#FFFFFF',
                        padding: 22,
                        display: 'grid',
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ maxWidth: 540 }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: C.text,
                              fontFamily: 'var(--font-display)',
                              marginBottom: 6,
                            }}
                          >
                            Target a focused audience
                          </div>
                          <div style={{ color: C.gray, fontSize: 14, lineHeight: 1.6 }}>
                            Keep this role tightly scoped to specific universities or leave it open
                            to everyone. Department and year filters still refine visibility.
                          </div>
                        </div>
                        <div
                          style={{
                            borderRadius: 999,
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: C.gray,
                            fontSize: 12,
                            fontWeight: 800,
                            padding: '8px 12px',
                          }}
                        >
                          {selectedUniversityCount > 0
                            ? `${selectedUniversityCount} universities selected`
                            : 'Open to all universities'}
                        </div>
                      </div>

                      <ChipGroup
                        label="Target Universities (leave blank = all)"
                        options={BD_UNIS}
                        selected={form.targetUniversities}
                        onChange={(v) => set('targetUniversities', v)}
                      />

                      <div
                        style={{
                          borderRadius: 16,
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            fontWeight: 800,
                            color: C.text,
                            marginBottom: 6,
                          }}
                        >
                          <Target size={14} color={C.blue} />
                          Audience preview
                        </div>
                        <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.6 }}>
                          Students from{' '}
                          {formatSelectionSummary(form.targetUniversities, 'all universities')} will
                          see this role, then the department and year filters below narrow it
                          further.
                        </div>
                      </div>
                    </div>
                  )}

                  <ChipGroup
                    label="Target Departments (leave blank = all)"
                    options={BD_DEPTS}
                    selected={form.targetDepartments}
                    onChange={(v) => set('targetDepartments', v)}
                  />

                  <Field label="Target Year of Study (leave blank = all)" required={false}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((y) => {
                        const on = form.targetYears.includes(y);
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() =>
                              set(
                                'targetYears',
                                on
                                  ? form.targetYears.filter((x) => x !== y)
                                  : [...form.targetYears, y]
                              )
                            }
                            style={{
                              width: 52,
                              height: 44,
                              borderRadius: 10,
                              border: `1.5px solid ${on ? C.blue : C.border}`,
                              background: on ? C.blueBg : C.white,
                              color: on ? C.blue : C.gray,
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: 'pointer',
                            }}
                          >
                            Y{y}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 3: Requirements ── */}
            {step === 3 && (
              <div style={{ padding: '32px 36px' }}>
                <SectionLabel label="Internship Requirement Profile" />
                <div
                  style={{
                    background: C.blueBg,
                    border: `1px solid ${C.blueBorder}`,
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 24,
                    marginTop: -8,
                  }}
                >
                  <p style={{ color: C.blue, fontSize: 13, margin: 0, fontWeight: 600 }}>
                    💡 This data feeds directly into Sabbir&apos;s AI Skill Gap & Fit Scoring engine
                    (Module 2).
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <TagInput
                    label="Required Skills"
                    tags={form.requiredSkills}
                    onChange={(v) => set('requiredSkills', v)}
                    placeholder="e.g. React.js, Python — press Enter"
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="CGPA (on scale of 4)" required={false} error={errors.minimumCGPA}>
                      <input
                        type="number"
                        value={form.minimumCGPA}
                        onChange={(e) => {
                          const nextValue = normalizeCgpaInput(e.target.value);
                          if (nextValue !== null) set('minimumCGPA', nextValue);
                        }}
                        placeholder="0.00"
                        min="0"
                        max="4"
                        step="0.01"
                        style={inputBase}
                      />
                    </Field>
                    <Field label="Experience Expectations" required={false}>
                      <input
                        type="text"
                        value={form.experienceExpectations}
                        onChange={(e) => set('experienceExpectations', e.target.value)}
                        placeholder="e.g. No experience needed"
                        style={inputBase}
                      />
                    </Field>
                  </div>

                  <TagInput
                    label="Required Completed Courses"
                    tags={form.requiredCourses}
                    onChange={(v) => set('requiredCourses', v)}
                    placeholder="e.g. CSE110, CSE220 — press Enter"
                  />

                  <TagInput
                    label="Preferred Certifications"
                    tags={form.preferredCertifications}
                    onChange={(v) => set('preferredCertifications', v)}
                    placeholder="e.g. AWS Cloud, Meta React — press Enter"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ── */}
            {step === 4 && (
              <div style={{ padding: '32px 36px' }}>
                <SectionLabel label="Review & Publish" />
                <div
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${form.isBatchHiring ? C.blueBorder : C.border}`,
                    background: form.isBatchHiring ? '#172033' : '#FFFFFF',
                    padding: '20px 22px',
                    marginBottom: 22,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 0.8,
                          textTransform: 'uppercase',
                          color: form.isBatchHiring ? '#93C5FD' : '#64748B',
                          marginBottom: 8,
                        }}
                      >
                        Campaign snapshot
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          lineHeight: 1.15,
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          color: form.isBatchHiring ? '#FFFFFF' : C.text,
                          marginBottom: 8,
                        }}
                      >
                        {form.isBatchHiring
                          ? 'Batch hiring campaign ready'
                          : 'Targeted listing ready'}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: form.isBatchHiring ? '#DBEAFE' : C.gray,
                          maxWidth: 560,
                        }}
                      >
                        {form.isBatchHiring
                          ? `This posting will launch across ${selectedUniversityCount || 0} universities with one shared role and a centralized applicant funnel.`
                          : 'This posting will appear in the student feed for the universities, departments, and years selected below.'}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 10,
                        width: '100%',
                        maxWidth: 360,
                      }}
                    >
                      <div
                        style={{
                          borderRadius: 14,
                          padding: '12px 14px',
                          background: form.isBatchHiring ? 'rgba(255,255,255,0.1)' : '#EFF6FF',
                          border: form.isBatchHiring
                            ? '1px solid rgba(255,255,255,0.14)'
                            : '1px solid #BFDBFE',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: form.isBatchHiring ? '#BFDBFE' : '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          Universities
                        </div>
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 18,
                            fontWeight: 900,
                            color: form.isBatchHiring ? '#FFFFFF' : '#1D4ED8',
                          }}
                        >
                          {selectedUniversityCount > 0 ? selectedUniversityCount : 'All'}
                        </div>
                      </div>
                      <div
                        style={{
                          borderRadius: 14,
                          padding: '12px 14px',
                          background: form.isBatchHiring ? 'rgba(255,255,255,0.1)' : '#ECFDF5',
                          border: form.isBatchHiring
                            ? '1px solid rgba(255,255,255,0.14)'
                            : '1px solid #A7F3D0',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: form.isBatchHiring ? '#BFDBFE' : '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          Departments
                        </div>
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 18,
                            fontWeight: 900,
                            color: form.isBatchHiring ? '#FFFFFF' : '#047857',
                          }}
                        >
                          {form.targetDepartments.length > 0
                            ? form.targetDepartments.length
                            : 'All'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}
                >
                  {[
                    { l: 'Title', v: form.title },
                    { l: 'Type', v: form.type },
                    { l: 'Location', v: `${form.city || 'TBD'} (${form.locationType})` },
                    { l: 'Deadline', v: form.applicationDeadline },
                    {
                      l: 'Stipend',
                      v: form.stipendBDT
                        ? `৳${parseInt(form.stipendBDT).toLocaleString()}/mo`
                        : form.isStipendNegotiable
                          ? 'Negotiable'
                          : '—',
                    },
                    {
                      l: 'Duration',
                      v: form.durationMonths ? `${form.durationMonths} months` : '—',
                    },
                    {
                      l: 'Batch Hiring',
                      v: form.isBatchHiring
                        ? `Yes - ${form.batchUniversities.length} universities`
                        : 'No',
                    },
                    {
                      l: 'Campaign Universities',
                      v: formatSelectionSummary(
                        form.isBatchHiring ? form.batchUniversities : form.targetUniversities,
                        'All'
                      ),
                    },
                    {
                      l: 'Required Skills',
                      v: form.requiredSkills.length > 0 ? form.requiredSkills.join(', ') : '—',
                    },
                    { l: 'Min CGPA', v: form.minimumCGPA || '—' },
                    {
                      l: 'Target Universities',
                      v:
                        effectiveTargetUniversities.length > 0
                          ? effectiveTargetUniversities.slice(0, 3).join(', ') +
                            (effectiveTargetUniversities.length > 3
                              ? ` +${effectiveTargetUniversities.length - 3}`
                              : '')
                          : 'All',
                    },
                    {
                      l: 'Target Departments',
                      v:
                        form.targetDepartments.length > 0
                          ? form.targetDepartments.join(', ')
                          : 'All',
                    },
                  ].map((row) => (
                    <div
                      key={row.l}
                      style={{
                        display: 'flex',
                        gap: 16,
                        padding: '11px 14px',
                        background: C.bg,
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 160,
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.gray,
                        }}
                      >
                        {row.l}
                      </div>
                      <div style={{ fontSize: 13, color: C.text, wordBreak: 'break-word' }}>
                        {row.v}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    background: C.successBg,
                    border: `1px solid ${C.successBorder}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14, marginBottom: 3 }}>
                    Ready to publish
                  </div>
                  <div style={{ color: C.gray, fontSize: 13 }}>
                    This job will be immediately visible to matching students once published.
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div
              style={{
                borderTop: `1px solid ${C.bg}`,
                padding: '20px 36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAFBFC',
              }}
            >
              <button
                onClick={() => setStep((p) => Math.max(1, p - 1))}
                disabled={step === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 20px',
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 10,
                  background: C.white,
                  color: step === 1 ? C.light : C.gray,
                  cursor: step === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                {step < 4 ? (
                  <button
                    onClick={next}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 24px',
                      background: C.blue,
                      color: C.white,
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                    }}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubmit(false)}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        border: `1.5px solid ${C.border}`,
                        borderRadius: 10,
                        background: C.white,
                        color: C.gray,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => handleSubmit(true)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 28px',
                        background: loading ? '#93C5FD' : C.blue,
                        color: C.white,
                        border: 'none',
                        borderRadius: 10,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.35)',
                      }}
                    >
                      <Rocket size={15} /> {loading ? 'Publishing…' : 'Publish Job'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployerClientShell>
  );
}
