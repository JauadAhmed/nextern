'use client';
// src/app/employer/jobs/[jobId]/edit/page.tsx
// Edit existing job — pre-fills form with current job data

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import EmployerClientShell from '@/components/employer/EmployerClientShell';
import { CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';

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

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
  const isEvent = form.type === 'webinar' || form.type === 'workshop';
  const todayDate = toDateInputValue(new Date());
  const effectiveTargetUniversities = form.isBatchHiring
    ? form.batchUniversities
    : form.targetUniversities;

  // Load existing job data
  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        const j = data.job;
        if (!j) return;
        setForm({
          title: j.title ?? '',
          type: j.type ?? 'internship',
          description: j.description ?? '',
          responsibilities: j.responsibilities ?? [],
          locationType: j.locationType ?? 'onsite',
          city: j.city ?? '',
          stipendBDT: j.stipendBDT?.toString() ?? '',
          isStipendNegotiable: j.isStipendNegotiable ?? false,
          applicationDeadline: j.applicationDeadline
            ? new Date(j.applicationDeadline).toISOString().split('T')[0]
            : '',
          startDate: j.startDate ? new Date(j.startDate).toISOString().split('T')[0] : '',
          durationMonths: j.durationMonths?.toString() ?? '',
          targetUniversities: j.targetUniversities ?? [],
          targetDepartments: j.targetDepartments ?? [],
          targetYears: j.targetYears ?? [],
          isBatchHiring: j.isBatchHiring ?? false,
          batchUniversities: j.batchUniversities ?? [],
          requiredSkills: j.requiredSkills ?? [],
          minimumCGPA: j.minimumCGPA?.toString() ?? '',
          requiredCourses: j.requiredCourses ?? [],
          experienceExpectations: j.experienceExpectations ?? '',
          preferredCertifications: j.preferredCertifications ?? [],
          academicSession: j.academicSession ?? '',
          isActive: j.isActive ?? true,
        });
      })
      .catch(() => setError('Failed to load job data'))
      .finally(() => setFetching(false));
  }, [jobId]);

  function set(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  }

  function getValidationErrors() {
    const errs: Record<string, string> = {};

    if (!form.title.trim()) errs.title = 'Title is required';
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

    if (form.minimumCGPA) {
      const cgpa = Number(form.minimumCGPA);
      if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
        errs.minimumCGPA = 'CGPA must stay between 0.00 and 4.00';
      }
    }

    return errs;
  }

  async function handleSubmit() {
    const errs = getValidationErrors();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
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
        isActive: form.isActive,
      };
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update job');
        return;
      }
      router.push('/employer/jobs');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <EmployerClientShell>
        <div
          style={{
            minHeight: '50vh',
            background: C.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ textAlign: 'center', color: C.gray }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: `3px solid ${C.border}`,
                borderTopColor: C.blue,
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Loading job data...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </EmployerClientShell>
    );
  }

  return (
    <EmployerClientShell>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
        {/* Header */}
        <div
          style={{
            background: C.dark,
            padding: '24px 0 28px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ marginBottom: 16 }}>
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
              Edit Job Listing
            </h1>
            <p style={{ color: C.gray, fontSize: 13 }}>
              Update the details below. Changes are saved immediately on publish.
            </p>
          </div>
        </div>

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
            <div
              style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              {/* Basic info */}
              <div>
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
                  Basic Information
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                            padding: '10px',
                            borderRadius: 10,
                            border: `2px solid ${form.type === t.v ? C.blue : C.border}`,
                            background: form.type === t.v ? C.blueBg : C.white,
                            color: form.type === t.v ? C.blue : C.gray,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
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
                      style={inputBase}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      rows={5}
                      style={{ ...inputBase, resize: 'vertical' }}
                    />
                  </Field>
                  <TagInput
                    label="Key Responsibilities"
                    tags={form.responsibilities}
                    onChange={(v) => set('responsibilities', v)}
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
                    <Field label="City" required={false}>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set('city', e.target.value)}
                        style={inputBase}
                      />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <Field label="Stipend (BDT/mo)" required={false}>
                      <input
                        type="number"
                        value={form.stipendBDT}
                        onChange={(e) => set('stipendBDT', e.target.value)}
                        min="0"
                        style={inputBase}
                      />
                    </Field>
                    <Field label="Duration (months)" required={false}>
                      <input
                        type="number"
                        value={form.durationMonths}
                        onChange={(e) => set('durationMonths', e.target.value)}
                        min="1"
                        style={inputBase}
                      />
                    </Field>
                    <Field label="Academic Session" required={false}>
                      <input
                        type="text"
                        value={form.academicSession}
                        onChange={(e) => set('academicSession', e.target.value)}
                        placeholder="Spring 2026"
                        style={inputBase}
                      />
                    </Field>
                  </div>
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
                      label={isEvent ? 'Event Date' : 'Start Date'}
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

              {/* Targeting */}
              <div>
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
                  Targeting
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <ChipGroup
                    label="Target Universities"
                    options={BD_UNIS}
                    selected={form.targetUniversities}
                    onChange={(v) => set('targetUniversities', v)}
                  />
                  <ChipGroup
                    label="Target Departments"
                    options={BD_DEPTS}
                    selected={form.targetDepartments}
                    onChange={(v) => set('targetDepartments', v)}
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
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
                  Requirement Profile
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <TagInput
                    label="Required Skills"
                    tags={form.requiredSkills}
                    onChange={(v) => set('requiredSkills', v)}
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
                        min="0"
                        max="4"
                        step="0.01"
                        style={{
                          ...inputBase,
                          borderColor: errors.minimumCGPA ? C.dangerBorder : C.border,
                        }}
                      />
                    </Field>
                    <Field label="Experience Expectations" required={false}>
                      <input
                        type="text"
                        value={form.experienceExpectations}
                        onChange={(e) => set('experienceExpectations', e.target.value)}
                        style={inputBase}
                      />
                    </Field>
                  </div>
                  <TagInput
                    label="Required Courses"
                    tags={form.requiredCourses}
                    onChange={(v) => set('requiredCourses', v)}
                  />
                </div>
              </div>

              {/* Status toggle */}
              <div
                style={{
                  background: form.isActive ? C.successBg : '#F8FAFC',
                  border: `1.5px solid ${form.isActive ? C.successBorder : C.border}`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>Listing Status</div>
                  <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>
                    {form.isActive
                      ? 'Active — visible to students'
                      : 'Closed — hidden from students'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 999,
                    background: form.isActive ? C.success : C.border,
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
                      left: form.isActive ? 25 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
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
              <Link
                href="/employer/jobs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 20px',
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 10,
                  background: C.white,
                  color: C.gray,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <ChevronLeft size={15} /> Cancel
              </Link>
              <button
                onClick={handleSubmit}
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
                <CheckCircle2 size={15} />
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </EmployerClientShell>
  );
}
