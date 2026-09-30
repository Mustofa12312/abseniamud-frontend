import { useState, useEffect, useCallback } from "react"
import { MapPin, Clock, Calendar, CheckCircle2, XCircle, LogIn, LogOut, AlertCircle, Loader2, PartyPopper, CheckCircle, FileX, Info, Send, Megaphone, ChevronRight, BookOpen, Lock, X, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent } from "../../components/ui/Card"
import { useAuth } from "../../contexts/AuthContext"
import { useGeolocation } from "../../hooks/useGeolocation"
import { attendanceService } from "../../services/attendance"
import { featureService } from "../../services/features"
import { useToast } from "../../contexts/ToastContext"

// Attendance status from API:
// NOT_CHECKED_IN  → belum absen sama sekali
// CHECKED_IN      → sudah check-in, belum check-out
// CHECKED_OUT     → sudah check-out

export default function LecturerDashboard() {
  const { success, error } = useToast()
  const [time, setTime] = useState(new Date())
  const { user } = useAuth()
  const { coordinates, loading: locationLoading, error: locationError, requestLocation } = useGeolocation()

  // Attendance state
  const [todayStatus, setTodayStatus] = useState(null)   // null = loading
  const [statusLoading, setStatusLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [monthlySummary, setMonthlySummary] = useState(null)
  
  // Success Modal State
  const [successModal, setSuccessModal] = useState(null)

  // Announcements & Features State
  const [announcements, setAnnouncements] = useState([])
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'Izin', start_date: '', end_date: '', reason: '' })
  const [submitLeaveLoading, setSubmitLeaveLoading] = useState(false)
  
  // Schedules State
  const [schedules, setSchedules] = useState({})
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [submittingPassword, setSubmittingPassword] = useState(false)

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      error("Konfirmasi password baru tidak cocok.")
      return
    }
    setSubmittingPassword(true)
    try {
      // Import authService from ../../services/auth inside or add to imports above
      const { authService } = await import('../../services/auth');
      const res = await authService.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      if (res.success) {
        success("Password berhasil diubah.")
        setShowPasswordModal(false)
        setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' })
      }
    } catch (err) {
      error(err.response?.data?.message || 'Gagal mengubah password.')
    } finally {
      setSubmittingPassword(false)
    }
  }

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch today's attendance status on mount
  const fetchTodayStatus = useCallback(async () => {
    try {
      setStatusLoading(true)
      const res = await attendanceService.getTodayStatus()
      if (res.success) {
        setTodayStatus(res.data)
      }
    } catch {
      // silently fail — user still sees UI
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayStatus()
    // Fetch monthly summary
    const fetchSummary = async () => {
      try {
        const now = new Date();
        const res = await attendanceService.getSummary(now.getMonth() + 1, now.getFullYear());
        if (res.success) setMonthlySummary(res.data);
      } catch (err) {}
    }
    // Fetch Announcements
    const fetchAnnouncements = async () => {
      try {
        const res = await featureService.getAnnouncements();
        if (res.success) setAnnouncements(res.data);
      } catch (err) {}
    }
    // Fetch Schedules
    const fetchSchedules = async () => {
      try {
        const res = await featureService.getSchedules();
        if (res.success) setSchedules(res.data);
      } catch (err) {}
    }
    
    fetchSummary()
    fetchAnnouncements()
    fetchSchedules()
  }, [fetchTodayStatus])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      const coords = await requestLocation()
      const res = await attendanceService.checkIn(coords)

      if (res.success) {
        await fetchTodayStatus() // re-fetch to update button state
        
        // Show professional success modal
        const now = new Date()
        setSuccessModal({
          type: 'masuk',
          time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          location: res.data?.location || (coordinates ? `Lokasi terbaca (±${Math.round(coordinates.accuracy)}m)` : 'Lokasi Anda'),
          message: 'Berhasil melakukan presensi masuk.'
        })
        
        // Auto close after 3 seconds
        setTimeout(() => setSuccessModal(null), 3500)
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err === "string" ? err : "Gagal melakukan check-in.")
      error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      const coords = await requestLocation()
      const res = await attendanceService.checkOut(coords)

      if (res.success) {
        await fetchTodayStatus()
        
        const now = new Date()
        setSuccessModal({
          type: 'pulang',
          time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          location: res.data?.location || (coordinates ? `Lokasi terbaca (±${Math.round(coordinates.accuracy)}m)` : 'Lokasi Anda'),
          message: 'Presensi pulang berhasil. Selamat beristirahat!'
        })
        
        setTimeout(() => setSuccessModal(null), 3500)
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err === "string" ? err : "Gagal melakukan check-out.")
      error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitLeave = async (e) => {
    e.preventDefault()
    try {
      setSubmitLeaveLoading(true)
      const res = await featureService.submitLeave(leaveForm)
      if (res.success) {
        success(res.message || "Pengajuan izin/cuti berhasil dikirim.")
        setShowLeaveModal(false)
        setLeaveForm({ type: 'Izin', start_date: '', end_date: '', reason: '' })
      }
    } catch (err) {
      error(err?.response?.data?.message || "Gagal mengirim pengajuan.")
    } finally {
      setSubmitLeaveLoading(false)
    }
  }

  // ─── Derived values ────────────────────────────────────────────────────────

  const status = todayStatus?.status ?? "NOT_CHECKED_IN"
  const canCheckIn  = status === "NOT_CHECKED_IN"
  const canCheckOut = status === "CHECKED_IN"
  const isLoading   = actionLoading || locationLoading

  const statusLabel = {
    NOT_CHECKED_IN: { text: "Belum Absen",   color: "text-slate-500",   bg: "bg-slate-100"  },
    CHECKED_IN:     { text: "Sudah Check-in", color: "text-teal-700",    bg: "bg-teal-50"    },
    CHECKED_OUT:    { text: "Selesai Hari Ini", color: "text-brand-700", bg: "bg-brand-50"   },
    HOLIDAY:        { text: "Hari Libur", color: "text-slate-500", bg: "bg-slate-100" },
  }[status] ?? { text: status, color: "text-slate-500", bg: "bg-slate-100" }

  return (
    <div className="space-y-6 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Halo, {user?.name || "Dosen"} 👋
          </h1>
          <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm">
            <Calendar size={14} />
            {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center border-2 border-brand-200">
          <span className="font-bold text-brand-700 text-lg">{user?.name?.charAt(0) || "D"}</span>
        </div>
      </div>

      {/* Clock Card */}
      <Card className="bg-gradient-to-br from-brand-600 to-teal-700 border-0 shadow-lg shadow-brand-900/20 text-white overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] rounded-full bg-white/10 blur-[40px]" />

        <CardContent className="p-6 relative z-10 flex flex-col items-center justify-center min-h-[160px]">
          <p className="text-brand-100 text-sm mb-1 font-medium tracking-wider uppercase flex items-center gap-1">
            <Clock size={13} /> Waktu Saat Ini
          </p>
          <div className="text-5xl font-bold tracking-tighter tabular-nums drop-shadow-sm">
            {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <MapPin size={14} className="text-teal-200" />
            <span className="text-teal-50">
              {locationError
                ? "Izin lokasi belum diberikan"
                : coordinates
                ? `Lokasi terbaca (±${Math.round(coordinates.accuracy)}m)`
                : "Menunggu lokasi..."}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Status Info */}
      {statusLoading ? (
        <div className="flex items-center justify-center gap-2 text-slate-400 py-3">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Memuat status presensi...</span>
        </div>
      ) : (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${statusLabel.bg}`}>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Status Presensi Hari Ini</p>
            <p className={`font-semibold text-sm ${statusLabel.color}`}>{statusLabel.text}</p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            {todayStatus?.check_in_at && (
              <p>Masuk: <span className="font-mono font-semibold text-slate-700">{todayStatus.check_in_at}</span></p>
            )}
            {todayStatus?.check_out_at && (
              <p>Pulang: <span className="font-mono font-semibold text-slate-700">{todayStatus.check_out_at}</span></p>
            )}
            {todayStatus?.location && (
              <p className="flex items-center gap-0.5 justify-end">
                <MapPin size={10} /> {todayStatus.location}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Location Error Warning */}
      {locationError && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>Izinkan akses lokasi pada browser untuk dapat melakukan presensi.</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {/* Check-In Button */}
        <Button
          size="lg"
          className="h-24 flex flex-col gap-2 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          onClick={handleCheckIn}
          disabled={isLoading || !canCheckIn || statusLoading}
        >
          {isLoading && canCheckIn ? (
            <Loader2 size={28} className="animate-spin opacity-90" />
          ) : (
            <LogIn size={28} className="opacity-90" />
          )}
          <span className="font-semibold text-base tracking-wide">MASUK</span>
        </Button>

        {/* Check-Out Button */}
        <Button
          variant="outline"
          size="lg"
          className="h-24 flex flex-col gap-2 rounded-2xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          onClick={handleCheckOut}
          disabled={isLoading || !canCheckOut || statusLoading}
        >
          {isLoading && canCheckOut ? (
            <Loader2 size={28} className="animate-spin opacity-90" />
          ) : (
            <LogOut size={28} className="opacity-90" />
          )}
          <span className="font-semibold text-base tracking-wide">PULANG</span>
        </Button>
      </div>

      {/* Done state message */}
      {status === "CHECKED_OUT" && (
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>Presensi hari ini selesai. Sampai jumpa besok!</span>
        </div>
      )}

      {/* Monthly Statistics Grid */}
      {monthlySummary && (
        <div className="space-y-3 mt-4">
          <h2 className="text-sm font-bold text-slate-700">Statistik Bulan Ini</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex flex-col">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CheckCircle size={16} className="text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-slate-800">{monthlySummary.hadir}</span>
              <span className="text-xs text-slate-500 font-medium">Hadir</span>
            </div>
            
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex flex-col">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Clock size={16} className="text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-slate-800">{monthlySummary.terlambat}</span>
              <span className="text-xs text-slate-500 font-medium">Terlambat</span>
            </div>
            
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex flex-col">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <XCircle size={16} className="text-red-600" />
              </div>
              <span className="text-2xl font-bold text-slate-800">{monthlySummary.tidak_hadir}</span>
              <span className="text-xs text-slate-500 font-medium">Tidak Hadir (Alpa)</span>
            </div>
            
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex flex-col">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                <FileX size={16} className="text-indigo-600" />
              </div>
              <span className="text-2xl font-bold text-slate-800">0</span>
              <span className="text-xs text-slate-500 font-medium">Izin / Sakit</span>
            </div>
          </div>
        </div>
      )}

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Informasi Kampus</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x gap-3 hide-scrollbar">
            {announcements.map((ann, idx) => (
              <div key={idx} className="snap-center shrink-0 w-[85%] bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Megaphone size={16} className="text-white" />
                  </div>
                  <div>
                    {ann.is_important && (
                      <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full mb-1 uppercase tracking-wider">
                        Penting
                      </span>
                    )}
                    <h3 className="font-bold text-sm leading-tight mb-1">{ann.title}</h3>
                    <p className="text-xs text-blue-100 line-clamp-2 leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-blue-200 mt-2 opacity-80">
                      Oleh: {ann.creator?.name || 'Admin'} • {new Date(ann.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Menu (App-like features) */}
      <div className="space-y-3 mt-4">
        <h2 className="text-sm font-bold text-slate-700">Menu Cepat</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Jadwal Mengajar</p>
                <p className="text-xs text-slate-500">Lihat jadwal kelas Anda</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
          
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <FileX size={18} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Ajukan Izin/Cuti</p>
                <p className="text-xs text-slate-500">Form pengajuan ketidakhadiran</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                <Info size={18} className="text-teal-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Informasi Kampus</p>
                <p className="text-xs text-slate-500">Pengumuman & kalender akademik</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Lock size={18} className="text-rose-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Ganti Password</p>
                <p className="text-xs text-slate-500">Perbarui kata sandi keamanan Anda</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
        </div>
      </div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm"
            >
              <div className={`p-8 text-center text-white ${successModal.type === 'masuk' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md"
                >
                  <CheckCircle2 size={40} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">
                  {successModal.type === 'masuk' ? 'Check-in Sukses!' : 'Check-out Sukses!'}
                </h2>
                <p className="text-white/80 text-sm">
                  {successModal.message}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock size={16} />
                    <span className="text-sm">Waktu {successModal.type === 'masuk' ? 'Masuk' : 'Pulang'}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{successModal.time}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin size={16} />
                    <span className="text-sm">Lokasi</span>
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-100 text-sm text-right max-w-[150px] truncate">
                    {successModal.location}
                  </span>
                </div>
                
                <Button 
                  className="w-full mt-4 rounded-xl h-12 text-base font-semibold"
                  onClick={() => setSuccessModal(null)}
                >
                  Tutup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Request Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end p-0 bg-slate-900/40 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
            onClick={() => setShowLeaveModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-md max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Ajukan Izin / Cuti</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Isi form di bawah untuk pengajuan ketidakhadiran</p>
                </div>
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="leaveForm" onSubmit={handleSubmitLeave} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Jenis Pengajuan</label>
                    <select 
                      className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white shadow-sm transition-all text-slate-700 font-medium"
                      value={leaveForm.type}
                      onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                      required
                    >
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Cuti">Cuti</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Dari Tanggal</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full border border-slate-200 rounded-xl pl-3 pr-2 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white shadow-sm transition-all text-slate-700 font-medium"
                          required 
                          value={leaveForm.start_date}
                          onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Sampai Tanggal</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full border border-slate-200 rounded-xl pl-3 pr-2 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white shadow-sm transition-all text-slate-700 font-medium"
                          required 
                          value={leaveForm.end_date}
                          onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                          min={leaveForm.start_date}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Alasan Lengkap</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white shadow-sm transition-all text-slate-700 resize-none leading-relaxed"
                      placeholder="Tuliskan alasan ketidakhadiran Anda secara detail..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    ></textarea>
                  </div>
                </form>
              </div>
              
              <div className="p-5 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <Button 
                  type="submit"
                  form="leaveForm"
                  className="w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98]"
                  disabled={submitLeaveLoading}
                >
                  {submitLeaveLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={18} className="mr-1" />
                  )}
                  <span className="text-base tracking-wide">Kirim Pengajuan</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end p-0 bg-slate-900/40 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 w-full rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-md max-h-[90vh] flex flex-col border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Jadwal Mengajar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar kelas yang Anda ampu</p>
                </div>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto space-y-5">
                {Object.keys(schedules).length === 0 ? (
                  <div className="text-center py-10">
                    <Loader2 size={30} className="animate-spin mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">Memuat jadwal...</p>
                  </div>
                ) : (
                  Object.keys(schedules).map((day) => {
                    const daySchedules = schedules[day];
                    if (daySchedules.length === 0) return null;
                    return (
                      <div key={day}>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{day}</h4>
                        <div className="space-y-2">
                          {daySchedules.map((schedule) => (
                            <div key={schedule.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-blue-50 flex flex-col items-center justify-center shrink-0 text-blue-700">
                                <span className="text-sm font-bold leading-none">{schedule.start_time.split(':')[0]}</span>
                                <span className="text-[10px] font-medium leading-none">{schedule.start_time.split(':')[1]}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-sm text-slate-800 truncate">{schedule.course_name}</h5>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><Clock size={12}/> {schedule.start_time} - {schedule.end_time}</span>
                                  <span className="flex items-center gap-1"><MapPin size={12}/> {schedule.room_name}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
                
                {Object.values(schedules).every(day => day.length === 0) && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar size={24} className="text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-700">Tidak ada jadwal</h4>
                    <p className="text-sm text-slate-500 mt-1">Anda belum memiliki jadwal kelas.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Password Modal */}
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Ganti Password</h3>
                  <p className="text-xs text-slate-500">Perbarui kata sandi akun Anda</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPasswordModal(false)} className="rounded-full bg-slate-100 hover:bg-slate-200">
                  <X size={18} />
                </Button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="password-form" onSubmit={handleSubmitPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Password Saat Ini</label>
                    <Input 
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Masukkan password Anda saat ini"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Password Baru</label>
                    <Input 
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Minimal 6 karakter"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
                    <Input 
                      type="password"
                      name="new_password_confirmation"
                      value={passwordData.new_password_confirmation}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Ketik ulang password baru"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 pt-2 border-t border-slate-100 bg-slate-50 mt-auto">
                <Button type="submit" form="password-form" className="w-full h-12 rounded-xl text-md font-semibold bg-brand-600 hover:bg-brand-700" disabled={submittingPassword}>
                  {submittingPassword ? (
                    <><Loader2 size={18} className="animate-spin mr-2" /> Menyimpan...</>
                  ) : (
                    <><Save size={18} className="mr-2" /> Simpan Password Baru</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
