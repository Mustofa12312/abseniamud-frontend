import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Badge } from "../../components/ui/Badge"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Search, Filter, Eye, MapPin, Clock, Smartphone, User } from "lucide-react"
import { adminService } from "../../services/admin"

export default function Monitoring() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState("")
  const [selectedDate, setSelectedDate] = useState(today)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [statusFilter, setStatusFilter] = useState("Semua")

  const fetchAttendance = async (dateParam) => {
    try {
      setLoading(true)
      const res = await adminService.getAttendance(dateParam)
      if (res.success) {
        setAttendanceData(res.data)
        setDate(res.date)
      }
    } catch (err) {
      console.error("Failed to fetch attendance data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(selectedDate)
  }, [selectedDate])

  const handleOpenDetail = (record) => {
    setSelectedRecord(record)
    setIsDetailModalOpen(true)
  }

  const filteredData = attendanceData.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase())
    let matchesStatus = true;
    if (statusFilter !== "Semua") {
      if (statusFilter === "Hadir") matchesStatus = row.status === "HADIR";
      else if (statusFilter === "Terlambat") matchesStatus = row.status === "TERLAMBAT";
      else if (statusFilter === "Alpa") matchesStatus = row.status === "Belum Absen" || row.status === "ALPHA";
      else if (statusFilter === "Izin") matchesStatus = ["IZIN", "SAKIT", "CUTI"].includes(row.status);
    }
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Monitoring Presensi</h2>
          <p className="text-slate-500 mt-1">
            {loading ? 'Memuat tanggal...' : `Pantau kehadiran dosen pada tanggal ${date}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <Input 
            icon={Search} 
            placeholder="Cari nama dosen..." 
            className="w-full sm:w-56"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-1">
            {['Semua','Hadir','Terlambat','Alpa','Izin'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Dosen</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat data presensi...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada data yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.checkIn}</TableCell>
                    <TableCell>{row.checkOut}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>
                      <Badge variant={row.statusColor}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleOpenDetail(row)} variant="ghost" size="sm" className="h-8 text-brand-600">
                        <Eye size={16} className="mr-1" /> Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* (Filter modal removed - inline filter buttons used instead) */}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Detail Presensi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedRecord.name}</h3>
                    <p className="text-sm text-slate-500">{date}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={selectedRecord.statusColor}>{selectedRecord.status}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Check-In</span>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock size={16} className="text-brand-500"/>
                      {selectedRecord.checkIn}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Check-Out</span>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock size={16} className="text-brand-500"/>
                      {selectedRecord.checkOut !== '-' ? selectedRecord.checkOut : 'Belum Check-out'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                    <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Lokasi Presensi</p>
                      <p className="text-sm text-slate-500">{selectedRecord.location}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">Koordinat dari perangkat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                    <Smartphone size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Perangkat</p>
                      <p className="text-sm text-slate-500 break-words max-w-[280px]">
                        {selectedRecord.user_agent || "Tidak diketahui"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        IP: {selectedRecord.ip_address || "Tidak diketahui"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="button" onClick={() => setIsDetailModalOpen(false)} className="w-full">
                    Tutup
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
