import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"

export default function RoomMaster() {
  const { success, error } = useToast()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [deletingRoom, setDeletingRoom] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: ''
  })

  const fetchRooms = async () => {
    try {
      const res = await adminService.getRooms()
      if (res.success) {
        setRooms(res.data)
      }
    } catch (err) {
      console.error("Failed to load rooms", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleOpenCreate = () => {
    setEditingRoom(null)
    setFormData({ name: '', capacity: '', description: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingRoom(item)
    setFormData({
      name: item.name,
      capacity: item.capacity || '',
      description: item.description || ''
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingRoom(item)
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingRoom) {
        const res = await adminService.updateRoom(editingRoom.id, formData)
        if (res.success) {
          success(res.message || "Ruangan berhasil diperbarui.")
          fetchRooms()
          setIsModalOpen(false)
        }
      } else {
        const res = await adminService.createRoom(formData)
        if (res.success) {
          success(res.message || "Ruangan berhasil ditambahkan.")
          fetchRooms()
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
    if (!deletingRoom) return
    setSubmitting(true)
    
    try {
      const res = await adminService.deleteRoom(deletingRoom.id)
      if (res.success) {
        success(res.message || "Ruangan berhasil dihapus.")
        fetchRooms()
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal menghapus ruangan.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Ruangan</h2>
          <p className="text-slate-500 mt-1">Kelola data ruangan yang digunakan untuk kelas.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Ruangan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 animate-pulse">Memuat data ruangan...</div>
        ) : rooms.length > 0 ? (
          rooms.map((room) => (
            <Card key={room.id} className="border-none shadow-sm flex flex-col group">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                    <MapPin size={20} />
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800">{room.name}</h3>
                <div className="mt-2 space-y-1.5 flex-1">
                  <p className="text-sm text-slate-600 flex items-center justify-between">
                    <span className="text-slate-400">Kapasitas:</span> 
                    <span className="font-medium text-slate-700">{room.capacity ? `${room.capacity} Orang` : '-'}</span>
                  </p>
                  <p className="text-sm text-slate-600 flex flex-col mt-2">
                    <span className="text-slate-400 mb-1">Deskripsi:</span> 
                    <span className="text-slate-700">{room.description || '-'}</span>
                  </p>
                </div>
                
                <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => handleOpenEdit(room)} variant="outline" size="sm" className="w-full text-xs h-8">
                    <Edit2 size={14} className="mr-1.5"/> Edit
                  </Button>
                  <Button onClick={() => handleOpenDelete(room)} variant="outline" size="sm" className="w-full text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Trash2 size={14} className="mr-1.5"/> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
            <EmptyState 
              title="Belum Ada Ruangan" 
              description="Data master ruangan masih kosong. Silakan tambah ruangan baru." 
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</CardTitle>
              <CardDescription>
                Silakan isi informasi ruangan di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Ruangan</label>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Kapasitas (Opsional)</label>
                  <Input 
                    type="number" 
                    name="capacity" 
                    value={formData.capacity} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Deskripsi (Opsional)</label>
                  <Input 
                    type="text" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                  />
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
                Apakah Anda yakin ingin menghapus ruangan <strong>{deletingRoom?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
