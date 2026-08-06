import { auth } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/pagination';

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return session;
}

export function parsePagination(
  searchParams: URLSearchParams,
  options?: { defaultPage?: number; defaultLimit?: number; maxLimit?: number }
) {
  return parsePaginationParams(searchParams, options);
}

export function parseBooleanParam(value: string | null) {
  if (value === null || value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function parseRangeDays(value: string | null, fallback = 30) {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === '7d') return 7;
  if (normalized === '30d') return 30;
  if (normalized === '90d') return 90;
  if (normalized === '180d') return 180;
  if (normalized === '365d') return 365;

  const numeric = Number.parseInt(normalized, 10);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.min(365, numeric);
  }

  return fallback;
}

export function getSinceDate(days: number) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - Math.max(0, days - 1));
  return since;
}

export function buildSearchRegex(search: string | null) {
  const normalized = (search ?? '').trim();
  if (!normalized) return null;

  return new RegExp(escapeRegExp(normalized), 'i');
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function cleanStringList(values: unknown) {
  if (!Array.isArray(values)) return undefined;

  const cleaned = values
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : [];
}

export function fillDateSeries(
  rows: Array<{ _id: string; value: number }>,
  days: number,
  labelFormatter?: (date: Date) => string
) {
  const valueMap = new Map(rows.map((row) => [row._id, row.value]));
  const start = getSinceDate(days);
  const points: Array<{ date: string; label: string; value: number }> = [];

  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + offset);

    const key = current.toISOString().slice(0, 10);
    points.push({
      date: key,
      label:
        labelFormatter?.(current) ??
        current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: valueMap.get(key) ?? 0,
    });
  }

  return points;
}
