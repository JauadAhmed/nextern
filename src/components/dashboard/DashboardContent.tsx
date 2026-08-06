import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const palette = {
  primary: '#2563EB',
  indigo: '#172033',
  cyan: '#0891B2',
  text: '#172033',
  muted: '#52657A',
  success: '#059669',
  warning: '#F59E0B',
  border: '#D9E2EC',
};

const heroAsideSurface: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  padding: 22,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.16)',
  boxShadow: '0 14px 32px rgba(15,23,42,0.14)',
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function isHeroAsideStyle(style?: CSSProperties) {
  return (
    typeof style?.background === 'string' &&
    style.background.includes('rgba(255,255,255') &&
    typeof style?.border === 'string' &&
    style.border.includes('rgba(255,255,255')
  );
}

function HeroAsideDecorations() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 8,
          background: 'rgba(125,211,252,0.72)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 84,
          height: 84,
          borderRadius: '0 0 0 84px',
          background: 'rgba(125,211,252,0.12)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 'auto 0 0 auto',
          width: 120,
          height: 5,
          background: 'rgba(255,255,255,0.16)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export function HeroAsideCard({
  children,
  style,
  contentStyle,
}: {
  children: ReactNode;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...heroAsideSurface,
        ...style,
      }}
    >
      <HeroAsideDecorations />
      <div style={{ position: 'relative', ...contentStyle }}>{children}</div>
    </div>
  );
}

export function DashboardPage({ children }: { children: ReactNode }) {
  return (
    <div
      className="dashboard-page"
      style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 24px 0' }}
    >
      {children}
    </div>
  );
}

export function DashboardSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="dashboard-section" style={{ marginTop: 28, scrollMarginTop: 148 }}>
      <div
        className="dashboard-section-header"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div className="dashboard-section-copy">
          <h2
            className="dashboard-section-title"
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.15,
              color: palette.text,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </h2>
          {description ? (
            <p
              className="dashboard-section-description"
              style={{
                margin: '8px 0 0',
                fontSize: 14,
                lineHeight: 1.6,
                color: palette.muted,
                maxWidth: 720,
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  aside,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div
      className="dashboard-hero-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        padding: 28,
        background: '#234A8A',
        boxShadow: '0 20px 48px rgba(15,23,42,0.14)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 'auto -80px -110px auto',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(125,211,252,0.12)',
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.75fr) minmax(300px, 1fr)',
          gap: 20,
        }}
        className="dashboard-hero-grid"
      >
        <div>
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
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>

          <h1
            className="dashboard-hero-title"
            style={{
              margin: '18px 0 0',
              fontSize: 38,
              lineHeight: 1.06,
              color: '#FFFFFF',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              fontFamily: 'var(--font-display)',
              maxWidth: 700,
            }}
          >
            {title}
          </h1>

          {/* ── Subtitle — shown under name, above description ── */}
          {subtitle ? (
            <div
              className="dashboard-hero-subtitle"
              style={{ marginTop: 12, color: '#DCEBFF', fontSize: 14, fontWeight: 700 }}
            >
              {subtitle}
            </div>
          ) : null}

          <p
            className="dashboard-hero-description"
            style={{
              margin: '14px 0 0',
              color: '#D6E4FF',
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 720,
            }}
          >
            {description}
          </p>

          {actions ? (
            <div
              className="dashboard-hero-actions"
              style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              {actions}
            </div>
          ) : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
    </div>
  );
}

export function ActionLink({
  href,
  label,
  tone = 'primary',
}: {
  href: string;
  label: string;
  tone?: 'primary' | 'ghost';
}) {
  const isPrimary = tone === 'primary';
  return (
    <a
      className="dashboard-action-link"
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        minHeight: 44,
        borderRadius: 12,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 700,
        background: isPrimary ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
        color: isPrimary ? palette.primary : '#FFFFFF',
        border: isPrimary ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.14)',
        boxShadow: isPrimary ? '0 10px 20px rgba(15,23,42,0.12)' : 'none',
      }}
    >
      {label}
    </a>
  );
}

