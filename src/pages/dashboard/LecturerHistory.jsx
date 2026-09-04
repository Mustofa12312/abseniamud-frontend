import { useState, useEffect } from "react"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { attendanceService } from "../../services/attendance"
import { EmptyState } from "../../components/ui/EmptyState"

export default function LecturerHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await attendanceService.getHistory()
        if (res.success) {
          setHistory(res.data)
        }
      } catch (err) {
        console.error("Failed to load history", err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

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
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
          <CalendarDays size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Riwayat Presensi</h1>
          <p className="text-sm text-slate-500">30 Hari Terakhir</p>
        </div>
      </div>

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
