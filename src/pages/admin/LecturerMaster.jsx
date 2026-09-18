import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Search, Plus, Edit2, Trash2, Download, Upload, FileSpreadsheet } from "lucide-react"
import { adminService } from "../../services/admin"
import { lecturerService } from "../../services/lecturer"
import { useToast } from "../../contexts/ToastContext"
import { useRef } from "react"

export default function LecturerMaster() {
  const { success, error } = useToast()
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState(null)
  const [deletingLecturer, setDeletingLecturer] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nidn: '',
    nip: '',
    phone: ''
  })

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const res = await lecturerService.getLecturers()
        if (res.success) {
          setLecturers(res.data)
        }
      } catch (err) {
        console.error("Failed to load lecturers", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLecturers()
  }, [])

  const fileInputRef = useRef(null)

  const handleExportCSV = async () => {
    try {
      setSubmitting(true)
      const blob = await adminService.exportLecturers()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Data_Dosen_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error("Gagal mengekspor data dosen.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = "Nama Lengkap,Email,NIDN,NIP,Telepon,Alamat\n"
    const dummyData = "Budi Santoso,budi@iaimu.ac.id,123456789,198001012005011002,08123456789,Jl. Raya Pamekasan No. 1\n"
    const csvContent = headers + dummyData

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "Template_Import_Dosen.csv")
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
      
      const res = await adminService.importLecturers(formData)
      if (res.success) {
        success(res.message)
        const refresh = await lecturerService.getLecturers()
        if (refresh.success) setLecturers(refresh.data)
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengimpor data dosen.")
    } finally {
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleOpenCreate = () => {
    setEditingLecturer(null)
    setFormData({ name: '', email: '', nidn: '', nip: '', phone: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (lec) => {
    setEditingLecturer(lec)
    setFormData({
      name: lec.name,
      email: lec.email,
      nidn: lec.nidn !== '-' ? lec.nidn : '',
      nip: lec.nip || '',
      phone: lec.phone
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (lec) => {
    setDeletingLecturer(lec)
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const formattedData = {
        ...formData,
        nidn: formData.nidn || '-',
        nip: formData.nip || '-'
      }
      
      if (editingLecturer) {
        const res = await lecturerService.updateLecturer(editingLecturer.id, formattedData)
        if (res.success) {
          setLecturers(lecturers.map(l => l.id === editingLecturer.id ? { ...l, ...formattedData } : l))
          setIsModalOpen(false)
          success("Data dosen berhasil diperbarui.")
        }
      } else {
        const res = await lecturerService.createLecturer(formattedData)
        if (res.success) {
          setLecturers([...lecturers, res.data])
          setIsModalOpen(false)
          success("Data dosen berhasil ditambahkan.")
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
    if (!deletingLecturer) return
    setSubmitting(true)
    
    try {
      const res = await lecturerService.deleteLecturer(deletingLecturer.id)
      if (res.success) {
        setLecturers(lecturers.filter(l => l.id !== deletingLecturer.id))
        setIsDeleteModalOpen(false)
        success("Dosen berhasil dihapus.")
      }
    } catch (err) {
      console.error(err)
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = lecturers.filter(row => 
    row.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (row.nidn && row.nidn.includes(searchQuery))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Dosen</h2>
          <p className="text-slate-500 mt-1">Kelola data dosen dan kredensial akses.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Input 
            icon={Search} 
            placeholder="Cari nama/NIDN..." 
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
              <Plus size={16} /> Tambah Dosen
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Dosen</TableHead>
                <TableHead>Email Akun</TableHead>
                <TableHead>NIDN / NIP</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data dosen...</TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">Tidak ada data dosen.</TableCell>
                </TableRow>
              ) : (
                filteredData.map((lec) => (
                  <TableRow key={lec.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {lec.name.charAt(0).toUpperCase()}
                        </div>
                        {lec.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{lec.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{lec.nidn !== '-' ? lec.nidn : 'Belum diatur'}</span>
                        <span className="text-xs text-slate-400">{lec.nip}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lec.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => handleOpenEdit(lec)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <Edit2 size={16} />
                        </Button>
                        <Button onClick={() => handleOpenDelete(lec)} variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingLecturer ? 'Edit Dosen' : 'Tambah Dosen Baru'}</CardTitle>
              <CardDescription>
                Silakan isi formulir di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Akun</label>
                  <Input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">NIDN</label>
                    <Input 
                      type="text" 
                      name="nidn" 
                      value={formData.nidn} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">NIP</label>
                    <Input 
                      type="text" 
                      name="nip" 
                      value={formData.nip} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">No. Telepon</label>
                  <Input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Memproses...' : (editingLecturer ? 'Simpan' : 'Tambah')}
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
                Apakah Anda yakin ingin menghapus dosen <strong>{deletingLecturer?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
