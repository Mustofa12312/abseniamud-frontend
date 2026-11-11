import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Clock, LogOut, User, FileText, HeartHandshake, CalendarDays, ShieldCheck } from "lucide-react";
import { cn } from "../utils/utils";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import { getRoleDisplayLabel, isAdminRole } from "../utils/rbac";

export default function LecturerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Beranda", icon: Home, path: "/lecturer", active: location.pathname === "/lecturer" },
    { label: "Riwayat", icon: Clock, path: "/lecturer/history", active: location.pathname.includes("history") },
    { label: "Jadwal", icon: CalendarDays, path: "/lecturer/schedules", active: location.pathname.includes("schedules") },
    { label: "Izin", icon: HeartHandshake, path: "/lecturer/leaves", active: location.pathname.includes("leaves") },
    { label: "Koreksi", icon: FileText, path: "/lecturer/corrections", active: location.pathname.includes("corrections") },
    { label: "Profil", icon: User, path: "/lecturer/profile", active: location.pathname.includes("profile") },
  ];

  const canSwitchToAdmin = isAdminRole(user);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 text-[#1D1D1F] dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-[#E5E5EA] dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/lecturer")}
            className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm ring-1 ring-emerald-600/20">
              <span className="text-white font-bold text-xs">IA</span>
            </div>
            <div>
              <span className="font-semibold text-sm sm:text-[15px] text-[#1D1D1F] dark:text-white block leading-tight">
                IAIMU Absensi
              </span>
              <span className="text-[11px] text-[#86868B] dark:text-slate-400 hidden sm:block">
                {getRoleDisplayLabel(user)}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Pills */}
          <nav className="hidden sm:flex items-center gap-1 bg-[#F5F5F7] dark:bg-slate-800/80 p-1 rounded-xl border border-[#E5E5EA] dark:border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                    item.active
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-[#86868B] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-200"
                  )}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {canSwitchToAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Kembali ke Panel Admin"
              >
                <ShieldCheck size={14} />
                Admin
              </button>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              title="Keluar"
              aria-label="Keluar"
              className="p-2 rounded-full text-[#86868B] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-24 sm:pb-10 relative">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[#E5E5EA] dark:border-slate-800 z-40 sm:hidden">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map((item) => {
            const isActive = item.active;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeLecturerTab"
                    className="absolute inset-x-1.5 inset-y-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40"
                    initial={false}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  className={cn(
                    "relative z-10 transition-colors duration-200",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-[#86868B] dark:text-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium mt-1 relative z-10 transition-colors duration-200",
                    isActive ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-[#86868B] dark:text-slate-400"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
