import { forwardRef } from "react"
import { cn } from "../../utils/utils"

const Badge = forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-slate-100 text-slate-800",
    primary: "bg-brand-100 text-brand-800 border border-brand-200",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
