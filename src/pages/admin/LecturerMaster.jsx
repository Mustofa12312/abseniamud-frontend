import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Search, Plus, Edit2, Trash2 } from "lucide-react"
import { adminService } from "../../services/admin"

export default function LecturerMaster() {
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
        const res = await adminService.getLecturers()
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
        const res = await adminService.updateLecturer(editingLecturer.id, formattedData)
        if (res.success) {
          setLecturers(lecturers.map(l => l.id === editingLecturer.id ? { ...l, ...formattedData } : l))
          setIsModalOpen(false)
        }
      } else {
        const res = await adminService.createLecturer(formattedData)
        if (res.success) {
          setLecturers([...lecturers, res.data])
          setIsModalOpen(false)
        }
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingLecturer) return
    setSubmitting(true)
    
    try {
      const res = await adminService.deleteLecturer(deletingLecturer.id)
      if (res.success) {
        setLecturers(lecturers.filter(l => l.id !== deletingLecturer.id))
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      alert("Gagal menghapus.")
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
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto flex items-center gap-2">
            <Plus size={18} /> Tambah Dosen
          </Button>
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
