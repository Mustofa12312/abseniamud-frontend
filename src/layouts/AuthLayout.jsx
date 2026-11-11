import { Outlet } from "react-router-dom";
import ThemeToggle from "../components/ui/ThemeToggle";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-[#F5F5F7] dark:bg-slate-950 text-[#1D1D1F] dark:text-slate-100 relative overflow-hidden transition-colors">
      {/* Subtle Apple Light Ambient Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-400/15 dark:bg-emerald-600/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-400/15 dark:bg-teal-600/15 blur-[100px]" />
      </div>

      {/* Top Right Theme Switcher */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
