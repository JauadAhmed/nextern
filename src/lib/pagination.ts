type PaginationOptions = {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
};

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
) {
  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 50;
  const page = parsePositiveInteger(searchParams.get('page'), defaultPage);
  const limit = Math.min(maxLimit, parsePositiveInteger(searchParams.get('limit'), defaultLimit));

  return { page, limit, skip: (page - 1) * limit };
}
