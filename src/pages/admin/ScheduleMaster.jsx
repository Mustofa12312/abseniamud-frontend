import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Clock, Plus, BookOpen, MapPin, Edit2, Trash2 } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"

export default function ScheduleMaster() {
  const { success, error } = useToast()
  const [schedules, setSchedules] = useState({})
  const [lecturers, setLecturers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [deletingSchedule, setDeletingSchedule] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    day: 'Senin',
    course: '',
    time: '',
    lecturer: '',
    room: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, lectRes, roomRes] = await Promise.all([
          adminService.getSchedules(),
          adminService.getLecturers(),
          adminService.getRooms()
        ])
        if (schedRes.success) setSchedules(schedRes.data)
        if (lectRes.success) setLecturers(lectRes.data)
        if (roomRes.success) setRooms(roomRes.data)
      } catch (err) {
        console.error("Failed to load data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingSchedule(null)
    setFormData({ day: 'Senin', course: '', time: '', lecturer: '', room: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (day, item) => {
    setEditingSchedule({ ...item, oldDay: day })
    setFormData({
      day: day,
      course: item.course,
      time: item.time,
      lecturer: item.lecturer,
      room: item.room
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (day, item) => {
    setDeletingSchedule({ ...item, day })
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingSchedule) {
        const res = await adminService.updateSchedule(editingSchedule.id, formData)
        if (res.success) {
          const newSchedules = { ...schedules }
          // Remove from old day
          if (newSchedules[editingSchedule.oldDay]) {
            newSchedules[editingSchedule.oldDay] = newSchedules[editingSchedule.oldDay].filter(i => i.id !== editingSchedule.id)
          }
          // Add to new day
          if (!newSchedules[formData.day]) newSchedules[formData.day] = []
          newSchedules[formData.day].push({ id: editingSchedule.id, ...formData })
          
          setSchedules(newSchedules)
          setIsModalOpen(false)
          success("Jadwal berhasil diperbarui.")
        }
      } else {
        const res = await adminService.createSchedule(formData)
        if (res.success) {
          const newSchedules = { ...schedules }
          if (!newSchedules[formData.day]) newSchedules[formData.day] = []
          newSchedules[formData.day].push(res.data)
          
          setSchedules(newSchedules)
          setIsModalOpen(false)
          success("Jadwal berhasil ditambahkan.")
        }
      }
    } catch (err) {
      console.error(err)
      error("Terjadi kesalahan.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSchedule) return
    setSubmitting(true)
    
    try {
      const res = await adminService.deleteSchedule(deletingSchedule.id)
      if (res.success) {
        const newSchedules = { ...schedules }
        if (newSchedules[deletingSchedule.day]) {
          newSchedules[deletingSchedule.day] = newSchedules[deletingSchedule.day].filter(i => i.id !== deletingSchedule.id)
        }
        setSchedules(newSchedules)
        setIsDeleteModalOpen(false)
        success("Jadwal berhasil dihapus.")
      }
    } catch (err) {
      console.error(err)
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Jadwal Mengajar</h2>
          <p className="text-slate-500 mt-1">Kelola plotting jadwal dosen dan ruangan kelas.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Jadwal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => (
          <Card key={day} className="border-none shadow-sm flex flex-col">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
              <CardTitle className="text-lg flex justify-between items-center">
                {day}
                <Badge variant="outline" className="bg-white">{schedules[day]?.length || 0} Sesi</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {loading ? (
                <div className="p-6 text-center text-slate-500 animate-pulse">Memuat jadwal...</div>
              ) : schedules[day] && schedules[day].length > 0 ? (
                <div className="divide-y divide-slate-100 flex-1">
                  {schedules[day].map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-brand-700">{item.course}</h4>
                        <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock size={12}/> {item.time}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-400"/> Dosen: {item.lecturer}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400"/> Ruang: {item.room}
                        </p>
                      </div>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button onClick={() => handleOpenEdit(day, item)} variant="outline" size="sm" className="w-full text-xs h-7">Edit Sesi</Button>
                        <Button onClick={() => handleOpenDelete(day, item)} variant="outline" size="sm" className="w-full text-xs h-7 text-red-600 border-red-200 hover:bg-red-50">Hapus</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 m-4 rounded-xl">
                  Tidak ada jadwal untuk hari {day}.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</CardTitle>
              <CardDescription>
                Silakan isi formulir di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Hari</label>
                  <select 
                    name="day" 
                    value={formData.day} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Mata Kuliah</label>
                  <Input 
                    type="text" 
                    name="course" 
                    value={formData.course} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Waktu (contoh: 08:00 - 09:30)</label>
                  <Input 
                    type="text" 
                    name="time" 
                    value={formData.time} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Dosen</label>
                  <select 
                    name="lecturer" 
                    value={formData.lecturer} 
                    onChange={handleChange} 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Pilih Dosen</option>
                    {lecturers.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Ruangan</label>
                  <select 
                    name="room" 
                    value={formData.room} 
                    onChange={handleChange} 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Pilih Ruangan</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Memproses...' : (editingSchedule ? 'Simpan' : 'Tambah')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
              <CardTitle>Konfirmasi Hapus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus jadwal <strong>{deletingSchedule?.course}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>
                  Batal
                </Button>
                <Button type="button" onClick={handleDelete} disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {submitting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
