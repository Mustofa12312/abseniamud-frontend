import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Search, Plus, Edit2, Trash2, UserCheck } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"

export default function StaffMaster() {
  const { success, error } = useToast()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [deletingStaff, setDeletingStaff] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '', email: '', nip: '', phone: '', department: '', address: ''
  })

  const fetchStaff = async () => {
    try {
      const res = await adminService.getStaff()
      if (res.success) setStaff(res.data)
    } catch (err) {
      console.error("Failed to load staff", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [])

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setFormData({ name: '', email: '', nip: '', phone: '', department: '', address: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (s) => {
    setEditingStaff(s)
    setFormData({
      name: s.name,
      email: s.email,
      nip: s.nip || '',
      phone: s.phone || '',
      department: s.department || '',
      address: s.address || '',
    })
    setIsModalOpen(true)
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingStaff) {
        const res = await adminService.updateStaff(editingStaff.id, formData)
        if (res.success) {
          success("Data tendik berhasil diperbarui.")
          setIsModalOpen(false)
          fetchStaff()
        }
      } else {
        const res = await adminService.createStaff(formData)
        if (res.success) {
          success("Tendik berhasil ditambahkan.")
          setIsModalOpen(false)
          fetchStaff()
        }
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingStaff) return
    setSubmitting(true)
    try {
      const res = await adminService.deleteStaff(deletingStaff.id)
      if (res.success) {
        setStaff(staff.filter(s => s.id !== deletingStaff.id))
        setIsDeleteModalOpen(false)
        success("Tendik berhasil dihapus.")
      }
    } catch (err) {
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.nip && s.nip.includes(searchQuery))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Tendik</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5">
            <UserCheck size={14} className="text-emerald-500" />
            Tenaga kependidikan — kehadiran wajib Senin–Sabtu.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Input
            icon={Search}
            placeholder="Cari nama / unit kerja..."
            className="w-full sm:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            <Plus size={16} /> Tambah Tendik
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <UserCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        <p>
          Semua tendik secara otomatis menggunakan aturan <strong>kehadiran wajib harian</strong>.
          Status kehadiran dihitung berdasarkan jam masuk yang dikonfigurasi di <strong>Pengaturan → Jam Masuk Tendik</strong>.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Memuat data tendik...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Tidak ada data tenaga kependidikan.</TableCell></TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{s.email}</TableCell>
                    <TableCell>{s.nip || <span className="text-slate-400 text-xs">Belum diatur</span>}</TableCell>
                    <TableCell>{s.department || <span className="text-slate-400 text-xs">—</span>}</TableCell>
                    <TableCell>{s.phone || <span className="text-slate-400 text-xs">—</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => handleOpenEdit(s)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600"><Edit2 size={16} /></Button>
                        <Button onClick={() => { setDeletingStaff(s); setIsDeleteModalOpen(true) }} variant="ghost" size="icon" className="h-8 w-8 text-red-600"><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingStaff ? 'Edit Tendik' : 'Tambah Tendik Baru'}</CardTitle>
              <CardDescription>Isi data tenaga kependidikan. Kehadiran wajib setiap hari kerja (Senin–Sabtu).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                  <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">NIP</label>
                    <Input type="text" name="nip" value={formData.nip} onChange={handleChange} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">No. Telepon</label>
                    <Input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Unit Kerja / Departemen</label>
                  <Input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Contoh: BAK, Perpustakaan, LP2M" />
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  💡 Password default: <strong>password</strong>. Minta tendik untuk mengganti setelah login pertama.
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {submitting ? 'Memproses...' : (editingStaff ? 'Simpan' : 'Tambah')}
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
            <CardHeader><CardTitle>Konfirmasi Hapus</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus <strong>{deletingStaff?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
                <Button onClick={handleDelete} disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white">
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
