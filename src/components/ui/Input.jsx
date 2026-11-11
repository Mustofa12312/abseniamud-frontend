import { forwardRef, useState } from "react";
import { cn } from "../../utils/utils";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(({ className, type, icon: Icon, error, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const currentType = isPassword && showPassword ? "text" : type;

  return (
    <div className="w-full relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] dark:text-slate-400 pointer-events-none">
          <Icon size={17} />
        </div>
      )}
      <input
        type={currentType}
        className={cn(
          "flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-slate-100 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#86868B] dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-xs",
          Icon && "pl-10",
          isPassword && "pr-10",
          error && "border-red-500 focus-visible:ring-red-500/35 focus-visible:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />

      {isPassword && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-slate-200 focus:outline-none p-1"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}

      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
