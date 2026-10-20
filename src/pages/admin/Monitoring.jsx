import { useState, useEffect, useCallback, useId } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Badge } from "../../components/ui/Badge"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { 
  Search, Eye, MapPin, Clock, Smartphone, User, RefreshCw, 
  CheckCircle2, AlertTriangle, UserX, Calendar, Globe, ExternalLink, ShieldCheck
} from "lucide-react"
import { adminService } from "../../services/admin"

export default function Monitoring() {
  const autoSyncCheckboxId = useId()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState("")
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

  const fetchAttendance = useCallback(async (dateParam, silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setIsRefreshing(true)

      const res = await adminService.getAttendance(dateParam)
      if (res.success) {
        setAttendanceData(res.data || [])
        setDate(res.date || dateParam)
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
    fetchAttendance(selectedDate)
    setCountdown(15)
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
  const belumAbsenCount = attendanceData.filter(r => r.status === "Belum Absen" || r.status === "ALPHA").length

  const filteredData = attendanceData.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase())
    let matchesStatus = true
    if (statusFilter !== "Semua") {
      if (statusFilter === "Hadir") matchesStatus = row.status === "HADIR"
      else if (statusFilter === "Terlambat") matchesStatus = row.status === "TERLAMBAT"
      else if (statusFilter === "Alpa") matchesStatus = row.status === "Belum Absen" || row.status === "ALPHA"
      else if (statusFilter === "Izin") matchesStatus = ["IZIN", "SAKIT", "CUTI"].includes(row.status)
    }
    return matchesSearch && matchesStatus
  })

  // Device type detection helper
  const getDeviceBadge = (userAgent) => {
    if (!userAgent) {
      return (
        <span className="inline-flex items-center text-xs text-slate-400">
          -
        </span>
      )
    }
    const ua = userAgent.toLowerCase()
    if (ua.includes('dart') || ua.includes('android') || ua.includes('iaimu') || ua.includes('okhttp')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Smartphone size={11} className="text-emerald-600" /> Android
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Globe size={11} className="text-amber-600" /> Web Browser
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header & Action Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Monitoring Presensi Realtime</h2>
            {autoSync && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Auto-Sync ({countdown}s)
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? 'Memuat tanggal...' : `Pantau pergerakan presensi dosen & tendik kampus pada tanggal ${date}`}
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Sync Toggle */}
          <label htmlFor={autoSyncCheckboxId} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 shadow-sm">
            <input
              id={autoSyncCheckboxId}
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
            />
            <span>Auto-Refresh</span>
          </label>

          {/* Manual Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAttendance(selectedDate, false)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 h-9 bg-white shadow-sm"
          >
            <RefreshCw size={14} className={isRefreshing || loading ? "animate-spin text-brand-600" : "text-slate-600"} />
            <span className="text-xs font-medium">Segarkan</span>
          </Button>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── Live KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Terjadwal</span>
          <span className="text-2xl font-black text-slate-800 mt-1">{totalCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Dosen & Tendik</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm flex flex-col bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Tepat Waktu</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-700 mt-1">{hadirCount}</span>
          <span className="text-[11px] text-emerald-600/80 mt-0.5">Presensi Masuk</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm flex flex-col bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Terlambat</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-700 mt-1">{terlambatCount}</span>
          <span className="text-[11px] text-amber-600/80 mt-0.5">Melewati Toleransi</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-sm flex flex-col bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Izin / Cuti</span>
            <Calendar size={16} className="text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-700 mt-1">{izinCount}</span>
          <span className="text-[11px] text-blue-600/80 mt-0.5">Disetujui BAK</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-sm flex flex-col bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Belum Hadir</span>
            <UserX size={16} className="text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-700 mt-1">{belumAbsenCount}</span>
          <span className="text-[11px] text-rose-600/80 mt-0.5">Alpha / Belum Absen</span>
        </div>
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Input 
          icon={Search} 
          placeholder="Cari nama dosen / tendik..." 
          className="w-full sm:w-72 bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {['Semua','Hadir','Terlambat','Alpa','Izin'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                statusFilter === s 
                  ? 'bg-brand-700 text-white shadow-brand-700/20' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Attendance Table ── */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Nama Pengguna</TableHead>
                <TableHead className="font-bold text-slate-700">Perangkat</TableHead>
                <TableHead className="font-bold text-slate-700">Check-In</TableHead>
                <TableHead className="font-bold text-slate-700">Check-Out</TableHead>
                <TableHead className="font-bold text-slate-700">Lokasi Presensi</TableHead>
                <TableHead className="font-bold text-slate-700">Status Kehadiran</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-brand-600" />
                      <span className="text-sm font-medium">Sinkronisasi data presensi...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UserX size={28} className="text-slate-300" />
                      <p className="font-medium text-slate-700">Tidak ada rekaman presensi yang cocok</p>
                      <p className="text-xs text-slate-400">Silakan ubah filter status atau kata kunci pencarian</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-800">
                      <div>
                        {row.name}
                        {row.role && (
                          <span className="block text-[11px] font-normal text-slate-400 capitalize">
                            {row.role}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDeviceBadge(row.user_agent)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {row.checkIn !== '-' ? row.checkIn : <span className="text-slate-300">-</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {row.checkOut !== '-' ? row.checkOut : <span className="text-slate-300">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-brand-600 shrink-0" />
                        <span className="truncate max-w-[160px]">{row.location || "Kampus"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.statusColor}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleOpenDetail(row)} variant="ghost" size="sm" className="h-8 text-brand-700 hover:text-brand-800 hover:bg-brand-50">
                        <Eye size={15} className="mr-1" /> Telemetri
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Detail Telemetry Modal ── */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-brand-600" />
                  Detail Telemetri & Presensi
                </CardTitle>
                <Badge variant={selectedRecord.statusColor}>{selectedRecord.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* User Info Bar */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                    {selectedRecord.name?.charAt(0) || <User size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedRecord.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} /> {date}
                    </p>
                  </div>
                  <div className="ml-auto">
                    {getDeviceBadge(selectedRecord.user_agent)}
                  </div>
                </div>
                
                {/* Time Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Jam Check-In</span>
                    <div className="flex items-center gap-2 font-mono text-base font-bold text-slate-800">
                      <Clock size={16} className="text-emerald-600"/>
                      {selectedRecord.checkIn}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Jam Check-Out</span>
                    <div className="flex items-center gap-2 font-mono text-base font-bold text-slate-800">
                      <Clock size={16} className="text-blue-600"/>
                      {selectedRecord.checkOut !== '-' ? selectedRecord.checkOut : 'Belum Pulang'}
                    </div>
                  </div>
                </div>

                {/* Location & Geofence Details */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <MapPin size={18} className="text-brand-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lokasi & Radius Validasi</p>
                        {selectedRecord.latitude && selectedRecord.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                          >
                            Buka Maps <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedRecord.location || "Kampus Bettet"}</p>
                      {selectedRecord.latitude && selectedRecord.longitude ? (
                        <p className="text-xs font-mono text-slate-500 mt-1">
                          Koordinat: {selectedRecord.latitude}, {selectedRecord.longitude}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Geofence radius tervalidasi</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Hardware & Network Telemetry */}
                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <Smartphone size={18} className="text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Telemetri Perangkat & IP</p>
                      <p className="text-xs text-slate-700 font-mono mt-1 break-all bg-white p-2 rounded border border-slate-200">
                        {selectedRecord.user_agent || "Client Web Browser"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-500">
                        <span>IP: <strong className="text-slate-700">{selectedRecord.ip_address || "127.0.0.1"}</strong></span>
                        <span>Platform: <strong className="text-slate-700">{selectedRecord.user_agent?.includes('Android') ? 'Android Mobile' : 'Web Browser'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="button" onClick={() => setIsDetailModalOpen(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                    Tutup Telemetri
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
