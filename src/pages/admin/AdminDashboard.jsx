import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Users, UserCheck, Clock, Map, MapPin } from "lucide-react"
import { adminService } from "../../services/admin"
import { EmptyState } from "../../components/ui/EmptyState"

export default function AdminDashboard() {
  const [stats, setStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const icons = [Users, UserCheck, Clock, Map]
  const colors = [
    { text: "text-blue-600", bg: "bg-blue-100" },
    { text: "text-emerald-600", bg: "bg-emerald-100" },
    { text: "text-amber-600", bg: "bg-amber-100" },
    { text: "text-purple-600", bg: "bg-purple-100" }
  ]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats()
        if (res.success) {
          // Merge icons and colors to the API stats
          const mappedStats = res.data.stats.map((s, i) => ({
            ...s,
            icon: icons[i % icons.length],
            color: colors[i % colors.length].text,
            bg: colors[i % colors.length].bg
          }))
          setStats(mappedStats)
          setRecentActivity(res.data.recent_activity)
        }
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Ringkasan Hari Ini</h2>
        <p className="text-slate-500 mt-1">Pantau statistik presensi secara real-time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="border-none shadow-sm h-[104px] animate-pulse bg-slate-100" />
          ))
        ) : (
          stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Grafik Kehadiran (Minggu Ini)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full bg-slate-50 rounded-xl flex items-end justify-around border border-dashed border-slate-200 p-4 pt-8 text-slate-400 gap-2">
              {/* CSS Bar Chart Simulation */}
              {[
                { day: 'Sen', value: 80 },
                { day: 'Sel', value: 95 },
                { day: 'Rab', value: 85 },
                { day: 'Kam', value: 60 },
                { day: 'Jum', value: 90 }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end w-full max-w-[50px] group">
                  <div className="text-xs font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.value}%
                  </div>
                  <div 
                    className="w-full bg-brand-500 rounded-t-md transition-all hover:bg-brand-600 cursor-pointer"
                    style={{ height: `${item.value}%` }}
                  ></div>
                  <div className="text-xs font-semibold text-slate-600 mt-1">{item.day}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                <div className="text-center text-sm text-slate-500">Memuat aktivitas...</div>
              ) : recentActivity.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <EmptyState 
                    title="Tidak Ada Aktivitas" 
                    description="Belum ada aktivitas presensi pada hari ini." 
                  />
                </div>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-brand-500 ring-4 ring-brand-100 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {activity.name} <span className="font-normal text-slate-500">melakukan {activity.action}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={12}/> {activity.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={12}/> {activity.location}</span>
                        {activity.late && <span className="text-amber-500 font-medium">Terlambat</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
