import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Plus, Edit2, Trash2, Loader2, Search, Briefcase } from "lucide-react"
import { scheduleService } from "../../services/schedule"
import { lecturerService } from "../../services/lecturer"
import { useToast } from "../../contexts/ToastContext"

export default function AssignmentMaster() {
  const { success, error } = useToast()
  const [assignments, setAssignments] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deletingAssignment, setDeletingAssignment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({ lecturer_id: '', position_id: '', is_primary: false })
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assRes, lecRes, posRes] = await Promise.all([
        scheduleService.getAssignments(),
        lecturerService.getLecturers(),
        scheduleService.getPositions()
      ])
      if (assRes.success) setAssignments(assRes.data)
      if (lecRes.success) setLecturers(lecRes.data)
      if (posRes.success) setPositions(posRes.data)
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingAssignment(null)
    setFormData({ lecturer_id: '', position_id: '', is_primary: false })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingAssignment(item)
    setFormData({ 
        lecturer_id: item.lecturer_id, 
        position_id: item.position_id, 
        is_primary: item.is_primary 
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingAssignment(item)
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
      if (editingAssignment) {
        const res = await scheduleService.updateAssignment(editingAssignment.id, formData)
        if (res.success) {
          await fetchData()
          setIsModalOpen(false)
          success("Penugasan berhasil diperbarui.")
        }
      } else {
        const res = await scheduleService.createAssignment(formData)
        if (res.success) {
          await fetchData()
          setIsModalOpen(false)
          success("Penugasan berhasil ditambahkan.")
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
    if (!deletingAssignment) return
    setSubmitting(true)
    
    try {
      const res = await scheduleService.deleteAssignment(deletingAssignment.id)
      if (res.success) {
        await fetchData()
        setIsDeleteModalOpen(false)
        success("Penugasan berhasil dihapus.")
      }
    } catch (err) {
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = assignments.filter(item => 
    item.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.position_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Penugasan Dosen</h2>
          <p className="text-slate-500 mt-1">Kelola penempatan dosen pada jabatan struktural atau fungsional tertentu.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Penugasan
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari dosen atau jabatan..."
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
                  <th className="px-6 py-4">Nama Dosen</th>
                  <th className="px-6 py-4">Jabatan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Memuat data penugasan...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data penugasan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.lecturer_name}</td>
                      <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                        <Briefcase size={14} className="text-brand-500" />
                        {item.position_name}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_primary ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Jabatan Utama</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600">Jabatan Tambahan</Badge>
                        )}
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
              <CardTitle>{editingAssignment ? 'Edit Penugasan' : 'Tambah Penugasan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Dosen</label>
                  <select 
                    name="lecturer_id" 
                    value={formData.lecturer_id} 
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Pilih Dosen</option>
                    {lecturers.map(lec => (
                      <option key={lec.id} value={lec.id}>{lec.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Jabatan</label>
                  <select 
                    name="position_id" 
                    value={formData.position_id} 
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Pilih Jabatan</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input 
                        type="checkbox" 
                        name="is_primary"
                        id="is_primary"
                        checked={formData.is_primary}
                        onChange={handleChange}
                        className="h-4 w-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    />
                    <label htmlFor="is_primary" className="text-sm font-medium text-slate-700">Tandai sebagai jabatan utama (menghapus status utama di jabatan lain dosen ini jika ada)</label>
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
              <CardTitle>Hapus Penugasan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus penugasan <strong>{deletingAssignment?.position_name}</strong> untuk dosen <strong>{deletingAssignment?.lecturer_name}</strong>?
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
