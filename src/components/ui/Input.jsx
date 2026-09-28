import { forwardRef, useState } from "react"
import { cn } from "../../utils/utils"
import { Eye, EyeOff } from "lucide-react"

const Input = forwardRef(({ className, type, icon: Icon, error, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  
  const isPassword = type === "password"
  const currentType = isPassword && showPassword ? "text" : type

  return (
    <div className="w-full relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={currentType}
        className={cn(
          "flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
          Icon && "pl-10",
          isPassword && "pr-10",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      
      {isPassword && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex="-1"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
