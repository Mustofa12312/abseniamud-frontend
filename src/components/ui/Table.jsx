import { forwardRef } from "react";
import { cn } from "../../utils/utils";

const Table = forwardRef(({ className, containerClassName, ...props }, ref) => (
  <div
    className={cn(
      "relative w-full overflow-x-auto rounded-2xl border border-[#E5E5EA] dark:border-slate-700/60 bg-white dark:bg-slate-800/85 shadow-[0_2px_10px_rgb(0,0,0,0.03)] dark:shadow-none",
      containerClassName
    )}
  >
    <table ref={ref} className={cn("w-full caption-bottom text-sm text-left", className)} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b bg-[#F9F9FB] dark:bg-slate-900/60 border-[#E5E5EA] dark:border-slate-700/60", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-[#F2F2F7] dark:border-slate-700/40 transition-colors hover:bg-[#F9F9FB] dark:hover:bg-slate-700/30 data-[state=selected]:bg-emerald-50/50 dark:data-[state=selected]:bg-emerald-950/20",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 sm:px-5 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 sm:px-5 py-3.5 align-middle text-sm text-[#1D1D1F] dark:text-slate-200 [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
