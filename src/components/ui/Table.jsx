import { forwardRef } from "react"
import { cn } from "../../utils/utils"

const Table = forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b bg-slate-50", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
