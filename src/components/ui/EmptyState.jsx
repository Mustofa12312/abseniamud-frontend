import { FileSearch } from "lucide-react"

export function EmptyState({ 
  icon: Icon = FileSearch, 
  title = "Tidak Ada Data", 
  description = "Belum ada data yang dapat ditampilkan saat ini.",
  action = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center h-full w-full">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
