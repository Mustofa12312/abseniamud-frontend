import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Calendar, Plus, Edit2, Trash2, CheckCircle } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"
import { Badge } from "../../components/ui/Badge"

export default function AcademicYearMaster() {
  const { success, error } = useToast()
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [deletingYear, setDeletingYear] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    term: 'Ganjil',
    is_active: false
  })

  const fetchAcademicYears = async () => {
    try {
      const res = await adminService.getAcademicYears()
      if (res.success) {
        setAcademicYears(res.data)
      }
    } catch (err) {
      console.error("Failed to load academic years", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  const handleOpenCreate = () => {
    setEditingYear(null)
    setFormData({ name: '', term: 'Ganjil', is_active: false })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingYear(item)
    setFormData({
      name: item.name,
      term: item.term,
      is_active: item.is_active
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingYear(item)
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingYear) {
        const res = await adminService.updateAcademicYear(editingYear.id, formData)
        if (res.success) {
          success(res.message || "Tahun Akademik berhasil diperbarui.")
          fetchAcademicYears()
          setIsModalOpen(false)
        }
      } else {
        const res = await adminService.createAcademicYear(formData)
        if (res.success) {
          success(res.message || "Tahun Akademik berhasil ditambahkan.")
          fetchAcademicYears()
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
    if (!deletingYear) return
    setSubmitting(true)
    
    try {
      const res = await adminService.deleteAcademicYear(deletingYear.id)
      if (res.success) {
        success(res.message || "Tahun Akademik berhasil dihapus.")
        fetchAcademicYears()
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal menghapus Tahun Akademik.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Tahun Akademik</h2>
          <p className="text-slate-500 mt-1">Kelola data Tahun Akademik dan atur status Ganjil/Genap.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 animate-pulse">Memuat data...</div>
        ) : academicYears.length > 0 ? (
          academicYears.map((year) => (
            <Card key={year.id} className={`border-none shadow-sm flex flex-col group relative overflow-hidden ${year.is_active ? 'ring-2 ring-brand-500' : ''}`}>
              {year.is_active && (
                <div className="absolute top-0 right-0 bg-brand-500 text-white px-3 py-1 rounded-bl-xl font-bold text-xs flex items-center gap-1">
                  <CheckCircle size={12}/> AKTIF
                </div>
              )}
              <CardContent className="p-5 flex-1 flex flex-col pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${year.is_active ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Calendar size={20} />
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{year.name}</h3>
                <div className="mt-2 space-y-1.5 flex-1">
                  <Badge variant="outline" className={year.term === 'Ganjil' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                    Semester {year.term}
                  </Badge>
                </div>
                
                <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => handleOpenEdit(year)} variant="outline" size="sm" className="w-full text-xs h-8">
                    <Edit2 size={14} className="mr-1.5"/> Edit
                  </Button>
                  <Button onClick={() => handleOpenDelete(year)} variant="outline" size="sm" className="w-full text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50" disabled={year.is_active}>
                    <Trash2 size={14} className="mr-1.5"/> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
            <EmptyState 
              title="Belum Ada Tahun Akademik" 
              description="Data master tahun akademik masih kosong. Silakan tambah data baru." 
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingYear ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}</CardTitle>
              <CardDescription>
                Silakan isi informasi di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tahun Akademik</label>
                  <Input 
                    type="text" 
                    name="name" 
                    placeholder="Contoh: 2023/2024"
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Semester</label>
                  <select 
                    name="term" 
                    value={formData.term} 
                    onChange={handleChange} 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Jadikan sebagai Tahun Akademik Aktif
                  </label>
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
                Apakah Anda yakin ingin menghapus Tahun Akademik <strong>{deletingYear?.name} ({deletingYear?.term})</strong>?
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
