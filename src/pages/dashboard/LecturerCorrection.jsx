import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { Calendar as CalendarIcon, Clock, Send, FileText } from "lucide-react"
import { attendanceService } from "../../services/attendance"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"

export default function LecturerCorrection() {
  const { success, error } = useToast()
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    type: 'Lupa Check-in',
    reason: ''
  })

  const fetchCorrections = async () => {
    try {
      const res = await attendanceService.getCorrections()
      if (res.success) {
        setCorrections(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCorrections()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await attendanceService.submitCorrection(formData)
      if (res.success) {
        success(res.message || "Pengajuan koreksi berhasil dikirim.")
        setFormData({ date: '', type: 'Lupa Check-in', reason: '' })
        fetchCorrections()
      }
    } catch (err) {
      error(err.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Menunggu</Badge>
      case 'APPROVED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Disetujui</Badge>
      case 'REJECTED': return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">Ditolak</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-10 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Koreksi Presensi</h2>
        <p className="text-slate-500 mt-1">Ajukan pembenaran absensi jika Anda lupa atau terkendala sistem.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form Pengajuan */}
        <Card className="md:col-span-1 border-none shadow-sm h-fit">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} className="text-brand-600"/> Form Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tanggal</label>
                <Input 
                  type="date" 
                  name="date" 
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Jenis Kendala</label>
                <select 
                  name="type" 
                  value={formData.type}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="Lupa Check-in">Lupa Check-in</option>
                  <option value="Lupa Check-out">Lupa Check-out</option>
                  <option value="Masalah GPS/Lokasi">Masalah GPS/Lokasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Alasan / Keterangan</label>
                <textarea 
                  name="reason" 
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Jelaskan alasan pengajuan secara singkat..."
                  required
                ></textarea>
              </div>

              <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2">
                {submitting ? 'Mengirim...' : <><Send size={16}/> Ajukan Koreksi</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Riwayat Pengajuan */}
        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex justify-between items-center">
              Riwayat Pengajuan Anda
              <Badge variant="outline" className="bg-white">{corrections.length} Total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Memuat riwayat...</div>
            ) : corrections.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {corrections.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-brand-600"/>
                        <span className="font-medium text-slate-700">{item.date}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm text-slate-600">{item.type}</span>
                      </div>
                      <p className="text-sm text-slate-500 pl-6 border-l-2 border-slate-100 ml-1 mt-2 mb-1 italic">
                        "{item.reason}"
                      </p>
                      <p className="text-xs text-slate-400 pl-6 ml-1 flex items-center gap-1 mt-2">
                        <Clock size={12}/> Diajukan pada {item.created_at}
                      </p>
                    </div>
                    <div className="flex sm:justify-end sm:shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <EmptyState 
                  title="Belum Ada Riwayat" 
                  description="Belum ada riwayat pengajuan koreksi yang Anda buat." 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
