import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Clock, Plus, BookOpen, MapPin, Edit2, Trash2, Loader2 } from "lucide-react"
import { scheduleService } from "../../services/schedule"
import { masterDataService } from "../../services/masterData"
import { useToast } from "../../contexts/ToastContext"

export default function ScheduleMaster() {
  const { success, error } = useToast()
  const [schedules, setSchedules] = useState({})
  const [rooms, setRooms] = useState([])
  const [faculties, setFaculties] = useState([])
  const [courses, setCourses] = useState([])
  const [activeAcademicYear, setActiveAcademicYear] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [deletingSchedule, setDeletingSchedule] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    day_of_week: 'Senin',
    course_id: '',
    room_id: '',
    start_time: '08:00',
    end_time: '09:30',
  })
  
  // Temporary states for form filtering
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('1')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [schedRes, roomRes, facRes, activeYearRes] = await Promise.all([
        scheduleService.getSchedules(),
        masterDataService.getRooms(),
        masterDataService.getFaculties(),
        masterDataService.getActiveAcademicYear()
      ])
      if (schedRes.success) setSchedules(schedRes.data)
      if (roomRes.success) setRooms(roomRes.data)
      if (facRes.success) setFaculties(facRes.data)
      if (activeYearRes && activeYearRes.success && activeYearRes.data) setActiveAcademicYear(activeYearRes.data)
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedFaculty || !selectedSemester) {
        setCourses([])
        return
      }
      try {
        const res = await masterDataService.getCourses(selectedFaculty, selectedSemester)
        if (res.success) setCourses(res.data)
      } catch (err) {
        console.error("Failed to load courses", err)
      }
    }
    fetchCourses()
  }, [selectedFaculty, selectedSemester])

  const handleOpenCreate = () => {
    setEditingSchedule(null)
    setFormData({ day_of_week: 'Senin', course_id: '', room_id: '', start_time: '08:00', end_time: '09:30' })
    setSelectedFaculty('')
    setSelectedSemester('1')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (day, item) => {
    setEditingSchedule({ ...item, oldDay: day })
    setFormData({
      day_of_week: item.day_of_week,
      course_id: item.course_id,
      room_id: item.room_id,
      start_time: item.start_time,
      end_time: item.end_time
    })
    setSelectedFaculty('')
    setSelectedSemester('1')
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
        const res = await scheduleService.updateSchedule(editingSchedule.id, formData)
        if (res.success) {
          await fetchData()
          setIsModalOpen(false)
          success("Jadwal berhasil diperbarui.")
        }
      } else {
        const res = await scheduleService.createSchedule(formData)
        if (res.success) {
          await fetchData()
          setIsModalOpen(false)
          success("Jadwal berhasil ditambahkan.")
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Terjadi kesalahan."
      error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSchedule) return
    setSubmitting(true)
    
    try {
      const res = await scheduleService.deleteSchedule(deletingSchedule.id)
      if (res.success) {
        await fetchData()
        setIsDeleteModalOpen(false)
        success("Jadwal berhasil dihapus.")
      }
    } catch (err) {
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  // Derived state for selected course to show lecturer
  const selectedCourseObj = courses.find(c => String(c.id) === String(formData.course_id))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Jadwal Mengajar
            {activeAcademicYear && (
              <Badge variant="outline" className={activeAcademicYear.term === 'Ganjil' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                {activeAcademicYear.name} ({activeAcademicYear.term})
              </Badge>
            )}
          </h2>
          <p className="text-slate-500 mt-1">Kelola plotting jadwal dosen dan ruangan kelas.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={!activeAcademicYear}>
          <Plus size={18} /> Tambah Jadwal
        </Button>
      </div>

      {!activeAcademicYear && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-700">
          <BookOpen className="shrink-0" />
          <p className="text-sm font-medium">Belum ada Tahun Akademik yang aktif. Silakan atur di menu <strong>Tahun Akademik</strong> terlebih dahulu agar dapat membuat jadwal.</p>
        </div>
      )}

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
                <div className="p-6 flex items-center justify-center text-slate-500">
                  <Loader2 className="animate-spin mr-2" size={16} /> Memuat...
                </div>
              ) : schedules[day] && schedules[day].length > 0 ? (
                <div className="divide-y divide-slate-100 flex-1">
                  {schedules[day].map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-brand-700">{item.course_name}</h4>
                        <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock size={12}/> {item.start_time} - {item.end_time}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-400"/> Dosen: {item.lecturer_name}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400"/> Ruang: {item.room_name}
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
                    name="day_of_week" 
                    value={formData.day_of_week} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Fakultas / Prodi</label>
                    <select 
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Pilih Fakultas/Prodi</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Semester</label>
                    <select 
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {activeAcademicYear?.term === 'Ganjil' 
                        ? [1,3,5,7].map(s => <option key={s} value={s}>Semester {s} (Ganjil)</option>)
                        : [2,4,6,8].map(s => <option key={s} value={s}>Semester {s} (Genap)</option>)
                      }
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Mata Kuliah</label>
                  <select 
                    name="course_id" 
                    value={formData.course_id} 
                    onChange={handleChange} 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>
                      {(!selectedFaculty) ? "Pilih Fakultas Dulu" : (courses.length === 0 ? "Tidak Ada MK" : "Pilih Mata Kuliah")}
                    </option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {/* Preserve existing value when editing if not in list */}
                    {editingSchedule && formData.course_id && !courses.find(c => c.id === formData.course_id) && (
                      <option value={formData.course_id}>{editingSchedule.course_name} (Tersimpan)</option>
                    )}
                  </select>
                </div>
                
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dosen Pengampu</label>
                  <p className="font-medium text-slate-800">
                    {selectedCourseObj ? selectedCourseObj.lecturer_name : (editingSchedule ? editingSchedule.lecturer_name : 'Pilih mata kuliah')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Dosen otomatis diambil dari Master Mata Kuliah.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Jam Mulai</label>
                    <Input 
                      type="time" 
                      name="start_time" 
                      value={formData.start_time} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Jam Selesai</label>
                    <Input 
                      type="time" 
                      name="end_time" 
                      value={formData.end_time} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Ruangan</label>
                  <select 
                    name="room_id" 
                    value={formData.room_id} 
                    onChange={handleChange} 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Pilih Ruangan</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
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
                Apakah Anda yakin ingin menghapus jadwal <strong>{deletingSchedule?.course_name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
