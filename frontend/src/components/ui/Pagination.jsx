import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-slate-500 dark:text-slate-400">
      <span>Showing {start}-{end} of {total}</span>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary !px-2 !py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          className="btn-secondary !px-2 !py-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
