'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PAGE_SIZES = [24, 50, 100] as const;

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
  pageSizes?: readonly number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  syncToUrl?: boolean;
  pageParam?: string;
  pageSizeParam?: string;
};

function pageNumbers(page: number, pages: number) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

  const values = new Set([1, pages, page - 1, page, page + 1]);
  const sorted = [...values].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push('ellipsis');
    result.push(value);
  });

  return result;
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  itemLabel = 'items',
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  syncToUrl = false,
  pageParam = 'page',
  pageSizeParam = 'pageSize',
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  function updateUrl(nextPage: number, nextPageSize = pageSize) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set(pageParam, String(nextPage));
    url.searchParams.set(pageSizeParam, String(nextPageSize));
    window.history.replaceState(window.history.state, '', url);
  }

  function changePage(nextPage: number) {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (syncToUrl) updateUrl(boundedPage);
    onPageChange?.(boundedPage);
  }

  function changePageSize(nextPageSize: number) {
    if (syncToUrl) updateUrl(1, nextPageSize);
    onPageSizeChange?.(nextPageSize);
  }

  return (
    <div className="ui-pagination" role="navigation" aria-label={`${itemLabel} pagination`}>
      <div className="ui-pagination-summary" aria-live="polite">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{totalItems}</strong>{' '}
        {itemLabel}
      </div>

      <div className="ui-pagination-actions">
        <label className="ui-pagination-size">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(event) => changePageSize(Number(event.target.value))}
            aria-label={`${itemLabel} per page`}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="ui-pagination-pages">
          <button
            type="button"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers(currentPage, totalPages).map((value, index) =>
            value === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="ui-pagination-ellipsis" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                type="button"
                key={value}
                onClick={() => changePage(value)}
                className={value === currentPage ? 'is-active' : undefined}
                aria-label={`Page ${value}`}
                aria-current={value === currentPage ? 'page' : undefined}
              >
                {value}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
