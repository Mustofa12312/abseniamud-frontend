import { useState, useEffect, useCallback } from "react"
import { Users, UserCheck, Clock, MapPin, RefreshCw } from "lucide-react"
import { adminService } from "../../services/admin"

export default function AdminDashboard() {
  const [stats, setStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const currentDayName = dayNames[new Date().getDay()]

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await adminService.getDashboardStats()
      if (res.success) {
        setStats(res.data.stats || [])
        setRecentActivity(res.data.recent_activity || [])
        setChartData(res.data.chart_data || [])
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000) // auto-refresh every 5 minutes
    return () => clearInterval(interval)
  }, [fetchStats])

  const getCardConfig = (title) => {
    const lower = (title || "").toLowerCase()
    if (lower.includes("total") || lower.includes("dosen")) {
      return {
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/40",
        ring: "ring-1 ring-blue-500/10 dark:ring-blue-500/20"
      }
    }
    if (lower.includes("hadir")) {
      return {
        icon: UserCheck,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        ring: "ring-1 ring-emerald-500/10 dark:ring-emerald-500/20"
      }
    }
    if (lower.includes("lambat")) {
      return {
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/40",
        ring: "ring-1 ring-amber-500/10 dark:ring-amber-500/20"
      }
    }
    return {
      icon: MapPin,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      ring: "ring-1 ring-purple-500/10 dark:ring-purple-500/20"
    }
  }

  const hadirStat = stats.find(s => s.title?.toLowerCase().includes("hadir"))?.value

  return (
    <div className="space-y-6">
      {/* BEGIN: ContentHeader */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-purpose="content-title-bar">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Ringkasan Hari Ini</h2>
          <div className="flex items-center gap-2 mt-1 text-[13px] text-[#86868B] dark:text-slate-400">
            <span>Pantau statistik presensi secara real-time.</span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#86868B]"></span>
            <span className="font-medium text-neutral-500 dark:text-slate-400">
              Diperbarui: {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.') : '-'}
            </span>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700 active:scale-[0.98] text-[#1D1D1F] dark:text-white border border-[#E5E5EA] dark:border-slate-700 shadow-apple-sm rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 cursor-pointer disabled:opacity-60"
          id="refresh-button"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 transition-transform duration-500 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </section>
      {/* END: ContentHeader */}

      {/* BEGIN: MetricCardsGrid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metrics-summary-grid">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] dark:border-slate-700/60 shadow-apple-card animate-pulse h-[88px]" />
          ))
        ) : (
          stats.map((stat, i) => {
            const config = getCardConfig(stat.title)
            const Icon = config.icon
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] dark:border-slate-700/60 shadow-apple-card hover:shadow-apple-hover transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] dark:text-slate-400 tracking-tight">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center ${config.ring} transition-transform group-hover:scale-105`}>
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </div>
              </div>
            )
          })
        )}
      </section>
      {/* END: MetricCardsGrid */}

      {/* BEGIN: ContentSplitLayout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-purpose="charts-and-activity-layout">
        {/* Column 1: Attendance Bar Chart (Minggu Ini) */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-[rgba(0,0,0,0.06)] dark:border-slate-700/60 shadow-apple-card flex flex-col" data-purpose="attendance-bar-chart">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white tracking-tight">Grafik Kehadiran (Minggu Ini)</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">Distribusi kehadiran harian dosen aktif</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Presensi
            </span>
          </div>

          {/* Apple Minimalist Bar Chart Frame */}
          <div className="mt-2 flex-1 flex flex-col justify-end min-h-[300px] border border-dashed border-[#E5E5EA] dark:border-slate-700 rounded-xl p-6 bg-[#FAFAFC] dark:bg-slate-900/40 relative">
            {/* Background subtle gridlines */}
            <div className="absolute inset-x-6 top-6 bottom-14 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-[#E5E5EA] dark:border-slate-700 w-full"></div>
              <div className="border-b border-[#E5E5EA] dark:border-slate-700 w-full"></div>
              <div className="border-b border-[#E5E5EA] dark:border-slate-700 w-full"></div>
              <div className="border-b border-[#E5E5EA] dark:border-slate-700 w-full"></div>
            </div>

            {/* Graphic Canvas Grid with Bars */}
            <div className="h-56 w-full flex items-end justify-between px-4 sm:px-8 border-b border-[#E5E5EA] dark:border-slate-700 pb-0 relative z-10">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#86868B] dark:text-slate-400 animate-pulse">
                  Memuat data grafik...
                </div>
              ) : chartData.length > 0 ? (
                chartData.map((item, idx) => {
                  const hasData = item.value > 0
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 group z-10 w-12 sm:w-16">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.value}%
                      </div>
                      {hasData ? (
                        <div
                          className="w-10 sm:w-12 bg-emerald-500 rounded-t-lg shadow-sm animate-bar group-hover:bg-emerald-600 transition-colors cursor-pointer"
                          style={{ height: `${Math.max(item.value, 6)}%` }}
                        />
                      ) : (
                        <div className="w-10 sm:w-12 bg-neutral-200/50 dark:bg-slate-700/50 rounded-t-md h-1" />
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#86868B] dark:text-slate-400">
                  Belum ada data minggu ini.
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-4 sm:px-8 pt-3 text-xs font-semibold text-[#86868B] dark:text-slate-400">
              {chartData.length > 0 ? (
                chartData.map((item, idx) => {
                  const isCurrentDay = item.day === currentDayName
                  return (
                    <span
                      key={idx}
                      className={`w-12 sm:w-16 text-center transition-colors ${
                        isCurrentDay
                          ? "text-emerald-700 dark:text-emerald-400 font-bold"
                          : "text-[#1D1D1F] dark:text-slate-300"
                      }`}
                    >
                      {item.day}
                    </span>
                  )
                })
              ) : (
                ["Sen", "Sel", "Rab", "Kam", "Jum"].map((d) => (
                  <span key={d} className="w-12 sm:w-16 text-center">{d}</span>
                ))
              )}
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="mt-4 flex items-center justify-between text-xs text-[#86868B] dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Presensi Dosen Terverifikasi
            </span>
            <span>
              {hadirStat !== undefined ? `Total sesi terlaksana: ${hadirStat}` : "Sistem Presensi Aktif"}
            </span>
          </div>
        </section>

        {/* Column 2: Live Activity Feed (Aktivitas Terbaru) */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-[rgba(0,0,0,0.06)] dark:border-slate-700/60 shadow-apple-card flex flex-col" data-purpose="live-activity-feed">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F2] dark:border-slate-700">
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white tracking-tight">Aktivitas Terbaru</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">Log presensi masuk langsung hari ini</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Feed Real-time"></span>
          </div>

          {/* Activity List */}
          <div className="mt-4 space-y-4 divide-y divide-[#F5F5F7] dark:divide-slate-700/50 overflow-y-auto max-h-[360px] pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#86868B] dark:text-slate-400 animate-pulse">
                Memuat aktivitas...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-slate-700 text-neutral-400 flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">Tidak Ada Aktivitas</p>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">Belum ada aktivitas presensi pada hari ini.</p>
              </div>
            ) : (
              recentActivity.map((activity, i) => (
                <div key={i} className="pt-3 first:pt-0 flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-950/50"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate leading-tight">
                        {activity.name}
                      </p>
                      {activity.late ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 shrink-0">
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 shrink-0">
                          Tepat Waktu
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">
                      melakukan {activity.action || "Check-in"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {activity.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {activity.location || "Sistem"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      {/* END: ContentSplitLayout */}
    </div>
  )
}