export function StatCard({
  label,
  value,
  hint,
  Icon,
  accent = palette.primary,
  showIcon = true,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: LucideIcon;
  accent?: string;
  showIcon?: boolean;
}) {
  return (
    <div
      className="dashboard-stat-card"
      style={{
        borderRadius: 18,
        background: '#FFFFFF',
        border: `1px solid ${palette.border}`,
        padding: 20,
        boxShadow: '0 10px 28px rgba(15,23,42,0.055)',
      }}
    >
      {showIcon ? (
        <div
          className="dashboard-stat-icon"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: `${accent}14`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
        </div>
      ) : null}
      <div
        className="dashboard-stat-value"
        style={{
          marginTop: showIcon ? 18 : 0,
          fontSize: 32,
          lineHeight: 1,
          color: palette.text,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </div>
      <div
        className="dashboard-stat-label"
        style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: palette.text }}
      >
        {label}
      </div>
      {hint ? (
        <div
          className="dashboard-stat-hint"
          style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: palette.muted }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  style,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const isHeroAside = isHeroAsideStyle(style);

  return (
    <div
      className="dashboard-panel"
      style={{
        borderRadius: 20,
        background: '#FFFFFF',
        border: `1px solid ${palette.border}`,
        padding: 22,
        boxShadow: '0 10px 28px rgba(15,23,42,0.055)',
        ...style,
        ...(isHeroAside ? heroAsideSurface : {}),
      }}
    >
      {isHeroAside ? <HeroAsideDecorations /> : null}
      <div style={isHeroAside ? { position: 'relative' } : undefined}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 14,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              className="dashboard-panel-title"
              style={{
                margin: 0,
                fontSize: isHeroAside ? 18 : 19,
                lineHeight: 1.2,
                fontWeight: 800,
                color: isHeroAside ? '#FFFFFF' : palette.text,
                fontFamily: 'var(--font-display)',
                letterSpacing: isHeroAside ? 0 : undefined,
              }}
            >
              {title}
            </h3>
            {description ? (
              <p
                className="dashboard-panel-description"
                style={{
                  margin: '8px 0 0',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: isHeroAside ? '#DCEBFF' : palette.muted,
                  fontWeight: isHeroAside ? 500 : undefined,
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tag({
  label,
  tone = 'info',
}: {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'neutral';
}) {
  const tones = {
    info: { background: '#EFF6FF', color: palette.primary, border: '#BFDBFE' },
    success: { background: '#ECFDF5', color: palette.success, border: '#A7F3D0' },
    warning: { background: '#FFFBEB', color: palette.warning, border: '#FDE68A' },
    neutral: { background: '#F8FAFC', color: palette.muted, border: '#E2E8F0' },
  };
  const colors = tones[tone];

  return (
    <span
      className="dashboard-tag"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: colors.background,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
}

export function ProgressBar({
  value,
  label,
  tone = 'primary',
}: {
  value: number;
  label?: string;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const colors = {
    primary: '#2563EB',
    success: '#059669',
    warning: '#D97706',
  };

  return (
    <div>
      {label ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: palette.text, fontWeight: 700 }}>{label}</span>
          <span style={{ fontSize: 12, color: palette.muted, fontWeight: 700 }}>
            {clamp(value)}%
          </span>
        </div>
      ) : null}
      <div
        style={{
          width: '100%',
          height: 10,
          borderRadius: 999,
          background: '#E2E8F0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamp(value)}%`,
            height: '100%',
            borderRadius: 999,
            background: colors[tone],
          }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="dashboard-empty-state"
      style={{
        borderRadius: 20,
        border: '1px dashed #CBD5E1',
        background: '#F8FAFC',
        padding: '28px 18px',
        textAlign: 'center',
      }}
    >
      <div
        className="dashboard-empty-state-title"
        style={{ fontSize: 15, fontWeight: 800, color: palette.text }}
      >
        {title}
      </div>
      <div
        className="dashboard-empty-state-description"
        style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: palette.muted }}
      >
        {description}
      </div>
    </div>
  );
}

export function TrendLine({
  values,
  lineColor = palette.cyan,
  fillColor = 'rgba(34,211,238,0.14)',
}: {
  values: number[];
  lineColor?: string;
  fillColor?: string;
}) {
  if (values.length === 0) {
    return (
      <EmptyState
        title="No trend data yet"
        description="New score updates will appear here automatically."
      />
    );
  }

  const width = 460;
  const height = 210;
  const padding = 18;
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);

  const points = values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="210"
      role="img"
      aria-label="Trend line"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} />
          <stop offset="100%" stopColor="rgba(34,211,238,0.02)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx="20" fill="#F8FAFC" />
      {[0, 1, 2, 3].map((row) => {
        const y = padding + (row * (height - padding * 2)) / 3;
        return (
          <line
            key={row}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            stroke="#D9E2EC"
            strokeDasharray="5 7"
          />
        );
      })}
      <polygon points={areaPoints} fill="url(#trend-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((value, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return (
          <circle
            key={`${value}-${index}`}
            cx={x}
            cy={y}
            r="4.5"
            fill={lineColor}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        );
      })}
    </svg>
  );
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}

export function formatShortDate(value?: string) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatStatusLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDaysLeftLabel(daysLeft: number) {
  if (daysLeft < 0) return 'Closed';
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}
