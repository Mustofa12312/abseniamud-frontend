import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Search, Plus, Edit2, Trash2, UserCheck, BookOpen, Download, Upload, FileSpreadsheet } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"
import { useRef } from "react"

const emptyForm = {
  name: '', email: '', nip: '', phone: '', department: '', address: '',
  is_also_lecturer: false, nidn: ''
}

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
  const [formData, setFormData] = useState(emptyForm)

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

  const fileInputRef = useRef(null)

  const handleExportCSV = async () => {
    try {
      setSubmitting(true)
      const blob = await adminService.exportStaff()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Data_Tendik_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error("Gagal mengekspor data tendik.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = "Nama Lengkap;Email;NIP;No. Telepon;Unit Kerja;Alamat;Juga Dosen?;NIDN\n"
    const dummyData = "Budi Santoso;budi@iaimu.ac.id;198001012005011002;08123456789;BAK;Jl. Raya No. 1;Tidak;\n"
    const csvContent = headers + dummyData

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "Template_Import_Tendik.csv")
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      error("Harap unggah file berformat CSV.")
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await adminService.importStaff(formData)
      if (res.success) {
        success(res.message)
        fetchStaff()
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengimpor data tendik.")
    } finally {
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setFormData(emptyForm)
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
      is_also_lecturer: !!s.is_also_lecturer,
      nidn: s.nidn || '',
    })
    setIsModalOpen(true)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.is_also_lecturer && !formData.nidn.trim()) {
      error("NIDN wajib diisi jika tendik ini juga mengajar.")
      return
    }
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
      error(err.response?.data?.message || "Gagal menghapus.")
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
      {/* Header */}
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
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-end">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <Button onClick={handleDownloadTemplate} variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50" disabled={submitting}>
              <FileSpreadsheet size={16} /> Template
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" disabled={submitting}>
              <Upload size={16} /> Import
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" disabled={submitting}>
              <Download size={16} /> Export
            </Button>
            <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm">
              <Plus size={16} /> Tambah Tendik
            </Button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <UserCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        <p>
          Semua tendik secara otomatis menggunakan aturan <strong>kehadiran wajib harian</strong>.
          Tendik yang juga mengajar akan muncul di daftar dosen (untuk penugasan mata kuliah),
          namun kehadiran tetap dihitung berdasarkan <strong>jam masuk tendik</strong>.
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead className="text-center">Juga Mengajar?</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Memuat data tendik...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Tidak ada data tenaga kependidikan.</TableCell></TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${s.is_also_lecturer ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          {s.name}
                          {s.is_also_lecturer && (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] font-medium">
                              <BookOpen size={9} /> Dosen
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{s.email}</TableCell>
                    <TableCell>{s.nip || <span className="text-slate-400 text-xs">—</span>}</TableCell>
                    <TableCell>{s.department || <span className="text-slate-400 text-xs">—</span>}</TableCell>
                    <TableCell className="text-center">
                      {s.is_also_lecturer ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 px-2.5 py-0.5 text-xs font-medium">
                          <BookOpen size={10} /> Ya (NIDN: {s.nidn || '—'})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Tidak</span>
                      )}
                    </TableCell>
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
          <Card className="w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingStaff ? 'Edit Tendik' : 'Tambah Tendik Baru'}</CardTitle>
              <CardDescription>Isi data tenaga kependidikan. Kehadiran wajib setiap hari kerja (Senin–Sabtu).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Data Utama */}
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

                {/* Dual Role Toggle */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="is_also_lecturer"
                      checked={formData.is_also_lecturer}
                      onChange={handleChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-purple-500" />
                        Tendik ini juga mengajar sebagai dosen
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Jika dicentang, akun ini akan muncul di daftar dosen dan bisa ditugaskan ke mata kuliah.
                        Kehadiran tetap dihitung dari jam masuk tendik.
                      </p>
                    </div>
                  </label>

                  {formData.is_also_lecturer && (
                    <div className="space-y-1.5 pl-7">
                      <label className="text-sm font-medium text-slate-700">
                        NIDN <span className="text-red-500">*</span>
                        <span className="text-slate-400 font-normal ml-1">(wajib jika mengajar)</span>
                      </label>
                      <Input
                        type="text"
                        name="nidn"
                        value={formData.nidn}
                        onChange={handleChange}
                        placeholder="Nomor Induk Dosen Nasional"
                        required={formData.is_also_lecturer}
                      />
                    </div>
                  )}
                </div>

                {/* Info password */}
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
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
              <p className="text-sm text-slate-600 mb-2">
                Apakah Anda yakin ingin menghapus <strong>{deletingStaff?.name}</strong>?
              </p>
              {deletingStaff?.is_also_lecturer && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 mb-4">
                  ⚠️ Tendik ini juga terdaftar sebagai dosen. Data dosen akan ikut dihapus jika belum memiliki mata kuliah yang ditugaskan.
                </div>
              )}
              <div className="flex gap-3 mt-4">
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
