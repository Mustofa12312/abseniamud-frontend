import { useState, useEffect } from "react"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { attendanceService } from "../../services/attendance"
import { EmptyState } from "../../components/ui/EmptyState"

export default function LecturerHistory() {
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  
  const months = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ]
  const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [historyRes, summaryRes] = await Promise.all([
          attendanceService.getHistory(selectedMonth, selectedYear),
          attendanceService.getSummary(selectedMonth, selectedYear)
        ])
        
        if (historyRes.success) setHistory(historyRes.data)
        if (summaryRes.success) setSummary(summaryRes.data)
        
      } catch (err) {
        console.error("Failed to load data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedMonth, selectedYear])

  const getStatusColor = (status) => {
    switch(status) {
      case 'HADIR': return 'success'
      case 'TERLAMBAT': return 'warning'
      case 'TIDAK_HADIR': return 'danger'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Riwayat & Rekap</h1>
            <p className="text-sm text-slate-500">{summary?.period || `${months[selectedMonth-1]} ${selectedYear}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="h-8 px-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="h-8 px-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && summary && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-emerald-800 font-medium text-sm mb-1">Hadir</p>
            <p className="text-3xl font-bold text-emerald-600">{summary.hadir}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-amber-800 font-medium text-sm mb-1">Terlambat</p>
            <p className="text-3xl font-bold text-amber-600">{summary.terlambat}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-red-800 font-medium text-sm mb-1">Tidak Hadir</p>
            <p className="text-3xl font-bold text-red-600">{summary.tidak_hadir}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-blue-800 font-medium text-sm mb-1">Total</p>
            <p className="text-3xl font-bold text-blue-600">{summary.total}</p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-800 mb-4">Riwayat Harian</h2>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse border-none shadow-sm h-32 bg-slate-100" />
          ))
        ) : history.length === 0 ? (
          <div className="h-64">
            <EmptyState 
              title="Tidak Ada Riwayat" 
              description="Belum ada riwayat presensi dalam rentang waktu ini." 
            />
          </div>
        ) : (
          history.map((record) => (
            <Card key={record.id} className="border-none shadow-sm overflow-hidden relative">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${record.status === 'HADIR' ? 'bg-emerald-500' : (record.status === 'TERLAMBAT' ? 'bg-amber-500' : 'bg-red-500')}`}></div>
              <CardContent className="p-4 pl-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-slate-800">{record.date}</span>
                  <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin size={12}/> Masuk
                    </p>
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                      <Clock size={14} className="text-brand-500"/> 
                      {record.checkIn}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin size={12}/> Pulang
                    </p>
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                      <Clock size={14} className="text-amber-500"/> 
                      {record.checkOut}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
