import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Settings, Save, AlertCircle, Clock, Map, Building2 } from "lucide-react"
import { adminService } from "../../services/admin"

export default function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  const [formData, setFormData] = useState({
    app_name: 'IAIMU Attendance',
    default_checkin_time: '07:00',
    late_tolerance_minutes: '15',
    default_radius_meters: '50'
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminService.getSettings()
        if (res.success && res.data) {
          setFormData({
            app_name: res.data.app_name || 'IAIMU Attendance',
            default_checkin_time: res.data.default_checkin_time || '07:00',
            late_tolerance_minutes: res.data.late_tolerance_minutes || '15',
            default_radius_meters: res.data.default_radius_meters || '50'
          })
        }
      } catch (err) {
        console.error("Gagal mengambil pengaturan", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await adminService.updateSettings(formData)
      if (res.success) {
        setMessage({ type: 'success', text: res.message })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan pengaturan.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Memuat pengaturan...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Settings className="text-slate-500" /> Pengaturan Sistem
        </h2>
        <p className="text-slate-500 mt-1">Konfigurasi parameter global yang akan berlaku untuk seluruh pengguna sistem.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <AlertCircle size={20} className="shrink-0" />
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Aplikasi */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-brand-50/50 p-4 border-b border-brand-100 flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-brand-900">Identitas Aplikasi</h3>
              <p className="text-xs text-brand-600">Pengaturan nama dan profil utama sistem</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Aplikasi</label>
                <Input 
                  name="app_name" 
                  value={formData.app_name} 
                  onChange={handleChange} 
                  placeholder="Misal: IAIMU Attendance"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aturan Waktu Absensi */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-amber-50/50 p-4 border-b border-amber-100 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Aturan Waktu Absensi</h3>
              <p className="text-xs text-amber-600">Jam kerja dan batas toleransi keterlambatan</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Jam Check-in Standar</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="time" 
                    name="default_checkin_time" 
                    value={formData.default_checkin_time} 
                    onChange={handleChange} 
                  />
                  <span className="text-sm text-slate-400">WIB</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Dosen yang tidak memiliki jadwal spesifik akan merujuk ke jam ini.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Toleransi Keterlambatan</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number" 
                    name="late_tolerance_minutes" 
                    value={formData.late_tolerance_minutes} 
                    onChange={handleChange} 
                    min="0"
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500 font-medium">Menit</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Lebih dari batas ini akan dihitung sebagai "Terlambat".</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aturan Geofence */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Map size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">Pengaturan Lokasi GPS</h3>
              <p className="text-xs text-emerald-600">Parameter untuk pembatasan jangkauan presensi (*Geofencing*)</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Radius Bawaan (Default Radius)</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number" 
                    name="default_radius_meters" 
                    value={formData.default_radius_meters} 
                    onChange={handleChange} 
                    min="10"
                    className="w-32"
                  />
                  <span className="text-sm text-slate-500 font-medium">Meter</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Akan digunakan jika lokasi tidak memiliki aturan radius spesifik.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <Button type="submit" disabled={saving} className="px-8 flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
