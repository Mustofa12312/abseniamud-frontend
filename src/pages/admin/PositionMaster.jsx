import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Plus, Edit2, Trash2, Loader2, Search, CalendarCheck } from "lucide-react"
import { scheduleService } from "../../services/schedule"
import { useToast } from "../../contexts/ToastContext"

export default function PositionMaster() {
  const { success, error } = useToast()
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState(null)
  const [deletingPosition, setDeletingPosition] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({ 
    name: '', 
    requires_daily_attendance: false,
    work_start_time: '' 
  })
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await scheduleService.getPositions()
      if (res.success) setPositions(res.data)
    } catch (err) {
      console.error("Failed to load positions", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingPosition(null)
    setFormData({ name: '', requires_daily_attendance: false, work_start_time: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingPosition(item)
    setFormData({ 
      name: item.name,
      requires_daily_attendance: !!item.requires_daily_attendance,
      work_start_time: item.work_start_time || ''
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingPosition(item)
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
      if (editingPosition) {
        const res = await scheduleService.updatePosition(editingPosition.id, formData)
        if (res.success) {
          await fetchData()
          setIsModalOpen(false)
          success("Jabatan berhasil diperbarui.")
        }
      } else {
        const res = await scheduleService.createPosition(formData)
        if (res.success) {
          await fetchData()
          setIsModalOpen(false)
          success("Jabatan berhasil ditambahkan.")
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
    if (!deletingPosition) return
    setSubmitting(true)
    
    try {
      const res = await scheduleService.deletePosition(deletingPosition.id)
      if (res.success) {
        await fetchData()
        setIsDeleteModalOpen(false)
        success("Jabatan berhasil dihapus.")
      }
    } catch (err) {
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = positions.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Jabatan</h2>
          <p className="text-slate-500 mt-1">Kelola data jabatan struktural/fungsional untuk penugasan dosen.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Jabatan
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Jabatan</th>
                  <th className="px-6 py-4 text-center">Wajib Hadir Harian</th>
                  <th className="px-6 py-4 text-center">Jam Masuk</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Memuat data jabatan...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data jabatan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                      <td className="px-6 py-4 text-center">
                        {item.requires_daily_attendance ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                            <CalendarCheck size={11} /> Ya
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Tidak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {item.requires_daily_attendance && item.work_start_time 
                          ? item.work_start_time 
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)} className="h-8 w-8 p-0 text-brand-600 hover:text-brand-700 hover:bg-brand-50 border-brand-200">
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenDelete(item)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingPosition ? 'Edit Jabatan' : 'Tambah Jabatan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Jabatan</label>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Contoh: Kaprodi Sistem Informasi"
                    required 
                  />
                </div>

                {/* Daily attendance toggle */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="requires_daily_attendance"
                      checked={formData.requires_daily_attendance}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Wajib hadir setiap hari kerja</p>
                      <p className="text-xs text-slate-500">Pemegang jabatan ini wajib hadir Senin–Sabtu, terlepas dari jadwal mengajar.</p>
                    </div>
                  </label>

                  {formData.requires_daily_attendance && (
                    <div className="space-y-1.5 pl-7">
                      <label className="text-sm font-medium text-slate-700">Jam Masuk Khusus (opsional)</label>
                      <Input 
                        type="time"
                        name="work_start_time"
                        value={formData.work_start_time}
                        onChange={handleChange}
                        placeholder="07:00"
                      />
                      <p className="text-xs text-slate-400">Kosongkan untuk menggunakan jam masuk default dari Pengaturan.</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Memproses...' : 'Simpan'}
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
              <CardTitle>Hapus Jabatan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus <strong>{deletingPosition?.name}</strong>?
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
                <Button type="button" onClick={handleDelete} disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
