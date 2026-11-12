import { useState, useEffect, useCallback, useId } from "react"
import { 
  Search, Eye, MapPin, Clock, Smartphone, User, RefreshCw, 
  Check, AlertTriangle, UserX, Calendar, Globe, ExternalLink, ShieldCheck, X, Users
} from "lucide-react"
import { adminService } from "../../services/admin"

const formatLocalDate = (d = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Monitoring() {
  const autoSyncCheckboxId = useId()
  const today = formatLocalDate()
  const [date, setDate] = useState("")
  const [holidayName, setHolidayName] = useState(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Auto-sync state
  const [autoSync, setAutoSync] = useState(true)
  const [countdown, setCountdown] = useState(15)

  // Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [statusFilter, setStatusFilter] = useState("Semua")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const fetchAttendance = useCallback(async (dateParam, silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setIsRefreshing(true)

      const res = await adminService.getAttendance(dateParam)
      if (res.success) {
        setAttendanceData(res.data || [])
        setDate(res.date || dateParam)
        setHolidayName(res.holiday_name || null)
      } else {
        setHolidayName(null)
      }
    } catch (err) {
      console.error("Failed to fetch attendance data", err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial and date change fetch
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchAttendance(selectedDate)
    })
    return () => { active = false }
  }, [selectedDate, fetchAttendance])

  // Smart Auto-Sync Timer (15s)
  useEffect(() => {
    if (!autoSync) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAttendance(selectedDate, true)
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoSync, selectedDate, fetchAttendance])

  const handleOpenDetail = (record) => {
    setSelectedRecord(record)
    setIsDetailModalOpen(true)
  }

  // Summary Metrics Calculation
  const totalCount = attendanceData.length
  const hadirCount = attendanceData.filter(r => r.status === "HADIR").length
  const terlambatCount = attendanceData.filter(r => r.status === "TERLAMBAT").length
  const izinCount = attendanceData.filter(r => ["IZIN", "SAKIT", "CUTI"].includes(r.status)).length
  const belumAbsenCount = attendanceData.filter(r => ["Belum Absen", "ALPHA", "TIDAK_HADIR"].includes(r.status)).length

  const filteredData = attendanceData.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase())
    let matchesStatus = true
    if (statusFilter !== "Semua") {
      if (statusFilter === "Hadir") matchesStatus = row.status === "HADIR"
      else if (statusFilter === "Terlambat") matchesStatus = row.status === "TERLAMBAT"
      else if (statusFilter === "Alpa") matchesStatus = ["Belum Absen", "ALPHA", "TIDAK_HADIR"].includes(row.status)
      else if (statusFilter === "Izin") matchesStatus = ["IZIN", "SAKIT", "CUTI"].includes(row.status)
    }
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Device type detection helper
  const getDeviceBadge = (userAgent) => {
    if (!userAgent) {
      return (
        <span className="text-gray-400 font-mono text-xs">-</span>
      )
    }
    const ua = userAgent.toLowerCase()
    if (ua.includes('dart') || ua.includes('android') || ua.includes('iaimu') || ua.includes('okhttp')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
          <Smartphone className="w-3 h-3 mr-1 text-emerald-600" /> Android
        </span>
      )
    }
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
          <Smartphone className="w-3 h-3 mr-1 text-purple-600" /> iOS
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
        <Globe className="w-3 h-3 mr-1 text-blue-600" /> Web Browser
      </span>
    )
  }

  const getStatusBadge = (status) => {
    if (status === "HADIR") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
          HADIR
        </span>
      )
    }
    if (status === "TERLAMBAT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/40">
          TERLAMBAT
        </span>
      )
    }
    if (["IZIN", "SAKIT", "CUTI"].includes(status)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          {status}
        </span>
      )
    }
    if (status === "TIDAK_HADIR" || status === "ALPHA") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50">
          {status === "TIDAK_HADIR" ? "TIDAK HADIR" : "ALPHA"}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
        Belum Absen
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── BEGIN: Header & Action Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Monitoring Presensi Realtime</h2>
            {autoSync && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-apple-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Auto-Sync ({countdown}s)
              </span>
            )}
          </div>
          <p className="text-[#86868B] dark:text-slate-400 text-xs sm:text-sm mt-1">
            {loading ? 'Memuat tanggal...' : `Pantau pergerakan presensi dosen & tendik kampus pada tanggal ${date}`}
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Sync Toggle */}
          <label 
            htmlFor={autoSyncCheckboxId} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1D1D1F] dark:text-slate-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-750 shadow-apple-sm transition-all"
          >
            <input
              id={autoSyncCheckboxId}
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 accent-emerald-600"
            />
            <span>Auto-Refresh</span>
          </label>

          {/* Manual Refresh Button */}
          <button
            onClick={() => { setCountdown(15); fetchAttendance(selectedDate, false); }}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-750 active:scale-[0.98] text-[#1D1D1F] dark:text-slate-200 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs font-medium shadow-apple-sm transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? "animate-spin text-emerald-600" : "text-[#86868B] dark:text-slate-400"}`} />
            <span>Segarkan</span>
          </button>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setCountdown(15); setCurrentPage(1); }}
            max={today}
            className="h-9 px-3 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-[#1D1D1F] dark:text-white shadow-apple-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
          />
        </div>
      </div>
      {/* ── END: Header & Action Controls ── */}

      {holidayName && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            Hari Libur Aktif ({holidayName}) — presensi pada tanggal ini dinonaktifkan.
          </span>
        </div>
      )}

      {/* ── BEGIN: MetricCardsSection ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" data-purpose="metrics-summary">
        {/* Metric 1: Total Terjadwal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-[rgba(0,0,0,0.06)] dark:border-slate-700/60 shadow-apple-card transition-all hover:shadow-apple-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400">Total Terjadwal</span>
            <span className="p-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white leading-none">{totalCount}</div>
          <div className="text-[11px] text-[#86868B] dark:text-slate-400 mt-1.5 font-medium">Dosen &amp; Tendik</div>
        </div>

        {/* Metric 2: Tepat Waktu */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-950/60 bg-gradient-to-b from-white dark:from-slate-800 to-emerald-50/20 dark:to-emerald-950/20 shadow-apple-card transition-all hover:shadow-apple-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Tepat Waktu</span>
            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">{hadirCount}</div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1.5 font-medium">Presensi Masuk</div>
        </div>

        {/* Metric 3: Terlambat */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-100 dark:border-amber-950/60 bg-gradient-to-b from-white dark:from-slate-800 to-amber-50/20 dark:to-amber-950/20 shadow-apple-card transition-all hover:shadow-apple-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Terlambat</span>
            <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 leading-none">{terlambatCount}</div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1.5 font-medium">Melewati Toleransi</div>
        </div>

        {/* Metric 4: Izin / Cuti */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-blue-100 dark:border-blue-950/60 bg-gradient-to-b from-white dark:from-slate-800 to-blue-50/20 dark:to-blue-950/20 shadow-apple-card transition-all hover:shadow-apple-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Izin / Cuti</span>
            <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 leading-none">{izinCount}</div>
          <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1.5 font-medium">Disetujui BAK</div>
        </div>

        {/* Metric 5: Belum Hadir */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-rose-100 dark:border-rose-950/60 bg-gradient-to-b from-white dark:from-slate-800 to-rose-50/20 dark:to-rose-950/20 shadow-apple-card transition-all hover:shadow-apple-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Belum Hadir</span>
            <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <UserX className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 leading-none">{belumAbsenCount}</div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1.5 font-medium">Alpha / Belum Absen</div>
        </div>
      </section>
      {/* ── END: MetricCardsSection ── */}

      {/* ── BEGIN: FilterAndSearchSection ── */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" data-purpose="filter-bar">
        {/* Search Bar with Apple Styling */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-[rgba(0,0,0,0.1)] dark:border-slate-700 rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-apple-sm transition-all"
            placeholder="Cari nama dosen / tendik..."
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Filter Pills Segmented Controls */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {['Semua', 'Hadir', 'Terlambat', 'Alpa', 'Izin'].map((s) => {
            const isActive = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'font-semibold bg-emerald-600 text-white shadow-apple-sm hover:bg-emerald-700'
                    : 'font-medium bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-[rgba(0,0,0,0.08)] dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-750'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </section>
      {/* ── END: FilterAndSearchSection ── */}

      {/* ── BEGIN: AttendanceTableSection ── */}
      <section className="bg-white dark:bg-slate-800 border border-[rgba(0,0,0,0.06)] dark:border-slate-700/60 rounded-2xl shadow-apple-card overflow-hidden" data-purpose="attendance-table-container">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[13px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#F0F0F2] dark:border-slate-700 bg-[#FAFAFC] dark:bg-slate-850 text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">Nama Pengguna</th>
                <th className="py-3.5 px-4">Perangkat</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out</th>
                <th className="py-3.5 px-4">Lokasi Presensi</th>
                <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                <th className="py-3.5 pr-6 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="divide-y divide-[#F5F5F7] dark:divide-slate-700/50 font-normal text-neutral-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#86868B] dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-medium">Sinkronisasi data presensi...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#86868B] dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UserX className="w-7 h-7 text-neutral-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm text-[#1D1D1F] dark:text-white">Tidak ada rekaman presensi yang cocok</p>
                      <p className="text-xs text-[#86868B] dark:text-slate-400">Silakan ubah filter status atau kata kunci pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/70 dark:hover:bg-slate-750/70 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 font-medium text-[#1D1D1F] dark:text-white whitespace-nowrap">
                      <div>
                        {row.name}
                        {row.penugasan && (
                          <span className="block text-[11px] font-normal text-[#86868B] dark:text-slate-400 capitalize truncate max-w-xs">
                            {row.penugasan}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getDeviceBadge(row.user_agent)}
                    </td>
                    <td className={`py-3.5 px-4 font-mono text-xs whitespace-nowrap ${
                      row.checkIn !== '-' && row.status === 'TERLAMBAT'
                        ? 'text-amber-700 dark:text-amber-400 font-medium'
                        : row.checkIn !== '-'
                        ? 'text-[#1D1D1F] dark:text-slate-200 font-medium'
                        : 'text-[#86868B] dark:text-slate-500'
                    }`}>
                      {row.checkIn}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#86868B] dark:text-slate-400 whitespace-nowrap">
                      {row.checkOut !== '-' ? (
                        <span className="text-[#1D1D1F] dark:text-slate-200 font-medium">{row.checkOut}</span>
                      ) : (
                        <span className="text-[#86868B] dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {row.location && row.location !== '-' ? (
                        <div className="inline-flex items-center text-xs font-medium text-neutral-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[160px]">{row.location}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center text-xs text-[#86868B] dark:text-slate-500">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500/70 shrink-0" />
                          -
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(row)}
                        className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Telemetri
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination Note */}
        <div className="px-6 py-3 border-t border-[#F0F0F2] dark:border-slate-700 bg-[#FAFAFC] dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868B] dark:text-slate-400">
          <div>
            Menampilkan {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} personil terdaftar
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 rounded-lg shadow-apple-sm transition-colors disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-neutral-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium shadow-apple-sm transition-colors cursor-pointer ${
                        currentPage === p
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 font-semibold'
                          : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 rounded-lg shadow-apple-sm transition-colors disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </section>
      {/* ── END: AttendanceTableSection ── */}

      {/* ── BEGIN: Detail Telemetry Modal ── */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-[#FAFAFC] dark:bg-slate-850 border-b border-[#F0F0F2] dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1D1D1F] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Detail Telemetri &amp; Presensi</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedRecord.status)}
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* User Info Bar */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#F0F0F2] dark:border-slate-700">
                <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-base ring-1 ring-emerald-500/20">
                  {selectedRecord.name?.charAt(0) || <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-white">{selectedRecord.name}</h3>
                  <p className="text-xs text-[#86868B] dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> {date || selectedDate}
                  </p>
                </div>
                <div className="ml-auto">
                  {getDeviceBadge(selectedRecord.user_agent)}
                </div>
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAFAFC] dark:bg-slate-850 p-3.5 rounded-xl border border-[#F0F0F2] dark:border-slate-700">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#86868B] dark:text-slate-400 font-semibold uppercase tracking-wider">Jam Check-In</span>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[#1D1D1F] dark:text-white">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {selectedRecord.checkIn}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-[#86868B] dark:text-slate-400 font-semibold uppercase tracking-wider">Jam Check-Out</span>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[#1D1D1F] dark:text-white">
                    <Clock className="w-4 h-4 text-blue-600" />
                    {selectedRecord.checkOut !== '-' ? selectedRecord.checkOut : 'Belum Pulang'}
                  </div>
                </div>
              </div>

              {/* Location & Geofence Details */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 bg-[#FAFAFC] dark:bg-slate-850 p-3.5 rounded-xl border border-[#F0F0F2] dark:border-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">Lokasi &amp; Radius Validasi</p>
                      {selectedRecord.latitude && selectedRecord.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Buka Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white mt-0.5">{selectedRecord.location || "Kampus Bettet"}</p>
                    {selectedRecord.latitude && selectedRecord.longitude ? (
                      <p className="text-[11px] font-mono text-[#86868B] dark:text-slate-400 mt-1">
                        Koordinat: {selectedRecord.latitude}, {selectedRecord.longitude}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">Geofence radius tervalidasi</p>
                    )}
                  </div>
                </div>

                {/* Hardware & Network Telemetry */}
                <div className="flex items-start gap-3 bg-[#FAFAFC] dark:bg-slate-850 p-3.5 rounded-xl border border-[#F0F0F2] dark:border-slate-700">
                  <Smartphone className="w-4 h-4 text-[#86868B] dark:text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">Telemetri Perangkat &amp; IP</p>
                    <p className="text-[11px] text-[#1D1D1F] dark:text-slate-200 font-mono mt-1 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-[#E5E5EA] dark:border-slate-700">
                      {selectedRecord.user_agent || "Client Web Browser"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-[#86868B] dark:text-slate-400">
                      <span>IP: <strong className="text-[#1D1D1F] dark:text-slate-200">{selectedRecord.ip_address || "127.0.0.1"}</strong></span>
                      <span>Platform: <strong className="text-[#1D1D1F] dark:text-slate-200">{selectedRecord.user_agent?.includes('Android') ? 'Android Mobile' : 'Web Browser'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full py-2.5 px-4 bg-[#1D1D1F] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-tight transition-colors cursor-pointer"
                >
                  Tutup Telemetri
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── END: Detail Telemetry Modal ── */}
    </div>
  )
}
