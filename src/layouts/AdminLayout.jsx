import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, Users, MapPin, CalendarDays, 
  FileText, Settings, ShieldCheck, Menu, X, Bell, UserCircle, UserCheck, LogOut, GraduationCap, BookOpen
} from "lucide-react"
import { cn } from "../utils/utils"
import ThemeToggle from "../components/ui/ThemeToggle"
import { useAuth } from "../contexts/AuthContext"

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const menuGroups = [
    {
      title: "Utama",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: ShieldCheck, label: "Monitoring Presensi", path: "/admin/monitoring" },
        { icon: FileText, label: "Koreksi Presensi", path: "/admin/corrections" },
      ]
    },
    {
      title: "Data Master",
      items: [
        { icon: CalendarDays, label: "Tahun Akademik", path: "/admin/academic-years" },
        { icon: UserCheck, label: "Pengguna & Hak Akses", path: "/admin/users" },
        { icon: Users, label: "Data Dosen", path: "/admin/lecturers" },
        { icon: MapPin, label: "Master Lokasi", path: "/admin/locations" },
        { icon: MapPin, label: "Master Ruangan", path: "/admin/rooms" },
        { icon: GraduationCap, label: "Fakultas / Prodi", path: "/admin/faculties" },
        { icon: BookOpen, label: "Mata Kuliah", path: "/admin/courses" },
        { icon: CalendarDays, label: "Jadwal", path: "/admin/schedules" },
      ]
    },
    {
      title: "Laporan & Sistem",
      items: [
        { icon: FileText, label: "Laporan", path: "/admin/reports" },
        { icon: ShieldCheck, label: "Audit Log", path: "/admin/audit-logs" },
        { icon: Settings, label: "Pengaturan", path: "/admin/settings" },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-20 shadow-sm"
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-200 justify-between">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="h-9 w-9 min-w-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold">
              IA
            </div>
            {sidebarOpen && <span className="font-bold text-slate-800 text-lg">IAIMU Admin</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                        isActive 
                          ? "text-brand-700 bg-brand-50" 
                          : "text-slate-600 hover:text-brand-600 hover:bg-slate-100"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeAdminTab"
                          className="absolute left-0 top-1 bottom-1 w-1 bg-brand-600 rounded-r-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon size={20} className={cn("min-w-5", isActive ? "text-brand-600" : "text-slate-400 group-hover:text-brand-500")} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hidden md:block"
            >
              <Menu size={20} />
            </button>
            {/* Mobile menu trigger could go here */}
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Dashboard Admin</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Notification Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-700">Notifikasi</span>
                      <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">1 Baru</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">Ada 3 pengajuan koreksi presensi baru menunggu persetujuan.</p>
                          <p className="text-xs text-slate-400 mt-1">10 menit yang lalu</p>
                        </div>
                      </div>
                      <div className="p-3 hover:bg-slate-50 cursor-pointer flex gap-3 opacity-60">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <ShieldCheck size={14} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">Sistem berhasil diupdate ke versi terbaru.</p>
                          <p className="text-xs text-slate-400 mt-1">2 hari yang lalu</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 border-t border-slate-100 text-center">
                      <button className="text-xs font-medium text-brand-600 hover:text-brand-700">Tandai semua dibaca</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200"></div>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">{user?.name || 'Super Admin'}</p>
                  <p className="text-xs text-slate-500">{user?.email || 'admin@iaimu.ac.id'}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                  <UserCircle size={20} />
                </div>
              </button>
              
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden py-1">
                    <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                      <p className="text-sm font-medium text-slate-700">{user?.name || 'Super Admin'}</p>
                      <p className="text-xs text-slate-500">{user?.email || 'admin@iaimu.ac.id'}</p>
                    </div>
                    <button 
                      onClick={() => { setIsProfileOpen(false); navigate('/admin/settings'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings size={16} className="text-slate-400" />
                      Pengaturan Akun
                    </button>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut size={16} className="text-rose-500" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
