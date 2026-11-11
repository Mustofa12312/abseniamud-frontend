import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileX,
  Send,
  Megaphone,
  ChevronRight,
  Lock,
  Save,
  Smartphone,
  Palmtree,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { attendanceService } from "../../services/attendance";
import { featureService } from "../../services/features";
import { authService } from "../../services/auth";
import { useToast } from "../../contexts/ToastContext";
import { getRoleDisplayLabel } from "../../utils/rbac";

export default function LecturerDashboard() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const { user } = useAuth();
  const { coordinates, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();

  // Attendance state
  const [todayStatus, setTodayStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // Announcements & Schedules & Modals
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: "IZIN", start_date: "", end_date: "", reason: "" });
  const [submitLeaveLoading, setSubmitLeaveLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const res = await attendanceService.getTodayStatus();
      if (res.success) {
        setTodayStatus(res.data);
      }
    } catch {
      // Keep UI interactive if transient failure happens
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
    const now = new Date();
    Promise.allSettled([
      attendanceService.getSummary(now.getMonth() + 1, now.getFullYear()),
      featureService.getAnnouncements(),
      featureService.getSchedules(),
    ]).then(([sumRes, annRes, schRes]) => {
      if (sumRes.status === "fulfilled" && sumRes.value?.success) {
        setMonthlySummary(sumRes.value.data);
      }
      if (annRes.status === "fulfilled" && annRes.value?.success) {
        setAnnouncements(annRes.value.data || []);
      }
      if (schRes.status === "fulfilled" && schRes.value?.success) {
        setSchedules(schRes.value.data || {});
      }
    });
  }, [fetchTodayStatus]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const coords = await requestLocation();
      const res = await attendanceService.checkIn(coords);
      if (res.success) {
        await fetchTodayStatus();
        const now = new Date();
        setSuccessModal({
          type: "masuk",
          time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          location:
            res.data?.location ||
            (coordinates ? `Lokasi terbaca (±${Math.round(coordinates.accuracy)}m)` : "Lokasi Kampus"),
          message: "Berhasil melakukan presensi masuk.",
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (typeof err === "string" ? err : "Gagal melakukan check-in.");
      error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const coords = await requestLocation();
      const res = await attendanceService.checkOut(coords);
      if (res.success) {
        await fetchTodayStatus();
        const now = new Date();
        setSuccessModal({
          type: "pulang",
          time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          location:
            res.data?.location ||
            (coordinates ? `Lokasi terbaca (±${Math.round(coordinates.accuracy)}m)` : "Lokasi Kampus"),
          message: "Presensi pulang berhasil. Selamat beristirahat!",
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (typeof err === "string" ? err : "Gagal melakukan check-out.");
      error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    try {
      setSubmitLeaveLoading(true);
      const res = await featureService.submitLeave(leaveForm);
      if (res.success) {
        success(res.message || "Pengajuan izin/cuti berhasil dikirim.");
        setShowLeaveModal(false);
        setLeaveForm({ type: "IZIN", start_date: "", end_date: "", reason: "" });
      }
    } catch (err) {
      error(err?.response?.data?.message || "Gagal mengirim pengajuan.");
    } finally {
      setSubmitLeaveLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    setSubmittingPassword(true);
    try {
      const res = await authService.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });
      if (res.success) {
        success("Kata sandi berhasil diubah.");
        setShowPasswordModal(false);
        setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengubah kata sandi.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const status = todayStatus?.status ?? "NOT_CHECKED_IN";
  const canCheckIn = status === "NOT_CHECKED_IN";
  const canCheckOut = status === "CHECKED_IN";
  const isLoading = actionLoading || locationLoading;

  const statusMeta =
    {
      NOT_CHECKED_IN: {
        text: "Belum Absen",
        color: "text-[#1D1D1F] dark:text-slate-200",
        bg: "bg-white dark:bg-slate-800/85 border-[#E5E5EA] dark:border-slate-700/60",
      },
      CHECKED_IN: {
        text: "Sudah Check-in",
        color: "text-emerald-700 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50",
      },
      CHECKED_OUT: {
        text: "Selesai Hari Ini",
        color: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/50",
      },
      HOLIDAY: {
        text: todayStatus?.holiday_name ? `Hari Libur (${todayStatus.holiday_name})` : "Hari Libur",
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50",
      },
    }[status] || {
      text: status,
      color: "text-[#1D1D1F] dark:text-slate-200",
      bg: "bg-white dark:bg-slate-800/85 border-[#E5E5EA] dark:border-slate-700/60",
    };

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
            Halo, {user?.name || "Pengguna"}
          </h1>
          <p className="text-[#86868B] dark:text-slate-400 flex items-center gap-1.5 mt-1 text-xs sm:text-sm">
            <Calendar size={14} />
            {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            <span className="hidden sm:inline text-[#D2D2D7] dark:text-slate-700">•</span>
            <span className="hidden sm:inline font-medium text-emerald-700 dark:text-emerald-400">
              {getRoleDisplayLabel(user)}
            </span>
          </p>
        </div>

        <Link
          to="/lecturer/profile"
          className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-center hover:scale-105 transition-transform shrink-0"
          title="Lihat Profil"
        >
          <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-base">
            {user?.name?.charAt(0)?.toUpperCase() || "P"}
          </span>
        </Link>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clock + Geofence + Action */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 border-0 shadow-lg shadow-emerald-900/15 text-white overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <CardContent className="p-6 sm:p-7 relative z-10 flex flex-col items-center justify-center min-h-[168px]">
              <p className="text-emerald-100 text-xs mb-1.5 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Clock size={13} /> Waktu Saat Ini
              </p>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">
                {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-xs">
                <MapPin size={13} className="text-emerald-200 shrink-0" />
                <span className="text-emerald-50">
                  {locationError
                    ? "Izin lokasi belum diberikan"
                    : coordinates
                    ? `Lokasi terbaca (±${Math.round(coordinates.accuracy)}m)`
                    : "Menunggu lokasi GPS..."}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Today Status Banner */}
          {statusLoading ? (
            <div className="flex items-center justify-center gap-2 text-[#86868B] py-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-[#E5E5EA] dark:border-slate-700/60">
              <Loader2 size={16} className="animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Memuat status presensi...</span>
            </div>
          ) : (
            <div className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border ${statusMeta.bg}`}>
              <div>
                <p className="text-[11px] font-medium text-[#86868B] dark:text-slate-400 mb-0.5">
                  Status Presensi Hari Ini
                </p>
                <p className={`font-semibold text-sm flex items-center gap-1.5 ${statusMeta.color}`}>
                  {status === "HOLIDAY" && <Palmtree size={15} />}
                  {statusMeta.text}
                </p>
              </div>
              <div className="text-right text-xs text-[#86868B] dark:text-slate-400 space-y-0.5">
                {todayStatus?.check_in_at && (
                  <p>
                    Masuk:{" "}
                    <span className="font-mono font-semibold text-[#1D1D1F] dark:text-slate-200">
                      {todayStatus.check_in_at}
                    </span>
                  </p>
                )}
                {todayStatus?.check_out_at && (
                  <p>
                    Pulang:{" "}
                    <span className="font-mono font-semibold text-[#1D1D1F] dark:text-slate-200">
                      {todayStatus.check_out_at}
                    </span>
                  </p>
                )}
                {todayStatus?.location && (
                  <p className="flex items-center gap-1 justify-end">
                    <MapPin size={11} /> {todayStatus.location}
                  </p>
                )}
              </div>
            </div>
          )}

          {locationError && (
            <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 rounded-2xl px-4 py-3 text-xs sm:text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>Izinkan akses lokasi pada browser untuk melakukan presensi masuk dan pulang.</span>
            </div>
          )}

          {/* Check-in & Check-out Buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            <Button
              size="lg"
              className="h-22 flex-col gap-1.5 rounded-2xl"
              onClick={handleCheckIn}
              disabled={isLoading || !canCheckIn || statusLoading}
            >
              {isLoading && canCheckIn ? <Loader2 size={24} className="animate-spin" /> : <LogIn size={24} />}
              <span className="font-semibold text-sm tracking-wide">MASUK</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-22 flex-col gap-1.5 rounded-2xl border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50"
              onClick={handleCheckOut}
              disabled={isLoading || !canCheckOut || statusLoading}
            >
              {isLoading && canCheckOut ? <Loader2 size={24} className="animate-spin" /> : <LogOut size={24} />}
              <span className="font-semibold text-sm tracking-wide">PULANG</span>
            </Button>
          </div>

          {status === "CHECKED_OUT" && (
            <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 rounded-2xl px-4 py-3 text-xs sm:text-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Presensi hari ini selesai. Sampai jumpa besok!</span>
            </div>
          )}

          {/* Mobile App Banner */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800/85 border border-[#E5E5EA] dark:border-slate-700/60 rounded-2xl p-3.5 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Smartphone size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-100">
                  Aplikasi Resmi IAIMU Mobile Android
                </p>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                  Dilengkapi proteksi anti-mock GPS & binding perangkat resmi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats + Quick Menu + Announcements */}
        <div className="lg:col-span-5 space-y-5">
          {monthlySummary && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400">
                Statistik Bulan Ini
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 pt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle size={17} />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">{monthlySummary.hadir}</p>
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400">Hadir</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 pt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Clock size={17} />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">{monthlySummary.terlambat}</p>
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400">Terlambat</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 pt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <XCircle size={17} />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">{monthlySummary.tidak_hadir}</p>
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400">Alpa</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 pt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <FileX size={17} />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">{monthlySummary.izin_sakit || 0}</p>
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400">Izin / Sakit</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Quick Menu */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400">
              Menu Cepat
            </h2>
            <Card className="overflow-hidden">
              <div className="divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Calendar size={17} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Jadwal Mengajar</p>
                      <p className="text-xs text-[#86868B] dark:text-slate-400">Lihat daftar kelas Anda</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#86868B]" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FileX size={17} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Ajukan Izin / Cuti</p>
                      <p className="text-xs text-[#86868B] dark:text-slate-400">Form pengajuan ketidakhadiran</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#86868B]" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Lock size={17} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Keamanan Akun</p>
                      <p className="text-xs text-[#86868B] dark:text-slate-400">Perbarui kata sandi masuk</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#86868B]" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Campus Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400">
            Informasi & Pengumuman Kampus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {announcements.slice(0, 4).map((ann) => (
              <Card key={ann.id} className="hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
                <CardContent className="p-4 pt-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Megaphone size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {ann.is_important && (
                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200/70 dark:border-red-800/50 text-[10px] font-semibold rounded-full uppercase">
                          Penting
                        </span>
                      )}
                      <h3 className="font-semibold text-sm truncate">{ann.title}</h3>
                    </div>
                    <p className="text-xs text-[#86868B] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                    <p className="text-[11px] text-[#86868B] dark:text-slate-500 mt-2">
                      {ann.creator?.name || "Admin"} •{" "}
                      {new Date(ann.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Success Modal */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 16, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm border border-[#E5E5EA] dark:border-slate-700"
            >
              <div
                className={`p-7 text-center text-white ${
                  successModal.type === "masuk"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={34} className="text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1">
                  {successModal.type === "masuk" ? "Check-in Sukses!" : "Check-out Sukses!"}
                </h2>
                <p className="text-white/85 text-xs">{successModal.message}</p>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#F2F2F7] dark:border-slate-700">
                  <span className="text-[#86868B] dark:text-slate-400">Waktu</span>
                  <span className="font-semibold">{successModal.time}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#86868B] dark:text-slate-400">Lokasi</span>
                  <span className="font-medium truncate max-w-[180px]">{successModal.location}</span>
                </div>
                <Button className="w-full" onClick={() => setSuccessModal(null)}>
                  Tutup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Quick Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Ajukan Izin / Cuti"
        subtitle="Isi form ketidakhadiran dengan lengkap"
        icon={FileX}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
              Batal
            </Button>
            <Button type="submit" form="quickLeaveForm" isLoading={submitLeaveLoading}>
              {!submitLeaveLoading && <Send size={15} />} Kirim Pengajuan
            </Button>
          </>
        }
      >
        <form id="quickLeaveForm" onSubmit={handleSubmitLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 mb-1.5">
              Jenis Pengajuan
            </label>
            <select
              className="w-full h-10 rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              value={leaveForm.type}
              onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
              required
            >
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
              <option value="CUTI">Cuti</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Dari Tanggal</label>
              <Input
                type="date"
                required
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Sampai Tanggal</label>
              <Input
                type="date"
                required
                value={leaveForm.end_date}
                min={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Alasan Lengkap</label>
            <textarea
              required
              rows={3}
              className="w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
              placeholder="Tuliskan alasan ketidakhadiran Anda..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Schedule Quick Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Jadwal Mengajar"
        subtitle="Daftar kelas semester aktif"
        icon={Calendar}
        footer={
          <Button variant="outline" onClick={() => { setShowScheduleModal(false); navigate("/lecturer/schedules"); }}>
            Buka Halaman Jadwal Lengkap
          </Button>
        }
      >
        {Object.values(schedules).every((day) => !day || day.length === 0) ? (
          <div className="text-center py-8 text-sm text-[#86868B] dark:text-slate-400">
            Anda belum memiliki jadwal mengajar.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(schedules).map(([day, list]) => {
              if (!list || list.length === 0) return null;
              return (
                <div key={day}>
                  <h4 className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">{day}</h4>
                  <div className="space-y-2">
                    {list.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="rounded-xl p-3.5 bg-[#F9F9FB] dark:bg-slate-900/60 border border-[#E5E5EA] dark:border-slate-700/60 flex items-center gap-3"
                      >
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex flex-col items-center justify-center shrink-0 text-xs font-bold">
                          <span>{schedule.start_time?.slice(0, 5)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-sm truncate">{schedule.course_name}</h5>
                          <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">
                            {schedule.start_time} – {schedule.end_time} • {schedule.room_name || "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Ubah Kata Sandi"
        subtitle="Pastikan kata sandi baru minimal 6 karakter"
        icon={Lock}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Batal
            </Button>
            <Button type="submit" form="quickPasswordForm" isLoading={submittingPassword}>
              {!submittingPassword && <Save size={15} />} Simpan
            </Button>
          </>
        }
      >
        <form id="quickPasswordForm" onSubmit={handleSubmitPassword} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Kata Sandi Saat Ini</label>
            <Input
              type="password"
              required
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Kata Sandi Baru</label>
            <Input
              type="password"
              required
              minLength={6}
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <Input
              type="password"
              required
              minLength={6}
              value={passwordData.new_password_confirmation}
              onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
