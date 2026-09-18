import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icon in leaflet with bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react"
import { locationService } from "../../services/location"
import { useToast } from "../../contexts/ToastContext"

export default function LocationMaster() {
  const { success, error } = useToast()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const mapRef = useRef(null)
  
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
      const res = await locationService.getLocations()
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
    const { name, value } = e.target;
    
    // Auto-parse Google Maps URL or coordinate strings like "-7.123, 113.456"
    if ((name === 'lat' || name === 'lng') && (value.includes('google.com/maps') || value.includes('@') || value.includes(',') || value.includes('!3d'))) {
      
      // 1. Try to match exact pin from URL data (!3d and !4d)
      let match = value.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      
      // 2. Try to match @lat,lng from URL (viewport center)
      if (!match) {
        match = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      }
      
      // 3. Try to match simple "lat, lng" string (right click -> copy coordinates)
      if (!match) {
        match = value.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      }
      
      if (match) {
        setFormData(prev => ({
          ...prev,
          lat: match[1],
          lng: match[2]
        }));
        // Show toast notification
        success("Koordinat berhasil diekstrak dari teks!");
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Helper function to update coordinates from Map click
  const handleMapClick = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      lat: lat.toFixed(7),
      lng: lng.toFixed(7)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const formattedData = {
        name: formData.name,
        latitude: parseFloat(formData.lat),
        longitude: parseFloat(formData.lng),
        radius: parseInt(formData.radius, 10),
        max_accuracy: 50, // Default fallback
        is_active: true
      }
      
      if (editingLocation) {
        const res = await locationService.updateLocation(editingLocation.id, formattedData)
        if (res.success) {
          fetchLocations() // Better to refetch for consistent formatting
          setIsModalOpen(false)
          success("Lokasi berhasil diperbarui.")
        }
      } else {
        const res = await locationService.createLocation(formattedData)
        if (res.success) {
          fetchLocations() // Better to refetch for consistent formatting
          setIsModalOpen(false)
          success("Lokasi berhasil ditambahkan.")
        }
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Terjadi kesalahan. Pastikan koordinat dan radius valid.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingLocation) return
    setSubmitting(true)
    
    try {
      const res = await locationService.deleteLocation(deletingLocation.id)
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
                    <TableRow 
                      key={loc.id} 
                      className={`cursor-pointer transition-colors ${selectedLocation?.id === loc.id ? 'bg-brand-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className={`p-1.5 rounded ${selectedLocation?.id === loc.id ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}>
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
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenEdit(loc); }} variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                            <Edit2 size={16} />
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenDelete(loc); }} variant="ghost" size="icon" className="h-8 w-8 text-red-600">
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

        <Card className="h-fit sticky top-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Preview Peta Geofence</h3>
            
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative mb-4 z-0">
              {selectedLocation ? (
                <MapContainer 
                  center={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]} 
                  zoom={17} 
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />
                  <Marker position={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]} />
                  <Circle 
                    center={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]}
                    radius={parseFloat(selectedLocation.radius)}
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                  />
                  <MapUpdater center={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]} />
                </MapContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                  <MapPin size={48} className="mb-2 opacity-50" />
                  <p className="text-sm">Pilih lokasi di tabel</p>
                </div>
              )}
            </div>
            
            {selectedLocation && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nama:</span>
                    <span className="font-medium text-slate-800">{selectedLocation.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Radius:</span>
                    <span className="font-medium text-brand-600">{selectedLocation.radius} meter</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-brand-600 border-brand-200 hover:bg-brand-50"
                  onClick={() => window.open(`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`, '_blank')}
                >
                  <MapPin size={16} className="mr-2" />
                  Buka di Google Maps
                </Button>
              </div>
            )}
            
            {!selectedLocation && (
              <p className="text-sm text-slate-500 text-center mt-1">Pilih lokasi pada tabel untuk melihat jangkauan geofence pada peta.</p>
            )}
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
                      placeholder="-7.1234567"
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
                      placeholder="113.1234567"
                      required 
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Tips: Anda dapat mem-paste link Google Maps langsung ke dalam kolom Latitude/Longitude.</p>

                {/* Live Map Preview inside Modal */}
                <div className="mt-4 h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                  {formData.lat && formData.lng && !isNaN(parseFloat(formData.lat)) && !isNaN(parseFloat(formData.lng)) ? (
                    <MapContainer 
                      center={[parseFloat(formData.lat), parseFloat(formData.lng)]} 
                      zoom={17} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[parseFloat(formData.lat), parseFloat(formData.lng)]} />
                      {formData.radius && !isNaN(parseFloat(formData.radius)) && (
                        <Circle 
                          center={[parseFloat(formData.lat), parseFloat(formData.lng)]}
                          radius={parseFloat(formData.radius)}
                          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                        />
                      )}
                      <MapUpdater center={[parseFloat(formData.lat), parseFloat(formData.lng)]} />
                      <MapClickEvents onClick={handleMapClick} />
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <MapPin size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">Masukkan koordinat yang valid atau klik pada area peta (setelah koordinat awal diisi) untuk menyesuaikan lokasi.</p>
                    </div>
                  )}
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

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() > 10 ? map.getZoom() : 17);
  }, [center, map]);
  return null;
}

function MapClickEvents({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

