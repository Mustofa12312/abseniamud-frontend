import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { BookOpen, Plus, Edit2, Trash2 } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"

export default function CourseMaster() {
  const { success, error } = useToast()
  const [courses, setCourses] = useState([])
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filterFaculty, setFilterFaculty] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [deletingCourse, setDeletingCourse] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    faculty_id: '',
    name: '',
    code: '',
    semester: '1',
    sks: '2'
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [facRes, courRes] = await Promise.all([
        adminService.getFaculties(),
        adminService.getCourses(filterFaculty)
      ])
      if (facRes.success) setFaculties(facRes.data)
      if (courRes.success) setCourses(courRes.data)
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterFaculty])

  const handleOpenCreate = () => {
    setEditingCourse(null)
    setFormData({ faculty_id: filterFaculty || '', name: '', code: '', semester: '1', sks: '2' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingCourse(item)
    setFormData({
      faculty_id: item.faculty_id,
      name: item.name,
      code: item.code || '',
      semester: item.semester,
      sks: item.sks
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingCourse(item)
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingCourse) {
        const res = await adminService.updateCourse(editingCourse.id, formData)
        if (res.success) {
          success(res.message || "Mata kuliah berhasil diperbarui.")
          fetchData()
          setIsModalOpen(false)
        }
      } else {
        const res = await adminService.createCourse(formData)
        if (res.success) {
          success(res.message || "Mata kuliah berhasil ditambahkan.")
          fetchData()
          setIsModalOpen(false)
        }
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCourse) return
    setSubmitting(true)
    
    try {
      const res = await adminService.deleteCourse(deletingCourse.id)
      if (res.success) {
        success(res.message || "Mata kuliah berhasil dihapus.")
        fetchData()
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal menghapus mata kuliah.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Mata Kuliah</h2>
          <p className="text-slate-500 mt-1">Kelola data mata kuliah berdasarkan prodi dan semester.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Semua Fakultas/Prodi</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 shrink-0">
            <Plus size={18} /> Tambah MK
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 animate-pulse">Memuat data mata kuliah...</div>
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <Card key={course.id} className="border-none shadow-sm flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-100 text-brand-700 px-3 py-1 rounded-bl-xl font-bold text-xs">
                Smt {course.semester}
              </div>
              <CardContent className="p-5 flex-1 flex flex-col pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <BookOpen size={20} />
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{course.name}</h3>
                <div className="mt-2 space-y-1.5 flex-1">
                  <p className="text-sm text-slate-500">
                    {course.faculty?.name || '-'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <span className="text-slate-400">Kode:</span> 
                      <span className="font-medium text-slate-700">{course.code || '-'}</span>
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <span className="text-slate-400">SKS:</span> 
                      <span className="font-medium text-slate-700">{course.sks}</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => handleOpenEdit(course)} variant="outline" size="sm" className="w-full text-xs h-8">
                    <Edit2 size={14} className="mr-1.5"/> Edit
                  </Button>
                  <Button onClick={() => handleOpenDelete(course)} variant="outline" size="sm" className="w-full text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Trash2 size={14} className="mr-1.5"/> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
            <EmptyState 
              title="Belum Ada Mata Kuliah" 
              description="Data master mata kuliah masih kosong atau tidak ada yang sesuai filter." 
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}</CardTitle>
              <CardDescription>
                Silakan isi informasi mata kuliah di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Fakultas / Prodi</label>
                  <select 
                    name="faculty_id" 
                    value={formData.faculty_id} 
                    onChange={handleChange} 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Pilih Fakultas/Prodi</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Mata Kuliah</label>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Kode (Opsional)</label>
                  <Input 
                    type="text" 
                    name="code" 
                    value={formData.code} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Semester</label>
                    <select 
                      name="semester" 
                      value={formData.semester} 
                      onChange={handleChange} 
                      required
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">SKS</label>
                    <Input 
                      type="number" 
                      name="sks" 
                      value={formData.sks} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full bg-brand-600 hover:bg-brand-700">
                    {submitting ? 'Menyimpan...' : 'Simpan'}
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
                Apakah Anda yakin ingin menghapus mata kuliah <strong>{deletingCourse?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>
                  Batal
                </Button>
                <Button type="button" onClick={handleDelete} disabled={submitting} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
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
