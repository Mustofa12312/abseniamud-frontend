import { cn } from "../../utils/utils";

/**
 * Shared Apple Light page title & action toolbar header.
 */
export function PageHeader({ title, description, actions, badge, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-slate-100">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-[#86868B] dark:text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

