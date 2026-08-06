'use client';
// src/app/student/jobs/JobFeedClient.tsx
// Browse jobs with filters, save tracking, applications, and Smart Job Recommendations.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PaginatedCollection from '@/components/ui/PaginatedCollection';
import {
  CalendarDays,
  Clock,
  Crown,
  Heart,
  Layers,
  LoaderCircle,
  MapPin,
  Rocket,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
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

const TYPE_LABELS: Record<string, string> = {
  internship: 'Internship',
  'part-time': 'Part-time',
  'full-time': 'Full-time',
  'campus-drive': 'Campus Drive',
  webinar: 'Webinar',
  workshop: 'Workshop',
};

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  internship: { bg: C.blueBg, color: C.blue, border: C.blueBorder },
  'part-time': { bg: C.successBg, color: '#065F46', border: C.successBorder },
  'full-time': { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'campus-drive': { bg: C.warnBg, color: '#92400E', border: C.warnBorder },
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: C.dangerBg, color: '#BE123C', border: C.dangerBorder },
};

const JOB_TYPES = [
  { value: '', label: 'All role types' },
  { value: 'internship', label: 'Internship' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'campus-drive', label: 'Campus drive' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
];

const DATE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const WORK_MODES = [
  { value: '', label: 'Any work mode' },
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

type SortKey = 'recommended' | 'newest' | 'oldest' | 'fit' | 'deadline' | 'stipend-high';

type AIExecutionMeta = {
  mode: 'ai' | 'fallback' | 'unknown';
  provider: string;
  requestedProvider: string;
  model: string | null;
  fallbackReason: string | null;
};

type SmartUsage = {
  isPremium: boolean;
  counts: {
    smartJobRecommendation?: number;
  };
  remaining: {
    smartJobRecommendation?: number | null;
  };
};

type Job = {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  type: string;
  locationType: string;
  city?: string;
  stipendBDT?: number;
  isStipendNegotiable?: boolean;
  applicationDeadline?: string;
  createdAt?: string;
  requiredSkills: string[];
  applicationCount: number;
  isBatchHiring?: boolean;
  isPremiumListing?: boolean;
  fitScore: number | null;
  hasApplied: boolean;
  isSaved: boolean;
  whyRecommended?: string | null;
  recommendationScore?: number | null;
  matchedSignals?: string[];
};

function daysLeft(d?: string) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function parseSkillTerms(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function numericFilterValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function dateWindowStart(value: string) {
  const daysByValue: Record<string, number> = {
    '24h': 1,
    '3d': 3,
    '7d': 7,
    '30d': 30,
  };
  const days = daysByValue[value];
  return days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
}

function formatLocation(job: Job) {
  if (job.city) return `${job.city} | ${job.locationType}`;
  return job.locationType === 'onsite' ? 'On-site' : job.locationType;
}

function smartMetaLabel(meta: AIExecutionMeta | null) {
  if (!meta) return '';
  return meta.mode === 'ai' ? 'Gemini ranked' : 'Backup ranked';
}

function ApplyModal({
  job,
  onClose,
  onSuccess,
}: {
  job: Job;
  onClose: () => void;
  onSuccess: (jobId: string, fitScore: number | null) => void;
}) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleApply() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to apply');
        return;
      }
      onSuccess(job._id, typeof data.fitScore === 'number' ? data.fitScore : null);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: C.text,
            fontFamily: 'var(--font-display)',
            marginBottom: 4,
          }}
        >
          Apply to {job.title}
        </h2>
        <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>
          {job.companyName}
          {job.city ? ` | ${job.city}` : ''}
        </p>
        {error && (
          <div
            style={{
              background: C.dangerBg,
              border: `1px solid ${C.dangerBorder}`,
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
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 7,
            }}
          >
            Cover Letter{' '}
            <span style={{ color: C.light, fontWeight: 400 }}>(optional, max 2000 chars)</span>
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
            placeholder="Introduce yourself and explain why you are a strong fit for this role..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '11px 14px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              resize: 'vertical',
              color: C.text,
            }}
          />
        </div>
        <div
          style={{
            background: C.bg,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 24,
            fontSize: 13,
            color: C.gray,
          }}
        >
          Your profile resume will be automatically attached to this application.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              background: C.white,
              color: C.gray,
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
              background: loading ? '#93C5FD' : C.blue,
              color: C.white,
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <Rocket size={15} />
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobFeedClient({
  jobs: initialJobs,
  initialSmartUsage,
}: {
  jobs: Job[];
  initialSmartUsage: SmartUsage;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [smartJobs, setSmartJobs] = useState<Job[]>([]);
  const [smartActive, setSmartActive] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState('');
  const [smartSummary, setSmartSummary] = useState('');
  const [smartMeta, setSmartMeta] = useState<AIExecutionMeta | null>(null);
  const [smartUsage, setSmartUsage] = useState<SmartUsage>(initialSmartUsage);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [datePosted, setDatePosted] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [stipendMin, setStipendMin] = useState('');
  const [stipendMax, setStipendMax] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const optionSourceJobs = useMemo(() => {
    const map = new Map<string, Job>();
    [...jobs, ...smartJobs].forEach((job) => map.set(job._id, job));
    return [...map.values()];
  }, [jobs, smartJobs]);

  const cityOptions = useMemo(
    () =>
      [
        ...new Set(
          optionSourceJobs.map((job) => job.city).filter((city): city is string => Boolean(city))
        ),
      ]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 80),
    [optionSourceJobs]
  );

  const skillOptions = useMemo(
    () =>
      [...new Set(optionSourceJobs.flatMap((job) => job.requiredSkills))]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 120),
    [optionSourceJobs]
  );

  const sourceJobs = smartActive ? smartJobs : jobs;

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const skillTerms = parseSkillTerms(skillFilter).map((skill) => skill.toLowerCase());
    const minStipend = numericFilterValue(stipendMin);
    const maxStipend = numericFilterValue(stipendMax);
    const postedSince = dateWindowStart(datePosted);
    const originalIndex = new Map(sourceJobs.map((job, index) => [job._id, index]));

    const filteredJobs = sourceJobs.filter((job) => {
      const matchSearch =
        !searchTerm ||
        job.title.toLowerCase().includes(searchTerm) ||
        job.companyName.toLowerCase().includes(searchTerm) ||
        job.requiredSkills.some((skill) => skill.toLowerCase().includes(searchTerm)) ||
        formatLocation(job).toLowerCase().includes(searchTerm);
      const matchDate =
        !postedSince || (job.createdAt ? new Date(job.createdAt).getTime() >= postedSince : false);
      const matchType = !typeFilter || job.type === typeFilter;
      const matchMode = !workModeFilter || job.locationType === workModeFilter;
      const matchLocation =
        !locationFilter ||
        formatLocation(job).toLowerCase().includes(locationFilter.trim().toLowerCase());
      const matchSkills =
        skillTerms.length === 0 ||
        skillTerms.every((term) =>
          job.requiredSkills.some((skill) => skill.toLowerCase().includes(term))
        );
      const stipend = typeof job.stipendBDT === 'number' ? job.stipendBDT : null;
      const matchMin = minStipend === undefined || (stipend !== null && stipend >= minStipend);
      const matchMax = maxStipend === undefined || (stipend !== null && stipend <= maxStipend);

      return (
        matchSearch &&
        matchDate &&
        matchType &&
        matchMode &&
        matchLocation &&
        matchSkills &&
        matchMin &&
        matchMax
      );
    });

    return [...filteredJobs].sort((a, b) => {
      if (smartActive && sortBy === 'recommended') {
        return (
          (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0) ||
          (originalIndex.get(a._id) ?? 0) - (originalIndex.get(b._id) ?? 0)
        );
      }
      if (sortBy === 'fit') return (b.fitScore ?? -1) - (a.fitScore ?? -1);
      if (sortBy === 'oldest') {
        return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      }
      if (sortBy === 'deadline') {
        return (
          new Date(a.applicationDeadline ?? 8640000000000000).getTime() -
          new Date(b.applicationDeadline ?? 8640000000000000).getTime()
        );
      }
      if (sortBy === 'stipend-high') return (b.stipendBDT ?? -1) - (a.stipendBDT ?? -1);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [
    datePosted,
    locationFilter,
    search,
    skillFilter,
    smartActive,
    sortBy,
    sourceJobs,
    stipendMax,
    stipendMin,
    typeFilter,
    workModeFilter,
  ]);

  function updateJobInLists(jobId: string, updater: (job: Job) => Job) {
    setJobs((prev) => prev.map((job) => (job._id === jobId ? updater(job) : job)));
    setSmartJobs((prev) => prev.map((job) => (job._id === jobId ? updater(job) : job)));
  }

  function handleApplySuccess(jobId: string, fitScore: number | null) {
    updateJobInLists(jobId, (job) => ({
      ...job,
      hasApplied: true,
      applicationCount: job.applicationCount + 1,
      fitScore: fitScore ?? job.fitScore,
    }));
    const job = [...jobs, ...smartJobs].find((item) => item._id === jobId);
    if (job) {
      setSuccessMsg(`Successfully applied to ${job.title}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  }

  async function handleToggleSave(job: Job) {
    const nextSaved = !job.isSaved;
    setSavingIds((prev) => new Set(prev).add(job._id));
    updateJobInLists(job._id, (item) => ({ ...item, isSaved: nextSaved }));

    try {
      const res = await fetch(`/api/jobs/${job._id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSaved: nextSaved }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateJobInLists(job._id, (item) => ({ ...item, isSaved: job.isSaved }));
        setSmartError(data.error ?? 'Failed to update saved job.');
        return;
      }
      setSuccessMsg(nextSaved ? 'Job saved.' : 'Job removed from saved jobs.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      updateJobInLists(job._id, (item) => ({ ...item, isSaved: job.isSaved }));
      setSmartError('Network error while saving this job.');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(job._id);
        return next;
      });
    }
  }

  function buildSmartFilters() {
    const skills = parseSkillTerms(skillFilter);
    return {
      search: search.trim() || undefined,
      datePosted: datePosted || undefined,
      type: typeFilter || undefined,
      locationType: workModeFilter || undefined,
      city: locationFilter.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
      stipendMin: numericFilterValue(stipendMin),
      stipendMax: numericFilterValue(stipendMax),
    };
  }

  async function handleSmartRecommendations() {
    setSmartLoading(true);
    setSmartError('');

    try {
      const res = await fetch('/api/ai/job-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: buildSmartFilters(), limit: 12 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSmartError(data.error ?? 'Failed to generate smart recommendations.');
        if (data.usage) setSmartUsage(data.usage);
        return;
      }

      setSmartJobs(data.jobs ?? []);
      setSmartSummary(data.summary ?? '');
      setSmartMeta(data.meta ?? null);
      if (data.usage) setSmartUsage(data.usage);
      setSmartActive(true);
      setSortBy('recommended');
    } catch {
      setSmartError('Network error while generating recommendations.');
    } finally {
      setSmartLoading(false);
    }
  }

  function resetFilters() {
    setSearch('');
    setDatePosted('');
    setTypeFilter('');
    setWorkModeFilter('');
    setLocationFilter('');
    setSkillFilter('');
    setStipendMin('');
    setStipendMax('');
    setSortBy(smartActive ? 'recommended' : 'newest');
  }

  function clearSmartMode() {
    setSmartActive(false);
    setSmartJobs([]);
    setSmartSummary('');
    setSmartMeta(null);
    setSmartError('');
    if (sortBy === 'recommended') setSortBy('newest');
  }

  const smartUsed = smartUsage.counts.smartJobRecommendation ?? 0;
  const smartRemaining = smartUsage.remaining.smartJobRecommendation ?? 0;
  const canUseSmart = smartUsage.isPremium || smartRemaining > 0;

  return (
    <>
      <section
        style={{
          marginTop: 28,
          marginBottom: 20,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 18,
          boxShadow: '0 1px 6px rgba(15,23,42,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 240 }}>
            <div
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                color: C.light,
                pointerEvents: 'none',
              }}
            >
              <Search size={15} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, companies, skills, or locations"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px 11px 38px',
                border: `1.5px solid ${C.border}`,
                borderRadius: 11,
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                outline: 'none',
                color: C.text,
                background: C.white,
              }}
            />
          </div>

          <button
            onClick={handleSmartRecommendations}
            disabled={smartLoading || !canUseSmart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 16px',
              borderRadius: 11,
              border: 'none',
              background: smartLoading || !canUseSmart ? '#93C5FD' : C.blue,
              color: C.white,
              cursor: smartLoading || !canUseSmart ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              boxShadow: smartLoading || !canUseSmart ? 'none' : '0 5px 14px rgba(37,99,235,0.28)',
            }}
          >
            {smartLoading ? (
              <LoaderCircle size={15} className="job-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {smartLoading ? 'Ranking...' : 'Smart recommendations'}
          </button>

          {smartActive && (
            <button
              onClick={clearSmartMode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 13px',
                borderRadius: 11,
                border: `1.5px solid ${C.border}`,
                background: C.white,
                color: C.gray,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <X size={14} />
              All jobs
            </button>
          )}

          <span style={{ color: C.light, fontSize: 13, whiteSpace: 'nowrap' }}>
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="job-filter-grid">
          <label className="job-filter-field">
            <span>Date posted</span>
            <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)}>
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="job-filter-field">
            <span>Role type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {JOB_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="job-filter-field">
            <span>Work mode</span>
            <select value={workModeFilter} onChange={(e) => setWorkModeFilter(e.target.value)}>
              {WORK_MODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="job-filter-field">
            <span>Location</span>
            <input
              list="job-location-options"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="City or remote"
            />
            <datalist id="job-location-options">
              {cityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </label>

          <label className="job-filter-field">
            <span>Required skills</span>
            <input
              list="job-skill-options"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="React, Python"
            />
            <datalist id="job-skill-options">
              {skillOptions.map((skill) => (
                <option key={skill} value={skill} />
              ))}
            </datalist>
          </label>

          <label className="job-filter-field">
            <span>Min stipend</span>
            <input
              type="number"
              min="0"
              value={stipendMin}
              onChange={(e) => setStipendMin(e.target.value)}
              placeholder="BDT"
            />
          </label>

          <label className="job-filter-field">
            <span>Max stipend</span>
            <input
              type="number"
              min="0"
              value={stipendMax}
              onChange={(e) => setStipendMax(e.target.value)}
              placeholder="BDT"
            />
          </label>

          <label className="job-filter-field">
            <span>Sort by</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
              {smartActive && <option value="recommended">Smart rank</option>}
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="fit">Best fit score</option>
              <option value="deadline">Deadline soon</option>
              <option value="stipend-high">Highest stipend</option>
            </select>
          </label>

          <button className="job-reset-button" onClick={resetFilters}>
            <SlidersHorizontal size={14} />
            Reset filters
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ color: C.gray, fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {smartActive ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: C.blue,
                  fontWeight: 800,
                }}
              >
                <Sparkles size={14} />
                Smart mode is ranking filtered jobs
              </span>
            ) : (
              <span>Use filters first, then run Smart recommendations for more focused picks.</span>
            )}
            {smartMeta ? <span>{smartMetaLabel(smartMeta)}</span> : null}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              color: smartUsage.isPremium ? C.success : C.gray,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Crown size={13} />
            {smartUsage.isPremium
              ? 'Unlimited Smart recommendations'
              : `${smartRemaining} of 10 free Smart recommendations left`}
            {!smartUsage.isPremium && smartUsed > 0 ? ` (${smartUsed} used)` : ''}
          </div>
        </div>

        {smartSummary && (
          <div
            style={{
              marginTop: 12,
              borderRadius: 12,
              border: `1px solid ${C.blueBorder}`,
              background: C.blueBg,
              color: '#1D4ED8',
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {smartSummary}
          </div>
        )}

        {smartError && (
          <div
            style={{
              marginTop: 12,
              borderRadius: 12,
              border: `1px solid ${C.dangerBorder}`,
              background: C.dangerBg,
              color: '#991B1B',
              padding: '10px 12px',
              fontSize: 13,
            }}
          >
            {smartError}
          </div>
        )}
      </section>

      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: C.indigo,
            color: C.success,
            padding: '13px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 999,
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          {successMsg}
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            background: C.white,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <Search size={36} color={C.light} style={{ marginBottom: 12 }} />
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.text,
              fontFamily: 'var(--font-display)',
              marginBottom: 8,
            }}
          >
            No jobs found
          </h3>
          <p style={{ color: C.gray, fontSize: 14 }}>
            Try adjusting your filters or check back later for new listings.
          </p>
        </div>
      ) : (
        <PaginatedCollection
          itemLabel="job listings"
          resetKey={`${search}|${datePosted}|${typeFilter}|${workModeFilter}|${locationFilter}|${skillFilter}|${stipendMin}|${stipendMax}|${sortBy}|${smartActive}`}
          className="job-card-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gridAutoRows: '1fr',
            gap: 16,
          }}
        >
          {filtered.map((job) => {
            const typeStyle = TYPE_COLORS[job.type] ?? TYPE_COLORS.internship;
            const days = daysLeft(job.applicationDeadline);
            const isUrgent = days !== null && days <= 3 && days >= 0;
            const isExpired = days !== null && days < 0;
            const saving = savingIds.has(job._id);

            return (
              <div
                key={job._id}
                className="job-card"
                style={{
                  background: C.white,
                  borderRadius: 18,
                  border: `1px solid ${isUrgent ? C.warnBorder : C.border}`,
                  padding: '20px 22px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: C.indigo,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.white,
                      fontSize: 16,
                      fontWeight: 900,
                      flexShrink: 0,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }}
                      />
                    ) : (
                      job.companyName.charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          border: `1px solid ${typeStyle.border}`,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {TYPE_LABELS[job.type] ?? job.type}
                      </span>
                      {job.whyRecommended && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: C.blueBg,
                            color: '#1D4ED8',
                            border: `1px solid ${C.blueBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          <Sparkles size={10} />
                          {job.whyRecommended}
                        </span>
                      )}
                      {job.isBatchHiring && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            background: '#EDE9FE',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          <Layers size={10} /> Batch
                        </span>
                      )}
                      {job.isPremiumListing && (
                        <span
                          style={{
                            background: C.warnBg,
                            color: '#92400E',
                            border: `1px solid ${C.warnBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Featured
                        </span>
                      )}
                      {isUrgent && (
                        <span
                          style={{
                            background: C.warnBg,
                            color: '#92400E',
                            border: `1px solid ${C.warnBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Closing soon
                        </span>
                      )}
                      {job.hasApplied && (
                        <span
                          style={{
                            background: C.successBg,
                            color: '#065F46',
                            border: `1px solid ${C.successBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Applied
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: C.text,
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                        minHeight: 38,
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {job.title}
                    </h3>
                    <div style={{ color: C.gray, fontSize: 13, marginTop: 1, fontWeight: 600 }}>
                      {job.companyName}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, display: 'grid', gap: 8, justifyItems: 'end' }}>
                    <button
                      onClick={() => handleToggleSave(job)}
                      disabled={saving}
                      aria-label={job.isSaved ? 'Remove saved job' : 'Save job'}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: `1.5px solid ${job.isSaved ? C.successBorder : C.border}`,
                        background: job.isSaved ? C.successBg : C.white,
                        color: job.isSaved ? '#065F46' : C.gray,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {saving ? (
                        <LoaderCircle size={15} className="job-spin" />
                      ) : (
                        <Heart size={15} fill={job.isSaved ? '#10B981' : 'none'} />
                      )}
                    </button>

                    {job.fitScore !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color:
                              job.fitScore >= 70
                                ? C.success
                                : job.fitScore >= 40
                                  ? C.blue
                                  : C.warning,
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {job.fitScore}%
                        </div>
                        <div style={{ fontSize: 10, color: C.light, fontWeight: 600 }}>Fit</div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: C.gray,
                      fontSize: 12,
                    }}
                  >
                    <MapPin size={11} />
                    {formatLocation(job)}
                  </span>
                  {days !== null && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: isUrgent ? C.warning : isExpired ? C.danger : C.gray,
                        fontWeight: isUrgent || isExpired ? 700 : 400,
                      }}
                    >
                      <Clock size={11} />
                      {isExpired ? 'Closed' : `${days}d left`}
                    </span>
                  )}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: C.light,
                      fontSize: 12,
                    }}
                  >
                    <Users size={11} />
                    {job.applicationCount}
                  </span>
                  {typeof job.stipendBDT === 'number' && (
                    <span style={{ color: C.success, fontSize: 12, fontWeight: 700 }}>
                      BDT {job.stipendBDT.toLocaleString()}/mo
                    </span>
                  )}
                  {job.isStipendNegotiable && typeof job.stipendBDT !== 'number' && (
                    <span style={{ color: C.gray, fontSize: 12 }}>Negotiable</span>
                  )}
                </div>

                {job.requiredSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {job.requiredSkills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          background: C.bg,
                          color: '#475569',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {job.matchedSignals && job.matchedSignals.length > 0 && (
                  <div style={{ color: C.gray, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                    {job.matchedSignals.slice(0, 2).join(' | ')}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: `1px solid ${C.bg}`,
                    paddingTop: 12,
                    marginTop: 'auto',
                  }}
                >
                  <Link
                    href={`/student/jobs/${job._id}`}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      minHeight: 40,
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 9,
                      color: C.gray,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => !job.hasApplied && !isExpired && setApplyingJob(job)}
                    disabled={job.hasApplied || isExpired}
                    style={{
                      flex: 1.45,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '8px',
                      background: job.hasApplied ? C.successBg : isExpired ? C.bg : C.blue,
                      color: job.hasApplied ? '#065F46' : isExpired ? C.light : C.white,
                      border: job.hasApplied
                        ? `1.5px solid ${C.successBorder}`
                        : isExpired
                          ? `1.5px solid ${C.border}`
                          : 'none',
                      borderRadius: 9,
                      minHeight: 40,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: job.hasApplied || isExpired ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-display)',
                      boxShadow:
                        !job.hasApplied && !isExpired ? '0 3px 10px rgba(37,99,235,0.3)' : 'none',
                    }}
                  >
                    {job.hasApplied ? (
                      job.type === 'webinar' || job.type === 'workshop' ? (
                        'Registered'
                      ) : (
                        'Applied'
                      )
                    ) : isExpired ? (
                      'Closed'
                    ) : job.type === 'webinar' || job.type === 'workshop' ? (
                      <>
                        <CalendarDays size={12} /> Register
                      </>
                    ) : (
                      <>
                        <Rocket size={12} /> Apply Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </PaginatedCollection>
      )}

      {applyingJob && (
        <ApplyModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSuccess={handleApplySuccess}
        />
      )}

      <style>{`
        .job-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(150px, 1fr));
          gap: 10px;
          align-items: end;
        }

        .job-filter-field {
          display: grid;
          gap: 6px;
        }

        .job-filter-field span {
          color: ${C.gray};
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .job-filter-field input,
        .job-filter-field select {
          width: 100%;
          box-sizing: border-box;
          border: 1.5px solid ${C.border};
          border-radius: 10px;
          background: ${C.white};
          color: ${C.text};
          font-size: 13px;
          padding: 10px 11px;
          outline: none;
          font-family: var(--font-body);
        }

        .job-reset-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1.5px solid ${C.border};
          border-radius: 10px;
          background: ${C.white};
          color: ${C.gray};
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          font-family: var(--font-display);
          min-height: 40px;
        }

        .job-spin {
          animation: job-spin 0.9s linear infinite;
        }

        @keyframes job-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .job-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .job-filter-grid {
            grid-template-columns: repeat(2, minmax(150px, 1fr));
          }
        }

        @media (max-width: 760px) {
          .job-card-grid {
            grid-template-columns: 1fr !important;
          }

          .job-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
          }
        }

        @media (max-width: 640px) {
          .job-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
