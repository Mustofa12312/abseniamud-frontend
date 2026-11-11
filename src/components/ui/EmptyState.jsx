import { FileSearch } from "lucide-react";

export function EmptyState({
  icon: Icon = FileSearch,
  title = "Tidak Ada Data",
  description = "Belum ada data yang dapat ditampilkan saat ini.",
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center w-full">
      <div className="w-14 h-14 bg-[#F5F5F7] dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-[#86868B] dark:text-slate-400">
        <Icon size={26} />
      </div>
      <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-slate-100 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#86868B] dark:text-slate-400 max-w-sm mb-5">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
