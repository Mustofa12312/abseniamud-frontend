import { cn } from "../../utils/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const Button = forwardRef(
  ({ className, variant = "primary", size = "default", isLoading = false, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer";

    const variants = {
      primary:
        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/15 dark:bg-emerald-600 dark:hover:bg-emerald-500",
      secondary:
        "bg-[#F5F5F7] dark:bg-slate-800 text-[#1D1D1F] dark:text-slate-200 hover:bg-[#E8E8ED] dark:hover:bg-slate-700 border border-[#E5E5EA] dark:border-slate-700",
      outline:
        "border border-[#D2D2D7] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 text-[#1D1D1F] dark:text-slate-200",
      ghost:
        "hover:bg-[#F5F5F7] dark:hover:bg-slate-800 text-[#1D1D1F] dark:text-slate-300",
      danger:
        "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/15",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs rounded-lg",
      lg: "h-12 px-6 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant] || variants.primary, sizes[size] || sizes.default, className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
