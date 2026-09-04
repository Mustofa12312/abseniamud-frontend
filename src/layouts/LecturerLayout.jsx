import { Outlet } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Clock, LogOut, User, FileText } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "../utils/utils"
import ThemeToggle from "../components/ui/ThemeToggle"

export default function LecturerLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: "Beranda", icon: Home, path: "/lecturer", active: location.pathname === "/lecturer" },
    { label: "Riwayat", icon: Clock, path: "/lecturer/history", active: location.pathname.includes("history") },
    { label: "Koreksi", icon: FileText, path: "/lecturer/corrections", active: location.pathname.includes("corrections") },
    { label: "Profil", icon: User, path: "/lecturer/profile", active: location.pathname.includes("profile") },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar for Mobile */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xs">IA</span>
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100">IAIMU Absensi</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button 
            onClick={() => navigate("/login")}
            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto relative pb-20 sm:pb-8">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 sm:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-16 h-full text-slate-500"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-brand-50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  size={24}
                  className={cn(
                    "relative z-10 transition-colors duration-200",
                    isActive ? "text-brand-600" : "text-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium mt-1 relative z-10 transition-colors duration-200",
                    isActive ? "text-brand-600" : "text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
