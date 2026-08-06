'use client';

import { useState } from 'react';
import Link from 'next/link';
import { describeAIExecutionMeta, type AIExecutionMeta } from '@/lib/ai-meta';
import { Brain, Crown, LoaderCircle, Rocket, Sparkles, Target } from 'lucide-react';

type Analysis = {
  fitScore: number;
  hardGaps: string[];
  softGaps: string[];
  metRequirements: string[];
  suggestedPath: string[];
  summary: string;
  meta: AIExecutionMeta;
};

type UsageSummary = {
  isPremium: boolean;
  counts: {
    skillGapAnalysis: number;
    mockInterview: number;
  };
  remaining: {
    skillGapAnalysis: number | null;
    mockInterview: number | null;
  };
};

type TrainingStep = {
  order: number;
  action: string;
  resource: string;
  url: string;
  estimatedDays: number;
  isFree: boolean;
  type: 'course' | 'project' | 'practice' | 'certification';
};

const C = {
  blue: '#2563EB',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F8FAFC',
  success: '#10B981',
  warning: '#F59E0B',
};

const ANALYSIS_EVENT_NAME = 'student-job-ai-analysis-updated';

function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'info';
}) {
  const palette = {
    neutral: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
    success: { bg: '#ECFDF5', color: '#166534', border: '#A7F3D0' },
    warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    info: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  } as const;

  const colors = palette[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
}

function StatusNotice({ meta }: { meta: AIExecutionMeta }) {
  const info = describeAIExecutionMeta(meta);
  const palette =
    meta.mode === 'ai'
      ? { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }
      : meta.mode === 'fallback'
        ? { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }
        : { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      {info.detail}
    </div>
  );
}

export default function AISkillAnalysisCard({
  jobId,
  jobTitle,
  hasApplied,
  initialAnalysis,
  initialUsage,
}: {
  jobId: string;
  jobTitle: string;
  hasApplied: boolean;
  initialAnalysis: Analysis | null;
  initialUsage: UsageSummary;
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);
  const [usage, setUsage] = useState<UsageSummary>(initialUsage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [trainingPath, setTrainingPath] = useState<TrainingStep[]>([]);
  const [trainingMeta, setTrainingMeta] = useState<AIExecutionMeta | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingError, setTrainingError] = useState('');

  async function handleRunAnalysis() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, forceRefresh: Boolean(analysis) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate AI analysis.');
        if (data.usage) setUsage(data.usage);
        return;
      }

      setAnalysis(data.analysis && data.meta ? { ...data.analysis, meta: data.meta } : null);
      if (data.usage) setUsage(data.usage);
      window.dispatchEvent(
        new CustomEvent(ANALYSIS_EVENT_NAME, {
          detail: {
            jobId,
            fitScore: typeof data.analysis?.fitScore === 'number' ? data.analysis.fitScore : null,
          },
        })
      );
    } catch {
      setError('Network error while running AI analysis.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTrainingPath(skill: string) {
    setSelectedSkill(skill);
    setTrainingLoading(true);
    setTrainingError('');
    setTrainingMeta(null);

    try {
      const res = await fetch('/api/ai/training-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, targetRole: jobTitle }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTrainingError(data.error ?? 'Failed to generate training path.');
        if (data.usage) setUsage(data.usage);
        setTrainingPath([]);
        return;
      }

      setTrainingPath(data.steps ?? []);
      setTrainingMeta(data.meta ?? null);
      if (data.usage) setUsage(data.usage);
    } catch {
      setTrainingError('Network error while generating the training path.');
      setTrainingPath([]);
    } finally {
      setTrainingLoading(false);
    }
  }

  const fitScore = analysis?.fitScore ?? 0;
  const fitScoreColor = fitScore >= 75 ? C.success : fitScore >= 50 ? C.blue : C.warning;
  const analysisMetaInfo = analysis ? describeAIExecutionMeta(analysis.meta) : null;
  const trainingMetaInfo = trainingMeta ? describeAIExecutionMeta(trainingMeta) : null;

  return (
    <section
      style={{
        background: '#FFFFFF',
        borderRadius: 28,
        border: `1px solid ${C.border}`,
        boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 24,
          background: '#172033',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.08)',
                color: '#DCEBFF',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={14} />
              AI skill gap analysis
            </div>
            <h2
              style={{
                margin: '14px 0 0',
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
              }}
            >
              See how ready you are for {jobTitle}
            </h2>
            <p style={{ margin: '10px 0 0', color: '#D6E4FF', fontSize: 14, lineHeight: 1.7 }}>
              Nextern AI compares your profile with this role and highlights missing skills,
              strengths, and next steps. If Nextern AI is unavailable, the card now shows that
              clearly and falls back to local backup logic.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10, minWidth: 240 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '14px 16px',
              }}
            >
              <div style={{ color: '#9FB4D0', fontSize: 12, fontWeight: 700 }}>
                Analyses this month
              </div>
              <div
                style={{
                  color: '#FFFFFF',
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  marginTop: 4,
                }}
              >
                {usage.counts.skillGapAnalysis}
              </div>
              <div style={{ color: '#D6E4FF', fontSize: 12, marginTop: 4 }}>
                {usage.isPremium
                  ? 'Unlimited on Premium'
                  : `${usage.remaining.skillGapAnalysis ?? 0} free analyses left`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: loading ? '#93C5FD' : '#FFFFFF',
                  color: loading ? '#FFFFFF' : C.blue,
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minWidth: 180,
                }}
              >
                {loading ? <LoaderCircle size={16} className="ai-spin" /> : <Brain size={16} />}
                {analysis ? 'Refresh analysis' : 'Run AI analysis'}
              </button>

              <Link
                href="/student/skills"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <Rocket size={15} />
                Open AI Tools
              </Link>
            </div>
          </div>
        </div>

        {!usage.isPremium ? (
          <div
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245,158,11,0.14)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 999,
              padding: '8px 14px',
              color: '#FDE68A',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Crown size={14} />
            Premium unlocks unlimited analyses and personalized training plans.
            <Link href="/student/premium" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
              Upgrade
            </Link>
          </div>
        ) : null}
      </div>

      <div style={{ padding: 24, display: 'grid', gap: 20 }}>
        {error ? (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 14,
              padding: '12px 14px',
              color: '#991B1B',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        {analysis ? (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}
            className="ai-analysis-grid"
          >
            <div
              style={{
                background: C.bg,
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>
                    Match score for this role
                  </div>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                      color: fitScoreColor,
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1,
                      marginTop: 6,
                    }}
                  >
                    {fitScore}%
                  </div>
                </div>
                <div
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}
                >
                  {analysisMetaInfo ? (
                    <Badge label={analysisMetaInfo.badgeLabel} tone={analysisMetaInfo.badgeTone} />
                  ) : null}
                  <Badge
                    label={hasApplied ? 'Saved with your application' : 'Preview mode'}
                    tone={hasApplied ? 'success' : 'info'}
                  />
                </div>
              </div>

              {analysis.summary ? (
                <p style={{ margin: 0, color: C.text, fontSize: 14, lineHeight: 1.8 }}>
                  {analysis.summary}
                </p>
              ) : null}

              <div style={{ marginTop: 12 }}>
                <StatusNotice meta={analysis.meta} />
              </div>

              {!hasApplied ? (
                <div
                  style={{
                    marginTop: 14,
                    borderRadius: 14,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    padding: '12px 14px',
                    color: '#1D4ED8',
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  Apply to this role to save the analysis automatically in your AI Tools workspace.
                </div>
              ) : null}

              <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
                    Strengths
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {analysis.metRequirements.length > 0 ? (
                      analysis.metRequirements.map((item) => (
                        <Badge key={item} label={item} tone="success" />
                      ))
                    ) : (
                      <Badge label="No confirmed strengths yet" />
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
                    Hard gaps
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {analysis.hardGaps.length > 0 ? (
                      analysis.hardGaps.map((gap) => (
                        <button
                          key={gap}
                          onClick={() => handleGenerateTrainingPath(gap)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 10px',
                            borderRadius: 999,
                            border: '1px solid #FDE68A',
                            background: '#FFFBEB',
                            color: '#92400E',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Target size={12} />
                          {gap}
                        </button>
                      ))
                    ) : (
                      <Badge label="No hard gaps detected" tone="success" />
                    )}
                  </div>
                </div>

                {analysis.softGaps.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
                      Soft gaps
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {analysis.softGaps.map((gap) => (
                        <Badge key={gap} label={gap} tone="warning" />
                      ))}
                    </div>
                  </div>
                ) : null}

                {analysis.suggestedPath.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
                      Suggested next actions
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {analysis.suggestedPath.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ display: 'flex', gap: 8 }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 7,
                              background: '#EFF6FF',
                              color: C.blue,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </div>
                          <span style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                padding: 20,
                boxShadow: '0 12px 24px rgba(15,23,42,0.04)',
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.text,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Training path
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                  Click any hard gap to generate a practical roadmap for this role.
                </p>
              </div>

              {trainingMeta ? (
                <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                  <Badge
                    label={trainingMetaInfo?.badgeLabel ?? 'Training path result'}
                    tone={trainingMetaInfo?.badgeTone ?? 'info'}
                  />
                  <StatusNotice meta={trainingMeta} />
                </div>
              ) : null}

              {trainingError ? (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 12,
                    padding: '10px 12px',
                    color: '#991B1B',
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  {trainingError}
                </div>
              ) : null}

              {trainingLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  <LoaderCircle size={18} className="ai-spin" />
                  Building your learning roadmap...
                </div>
              ) : trainingPath.length > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    Roadmap for {selectedSkill}
                  </div>
                  {trainingPath.map((step) => (
                    <div
                      key={`${selectedSkill}-${step.order}`}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                          {step.action}
                        </div>
                        <Badge label={`${step.estimatedDays}d`} tone="info" />
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                        {step.resource} | {step.type} | {step.isFree ? 'Free' : 'Paid'}
                      </div>
                      {step.url ? (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            marginTop: 8,
                            color: C.blue,
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          Open resource
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: 16,
                    border: `1px dashed ${C.border}`,
                    background: C.bg,
                    padding: '18px 16px',
                    color: C.muted,
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  Run an analysis, then click any hard gap to build a learning plan.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 20,
              border: '1px dashed #CBD5E1',
              background: C.bg,
              padding: '26px 22px',
              textAlign: 'center',
            }}
          >
            <Brain size={28} color={C.blue} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>No AI analysis yet</div>
            <p
              style={{
                margin: '8px auto 18px',
                fontSize: 14,
                color: C.muted,
                maxWidth: 560,
                lineHeight: 1.7,
              }}
            >
              Run an analysis for this job to see your fit score, missing skills, and the fastest
              next steps to become a stronger applicant.
            </p>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: loading ? '#93C5FD' : C.blue,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '12px 18px',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <LoaderCircle size={16} className="ai-spin" /> : <Sparkles size={16} />}
              {loading ? 'Analyzing...' : 'Run AI analysis'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ai-spin {
          animation: ai-spin 0.9s linear infinite;
        }

        @keyframes ai-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 980px) {
          .ai-analysis-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
