import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/utils";

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Shared Apple Light accessible dialog container.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = "md",
  children,
  footer,
  className,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full bg-white dark:bg-slate-800 rounded-2xl border border-[#E5E5EA] dark:border-slate-700/70 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
          className
        )}
      >
        {(title || onClose) && (
          <div className="px-6 py-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex items-center justify-between gap-3 bg-[#F9F9FB] dark:bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-slate-100 truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-[#86868B] dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-slate-200 hover:bg-[#E5E5EA]/60 dark:hover:bg-slate-700 transition-colors shrink-0"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-[#F2F2F7] dark:border-slate-700/60 bg-[#F9F9FB] dark:bg-slate-900/50 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
