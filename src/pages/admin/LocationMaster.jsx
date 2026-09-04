import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"

export default function LocationMaster() {
  const { success, error } = useToast()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [deletingLocation, setDeletingLocation] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    radius: '',
    lat: '',
    lng: ''
  })

  const fetchLocations = async () => {
    try {
      const res = await adminService.getLocations()
      if (res.success) {
        setLocations(res.data)
      }
    } catch (err) {
      console.error("Failed to load locations", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleOpenCreate = () => {
    setEditingLocation(null)
    setFormData({ name: '', radius: '', lat: '', lng: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc)
    setFormData({
      name: loc.name,
      radius: loc.radius.toString().replace(/[^0-9]/g, ''),
      lat: loc.lat,
      lng: loc.lng
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (loc) => {
    setDeletingLocation(loc)
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
        radius: formData.radius + 'm'
      }
      
      if (editingLocation) {
        const res = await adminService.updateLocation(editingLocation.id, formattedData)
        if (res.success) {
          setLocations(locations.map(l => l.id === editingLocation.id ? res.data : l))
          setIsModalOpen(false)
          success("Lokasi berhasil diperbarui.")
        }
      } else {
        const res = await adminService.createLocation(formattedData)
        if (res.success) {
          setLocations([...locations, res.data])
          setIsModalOpen(false)
          success("Lokasi berhasil ditambahkan.")
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
    if (!deletingLocation) return
    setSubmitting(true)
    
    try {
      const res = await adminService.deleteLocation(deletingLocation.id)
      if (res.success) {
        setLocations(locations.filter(l => l.id !== deletingLocation.id))
        setIsDeleteModalOpen(false)
        success("Lokasi berhasil dihapus.")
      }
    } catch (err) {
      console.error(err)
      error("Gagal menghapus.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Lokasi</h2>
          <p className="text-slate-500 mt-1">Kelola area presensi dan batas radius (geofence).</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Lokasi
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lokasi</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Koordinat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data lokasi...</TableCell>
                  </TableRow>
                ) : locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Tidak ada lokasi terdaftar.</TableCell>
                  </TableRow>
                ) : (
                  locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="p-1.5 rounded bg-brand-50 text-brand-600">
                          <MapPin size={16} />
                        </div>
                        {loc.name}
                      </TableCell>
                      <TableCell>{loc.radius}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {loc.lat}, {loc.lng}
                      </TableCell>
                      <TableCell>
                        <Badge variant={loc.status === "Aktif" ? "success" : "default"}>
                          {loc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => handleOpenEdit(loc)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                            <Edit2 size={16} />
                          </Button>
                          <Button onClick={() => handleOpenDelete(loc)} variant="ghost" size="icon" className="h-8 w-8 text-red-600">
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

        <Card className="h-fit">
          <CardContent className="p-6 text-center">
            <div className="aspect-square bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden mb-4">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20"></div>
              <div className="h-32 w-32 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center relative z-10">
                <div className="h-4 w-4 bg-brand-600 rounded-full shadow-lg shadow-brand-600/50 relative">
                  <div className="absolute -inset-2 bg-brand-500/30 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800">Preview Peta</h3>
            <p className="text-sm text-slate-500 mt-1">Pilih lokasi pada tabel untuk melihat jangkauan geofence pada peta.</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</CardTitle>
              <CardDescription>
                Silakan isi formulir di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Lokasi</label>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Radius (meter)</label>
                  <Input 
                    type="number" 
                    name="radius" 
                    value={formData.radius} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Latitude</label>
                    <Input 
                      type="text" 
                      name="lat" 
                      value={formData.lat} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Longitude</label>
                    <Input 
                      type="text" 
                      name="lng" 
                      value={formData.lng} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Memproses...' : (editingLocation ? 'Simpan' : 'Tambah')}
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
                Apakah Anda yakin ingin menghapus lokasi <strong>{deletingLocation?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
