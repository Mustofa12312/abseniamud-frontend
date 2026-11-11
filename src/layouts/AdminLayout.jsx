import { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  FileText,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Bell,
  UserCheck,
  LogOut,
  GraduationCap,
  BookOpen,
  Briefcase,
  Award,
  Building2,
  CheckCheck,
  Megaphone,
} from "lucide-react";
import { cn } from "../utils/utils";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import { adminService } from "../services/admin";
import { featureService } from "../services/features";
import api from "../services/api";
import { getRoleDisplayLabel, isAcademicAdmin, resolveUserRole } from "../utils/rbac";

const getNotifReadKey = (userId) => `iaimu_admin_notif_read_sig_${userId || "anon"}`;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const notifReadKey = getNotifReadKey(user?.id);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readState, setReadState] = useState(() => ({
    key: getNotifReadKey(user?.id),
    sig: localStorage.getItem(getNotifReadKey(user?.id)) || "",
  }));

  const navigate = useNavigate();
  const location = useLocation();

  const readSig =
    readState.key === notifReadKey ? readState.sig : localStorage.getItem(notifReadKey) || "";

  const userRole = resolveUserRole(user);
  const academicAdmin = isAcademicAdmin(user);

  const menuGroups = useMemo(() => {
    if (userRole === "admin_keuangan") {
      return [
        {
          title: "Utama",
          items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
            { icon: FileText, label: "Laporan", path: "/admin/reports" },
          ],
        },
      ];
    }

    return [
      {
        title: "Utama",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
          { icon: ShieldCheck, label: "Monitoring Presensi", path: "/admin/monitoring" },
          { icon: FileText, label: "Koreksi Presensi", path: "/admin/corrections" },
          { icon: Bell, label: "Pengumuman", path: "/admin/announcements" },
          { icon: FileText, label: "Persetujuan Izin", path: "/admin/leaves" },
        ],
      },
      {
        title: "Data Master",
        items: [
          { icon: CalendarDays, label: "Tahun Akademik", path: "/admin/academic-years" },
          { icon: UserCheck, label: "Pengguna & Hak Akses", path: "/admin/users" },
          { icon: Users, label: "Data Dosen", path: "/admin/lecturers" },
          { icon: Briefcase, label: "Tendik", path: "/admin/staff" },
          { icon: Award, label: "Jabatan", path: "/admin/positions" },
          { icon: FileText, label: "Penugasan Dosen", path: "/admin/assignments" },
          { icon: MapPin, label: "Master Lokasi", path: "/admin/locations" },
          { icon: Building2, label: "Master Ruangan", path: "/admin/rooms" },
          { icon: GraduationCap, label: "Fakultas / Prodi", path: "/admin/faculties" },
          { icon: BookOpen, label: "Mata Kuliah", path: "/admin/courses" },
          { icon: CalendarDays, label: "Jadwal", path: "/admin/schedules" },
        ],
      },
      {
        title: "Laporan & Sistem",
        items: [
          { icon: FileText, label: "Laporan", path: "/admin/reports" },
          { icon: ShieldCheck, label: "Audit Log", path: "/admin/audit-logs" },
          { icon: Settings, label: "Pengaturan", path: "/admin/settings" },
        ],
      },
    ];
  }, [userRole]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const items = [];
      const [corrRes, leavesRes, annRes] = await Promise.allSettled([
        academicAdmin ? adminService.getCorrections({ status: "PENDING", per_page: 10 }) : Promise.resolve(null),
        academicAdmin ? api.get("/admin/leaves?status=PENDING") : Promise.resolve(null),
        featureService.getAnnouncements(),
      ]);

      if (leavesRes.status === "fulfilled" && leavesRes.value?.data?.success) {
        const leavePayload = leavesRes.value.data.data;
        const leaveList = Array.isArray(leavePayload) ? leavePayload : leavePayload?.data || [];
        const pendingLeaves =
          leavePayload?.total ??
          leaveList.filter((l) => String(l.status).toUpperCase() === "PENDING").length;
        if (pendingLeaves > 0) {
          items.push({
            id: `leaves-${pendingLeaves}`,
            icon: FileText,
            color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
            message: `${pendingLeaves} pengajuan izin menunggu persetujuan admin.`,
            meta: "Klik untuk tinjau izin",
            path: "/admin/leaves",
          });
        }
      }

      if (corrRes.status === "fulfilled" && corrRes.value?.success) {
        const corrList = Array.isArray(corrRes.value.data) ? corrRes.value.data : [];
        const corrMeta = corrRes.value.meta;
        const pendingCorr =
          corrMeta?.pending_total ??
          corrMeta?.total ??
          corrList.filter((c) => String(c.status).toUpperCase() === "PENDING").length;
        if (pendingCorr > 0) {
          items.push({
            id: `corr-${pendingCorr}`,
            icon: ShieldCheck,
            color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
            message: `${pendingCorr} koreksi presensi menunggu verifikasi.`,
            meta: "Klik untuk proses koreksi",
            path: "/admin/corrections",
          });
        }
      }

      if (annRes.status === "fulfilled" && annRes.value?.success) {
        const announcements = Array.isArray(annRes.value.data) ? annRes.value.data : [];
        if (announcements.length > 0) {
          const latest = announcements[0];
          items.push({
            id: `ann-${latest.id}`,
            icon: Megaphone,
            color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
            message: `Pengumuman terbaru: ${latest.title}`,
            meta: latest.created_at
              ? new Date(latest.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
              : "Pengumuman Kampus",
            path: academicAdmin ? "/admin/announcements" : "/admin",
          });
        }
      }

      setNotifications(items);
    } catch {
      // Non-critical notification banner failure should stay silent
    }
  }, [user, academicAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadNotifications]);

  const currentNotifSig = useMemo(() => notifications.map((n) => n.id).join("|"), [notifications]);
  const unreadCount = notifications.length > 0 && currentNotifSig !== readSig ? notifications.length : 0;

  const markAllAsRead = () => {
    localStorage.setItem(notifReadKey, currentNotifSig);
    setReadState({ key: notifReadKey, sig: currentNotifSig });
  };

  const allMenuItems = menuGroups.flatMap((g) => g.items);
  const currentItem = allMenuItems.find((item) => item.path === location.pathname);
  const currentTitle = currentItem?.label
    ? currentItem.label === "Dashboard"
      ? "Dashboard Admin"
      : currentItem.label
    : "Dashboard Admin";

  const getInitials = (name) => {
    if (!name) return "SA";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="h-screen flex overflow-hidden text-[#1D1D1F] dark:text-slate-100 bg-[#F5F5F7] dark:bg-slate-900 font-sans">
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 76 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-[#E5E5EA] dark:border-slate-800 hidden md:flex flex-col shrink-0 select-none z-20 transition-all overflow-hidden"
        data-purpose="sidebar-navigation"
      >
        {sidebarOpen ? (
          <div className="h-16 px-5 flex items-center gap-3 border-b border-[#F0F0F2] dark:border-slate-800 shrink-0">
            <div className="w-9 h-9 min-w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-emerald-600/20">
              IA
            </div>
            <div className="overflow-hidden">
              <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-white leading-tight truncate">
                IAIMU Admin
              </h1>
              <p className="text-[11px] font-medium text-[#86868B] dark:text-slate-400 truncate">
                Sistem Presensi Kampus
              </p>
            </div>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center border-b border-[#F0F0F2] dark:border-slate-800 shrink-0">
            <div className="w-9 h-9 min-w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-emerald-600/20">
              IA
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 custom-scrollbar text-[13px] font-medium">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              {sidebarOpen && (
                <span className="px-2.5 text-[10px] font-semibold tracking-wider text-[#86868B] dark:text-slate-400 uppercase">
                  {group.title}
                </span>
              )}
              <ul className={cn("space-y-1", sidebarOpen ? "mt-2" : "mt-1")}>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <button
                        type="button"
                        onClick={() => navigate(item.path)}
                        title={!sidebarOpen ? item.label : undefined}
                        className={cn(
                          "w-full flex items-center rounded-xl transition-all cursor-pointer",
                          sidebarOpen ? "gap-2.5 px-3 py-2 text-left" : "justify-center p-2.5",
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)] dark:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]"
                            : "text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white hover:bg-[#F0F0F3] dark:hover:bg-slate-800"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"
                          )}
                          strokeWidth={isActive ? 2 : 1.8}
                        />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-[#E5E5EA] dark:border-slate-800 flex flex-col z-50 shadow-apple-hover md:hidden"
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-[#F0F0F2] dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-emerald-600/20">
                    IA
                  </div>
                  <div>
                    <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-white leading-tight">
                      IAIMU Admin
                    </h1>
                    <p className="text-[11px] font-medium text-[#86868B] dark:text-slate-400">Sistem Presensi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 custom-scrollbar text-[13px] font-medium">
                {menuGroups.map((group, idx) => (
                  <div key={idx}>
                    <span className="px-2.5 text-[10px] font-semibold tracking-wider text-[#86868B] dark:text-slate-400 uppercase">
                      {group.title}
                    </span>
                    <ul className="mt-2 space-y-1">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <li key={item.path}>
                            <button
                              type="button"
                              onClick={() => {
                                navigate(item.path);
                                setMobileMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left",
                                isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]"
                                  : "text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white hover:bg-[#F0F0F3] dark:hover:bg-slate-800"
                              )}
                            >
                              <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2 : 1.8} />
                              <span className="truncate">{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Topbar Apple Header */}
        <header
          className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-[#E5E5EA] dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between z-10 shrink-0"
          data-purpose="topbar-header"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-neutral-500 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hidden md:flex items-center justify-center transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-neutral-500 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 md:hidden flex items-center justify-center transition-colors cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
              {currentTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Live Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifikasi"
                onClick={() => {
                  const next = !isNotifOpen;
                  setIsNotifOpen(next);
                  setIsProfileOpen(false);
                  if (next) loadNotifications();
                }}
                className="w-9 h-9 rounded-full relative flex items-center justify-center text-[#86868B] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#EBEBED] dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-[#F0F0F2] dark:border-slate-700 flex justify-between items-center bg-neutral-50/50 dark:bg-slate-800">
                      <span className="font-semibold text-xs text-[#1D1D1F] dark:text-white">Notifikasi</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount > 0 ? `${unreadCount} Baru` : "Semua dibaca"}
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#F5F5F7] dark:divide-slate-700/50 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#86868B] dark:text-slate-400">
                          Tidak ada notifikasi pending saat ini.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const NIcon = n.icon;
                          const isRead = unreadCount === 0;
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                setIsNotifOpen(false);
                                navigate(n.path);
                              }}
                              className={cn(
                                "w-full text-left p-3 hover:bg-[#F5F5F7] dark:hover:bg-slate-700/50 cursor-pointer flex gap-3 transition-colors",
                                isRead && "opacity-70"
                              )}
                            >
                              <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", n.color)}>
                                <NIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-[#1D1D1F] dark:text-slate-200 leading-snug">{n.message}</p>
                                <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-1">{n.meta}</p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-[#F0F0F2] dark:border-slate-700 text-center">
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Tandai semua dibaca
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="h-5 w-[1px] bg-[#E5E5EA] dark:bg-slate-700 mx-1" />

            {/* Profile Card */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-3 pl-1 text-left cursor-pointer group focus:outline-none"
              >
                <div className="text-right leading-none hidden sm:block">
                  <p className="text-[13px] font-semibold text-[#1D1D1F] dark:text-white group-hover:text-emerald-600 transition-colors">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">
                    {getRoleDisplayLabel(user)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-center text-xs ring-1 ring-emerald-500/20 shadow-sm transition-transform group-hover:scale-105">
                  {getInitials(user?.name)}
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 z-50 overflow-hidden py-1.5">
                    <div className="px-4 py-2 border-b border-[#F0F0F2] dark:border-slate-700">
                      <p className="text-[13px] font-semibold text-[#1D1D1F] dark:text-white truncate">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5 truncate">
                        {user?.email || "-"}
                      </p>
                    </div>
                    {academicAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate("/admin/settings");
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-slate-200 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-neutral-400" />
                        Pengaturan Akun
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-7 space-y-6 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
