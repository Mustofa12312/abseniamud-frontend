import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { CalendarDays, Clock, Send, FileText } from "lucide-react"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"
import api from "../../services/api"

export default function LecturerLeave() {
  const { success, error } = useToast()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: 'IZIN',
    start_date: '',
    end_date: '',
    reason: ''
  })

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves')
      if (res.data.success) setLeaves(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeaves() }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.start_date || !formData.end_date) {
      error("Tanggal mulai dan selesai harus diisi!")
      return
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      error("Tanggal selesai tidak boleh sebelum tanggal mulai!")
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post('/leaves', formData)
      if (res.data.success) {
        success("Pengajuan izin berhasil dikirim!")
        setFormData({ type: 'IZIN', start_date: '', end_date: '', reason: '' })
        fetchLeaves()
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengirim pengajuan.")
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Izin & Cuti</h2>
        <p className="text-slate-500 mt-1">Ajukan permohonan izin, sakit, atau cuti kepada admin.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form Pengajuan */}
        <Card className="md:col-span-1 border-none shadow-sm h-fit">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} className="text-brand-600"/> Form Pengajuan
            </CardTitle>
            <CardDescription>Isi form di bawah ini untuk mengajukan izin atau cuti.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Jenis Ketidakhadiran</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="IZIN">Izin</option>
                  <option value="SAKIT">Sakit</option>
                  <option value="CUTI">Cuti</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tanggal Mulai</label>
                <Input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tanggal Selesai</label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Alasan / Keterangan</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Jelaskan alasan pengajuan..."
                  required
                ></textarea>
              </div>

              <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2">
                {submitting ? 'Mengirim...' : <><Send size={16}/> Ajukan</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Riwayat Pengajuan */}
        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex justify-between items-center">
              Riwayat Pengajuan Anda
              <Badge variant="outline" className="bg-white">{leaves.length} Total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Memuat riwayat...</div>
            ) : leaves.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {leaves.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{item.type}</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <CalendarDays size={14} className="text-brand-600"/>
                          {item.start_date === item.end_date
                            ? new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                            : `${new Date(item.start_date).toLocaleDateString('id-ID')} - ${new Date(item.end_date).toLocaleDateString('id-ID')}`
                          }
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 pl-1 italic">"{item.reason}"</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={12}/> Diajukan: {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
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
                  description="Belum ada riwayat pengajuan izin/cuti yang Anda buat."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
