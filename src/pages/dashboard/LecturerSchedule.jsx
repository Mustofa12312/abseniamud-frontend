import { useState, useEffect } from "react"
import { Clock, BookOpen, MapPin, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { scheduleService } from "../../services/schedule"
import { EmptyState } from "../../components/ui/EmptyState"

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAY_COLORS = {
  Senin: 'bg-blue-50 border-blue-200 text-blue-700',
  Selasa: 'bg-purple-50 border-purple-200 text-purple-700',
  Rabu: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Kamis: 'bg-amber-50 border-amber-200 text-amber-700',
  Jumat: 'bg-rose-50 border-rose-200 text-rose-700',
  Sabtu: 'bg-slate-50 border-slate-200 text-slate-700',
}

export default function LecturerSchedule() {
  const [schedules, setSchedules] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await scheduleService.getSchedules()
        if (res.success) {
          setSchedules(res.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const allSchedules = DAY_ORDER.flatMap(day => 
    (schedules[day] || []).map(s => ({ ...s, day }))
  )

  const totalMatkul = allSchedules.length
  const totalSKS = allSchedules.reduce((sum, s) => sum + (s.sks || 0), 0)

  return (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
          <CalendarDays size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Jadwal Mengajar</h1>
          <p className="text-sm text-slate-500">Jadwal mata kuliah semester aktif</p>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
            <p className="text-brand-700 font-medium text-sm mb-1">Total Mata Kuliah</p>
            <p className="text-3xl font-bold text-brand-600">{totalMatkul}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-emerald-700 font-medium text-sm mb-1">Total SKS</p>
            <p className="text-3xl font-bold text-emerald-600">{totalSKS}</p>
          </div>
        </div>
      )}

      {/* Schedule per day */}
      {loading ? (
        [1,2,3].map(i => (
          <Card key={i} className="animate-pulse border-none shadow-sm h-32 bg-slate-100" />
        ))
      ) : allSchedules.length === 0 ? (
        <div className="h-64">
          <EmptyState
            title="Belum Ada Jadwal"
            description="Belum ada jadwal mengajar yang ditugaskan untuk Anda."
          />
        </div>
      ) : (
        DAY_ORDER.filter(day => schedules[day] && schedules[day].length > 0).map(day => (
          <Card key={day} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-5 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DAY_COLORS[day]}`}>{day}</span>
                <span className="text-slate-400 font-normal">{schedules[day].length} sesi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {schedules[day].map((item, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 text-sm">{item.course_name}</h3>
                      <span className="shrink-0 text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock size={11} /> {item.start_time}–{item.end_time}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {item.room_name && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" /> {item.room_name}
                        </span>
                      )}
                      {item.sks && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} className="text-slate-400" /> {item.sks} SKS
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
