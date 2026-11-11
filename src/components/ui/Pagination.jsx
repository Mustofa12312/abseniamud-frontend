import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared Apple Light pagination bar.
 */
export function Pagination({
  currentPage = 1,
  lastPage = 1,
  total = 0,
  from = null,
  to = null,
  onPageChange,
  itemLabel = "data",
}) {
  if (lastPage <= 1 && total === 0) return null;

  return (
    <div className="px-5 py-3.5 border-t border-[#F2F2F7] dark:border-slate-700/60 bg-[#F9F9FB]/70 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868B] dark:text-slate-400">
      <span>
        {from !== null && to !== null ? (
          <>
            Menampilkan <strong className="text-[#1D1D1F] dark:text-slate-200">{from}–{to}</strong> dari{" "}
            <strong className="text-[#1D1D1F] dark:text-slate-200">{total}</strong> {itemLabel}
          </>
        ) : (
          <>
            Total <strong className="text-[#1D1D1F] dark:text-slate-200">{total}</strong> {itemLabel} • Halaman{" "}
            <strong className="text-[#1D1D1F] dark:text-slate-200">{currentPage}</strong> / {lastPage}
          </>
        )}
      </span>

      {lastPage > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-2.5 rounded-lg border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1D1D1F] dark:text-slate-200 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
          </button>
          <span className="px-2.5 font-medium text-[#1D1D1F] dark:text-slate-200">
            {currentPage} / {lastPage}
          </span>
          <button
            type="button"
            disabled={currentPage >= lastPage}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-2.5 rounded-lg border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1D1D1F] dark:text-slate-200 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 transition-colors"
          >
            Berikutnya <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
