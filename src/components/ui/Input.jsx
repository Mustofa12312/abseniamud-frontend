import { forwardRef } from "react"
import { cn } from "../../utils/utils"

const Input = forwardRef(({ className, type, icon: Icon, error, ...props }, ref) => {
  return (
    <div className="w-full relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
          Icon && "pl-10",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
