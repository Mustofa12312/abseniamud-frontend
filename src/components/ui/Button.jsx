import { cn } from "../../utils/utils"
import { forwardRef } from "react"
import { Loader2 } from "lucide-react"

const Button = forwardRef(({ className, variant = "primary", size = "default", isLoading = false, children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg shadow-brand-600/20",
    secondary: "bg-brand-100 text-brand-900 hover:bg-brand-200",
    outline: "border-2 border-brand-200 bg-transparent hover:bg-brand-50 text-brand-700",
    ghost: "hover:bg-brand-50 text-brand-700",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20",
  }

  const sizes = {
    default: "h-11 px-4 py-2",
    sm: "h-9 px-3 text-xs",
    lg: "h-14 px-8 text-base",
    icon: "h-10 w-10",
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
Button.displayName = "Button"

export { Button }
