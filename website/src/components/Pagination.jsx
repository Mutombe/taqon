import { CaretLeft, CaretRight } from '@phosphor-icons/react';

/**
 * Reusable pagination component.
 * @param {number} page - Current page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback with new page number
 * @param {string} [className] - Optional wrapper className
 */
export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const show = (n) => {
    if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
  };

  show(1);
  if (page > 3) pages.push('...');
  show(page - 1);
  show(page);
  show(page + 1);
  if (page < totalPages - 2) pages.push('...');
  show(totalPages);

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        aria-label="Previous page"
      >
        <CaretLeft size={16} weight="bold" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1 text-taqon-muted dark:text-white/30 text-sm select-none">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[36px] h-9 rounded-xl text-sm font-semibold transition-all ${
              p === page
                ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                : 'border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        aria-label="Next page"
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </div>
  );
}
