import { useState, useEffect, useCallback } from "react"
import { MapPin, Clock, Calendar, CheckCircle2, XCircle, LogIn, LogOut, AlertCircle, Loader2, PartyPopper } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/Button"
import { Card, CardContent } from "../../components/ui/Card"
import { useAuth } from "../../contexts/AuthContext"
import { useGeolocation } from "../../hooks/useGeolocation"
import { attendanceService } from "../../services/attendance"
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
  
  // Success Modal State
  const [successModal, setSuccessModal] = useState(null)

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

  // ─── Derived values ────────────────────────────────────────────────────────

  const status = todayStatus?.status ?? "NOT_CHECKED_IN"
  const canCheckIn  = status === "NOT_CHECKED_IN"
  const canCheckOut = status === "CHECKED_IN"
  const isLoading   = actionLoading || locationLoading

  const statusLabel = {
    NOT_CHECKED_IN: { text: "Belum Absen",   color: "text-slate-500",   bg: "bg-slate-100"  },
    CHECKED_IN:     { text: "Sudah Check-in", color: "text-teal-700",    bg: "bg-teal-50"    },
    CHECKED_OUT:    { text: "Selesai Hari Ini", color: "text-brand-700", bg: "bg-brand-50"   },
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
    </div>
  )
}
