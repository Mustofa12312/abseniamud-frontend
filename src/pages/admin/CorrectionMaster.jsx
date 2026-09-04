import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Check, X, Clock, AlertCircle, FileText, Calendar as CalendarIcon, User } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"

export default function CorrectionMaster() {
  const { success, error } = useToast()
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCorrections = async () => {
    try {
      const res = await adminService.getCorrections()
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

  const handleAction = async (id, actionType) => {
    try {
      if (actionType === 'approve') {
        const res = await adminService.approveCorrection(id)
        if (res.success) {
          setCorrections(corrections.map(c => c.id === id ? { ...c, status: 'APPROVED' } : c))
          success("Pengajuan berhasil disetujui.")
        }
      } else {
        const res = await adminService.rejectCorrection(id)
        if (res.success) {
          setCorrections(corrections.map(c => c.id === id ? { ...c, status: 'REJECTED' } : c))
          success("Pengajuan berhasil ditolak.")
        }
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal memproses pengajuan.")
      console.error(err)
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

  const pendingCount = corrections.filter(c => c.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Koreksi Presensi
            {pendingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-slate-500 mt-1">Tinjau dan proses pengajuan pembenaran absensi dari dosen.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} className="text-slate-500" /> Kotak Masuk Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Memuat data pengajuan...</div>
            ) : corrections.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {corrections.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User size={16} className="text-brand-600" /> {item.name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full">
                          <CalendarIcon size={12} /> {item.date}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {item.type}
                        </span>
                        <div className="md:ml-auto">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm mt-2 flex items-start gap-3">
                        <AlertCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{item.reason}"
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> Dikirim pada {item.submitted_at}
                      </p>
                    </div>

                    {item.status === 'PENDING' && (
                      <div className="flex items-center gap-2 md:shrink-0 pt-2 md:pt-0">
                        <Button 
                          onClick={() => handleAction(item.id, 'approve')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none"
                        >
                          <Check size={16} className="mr-1" /> Setujui
                        </Button>
                        <Button 
                          onClick={() => handleAction(item.id, 'reject')}
                          variant="outline" 
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 flex-1 md:flex-none"
                        >
                          <X size={16} className="mr-1" /> Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <EmptyState 
                  title="Semua Bersih!" 
                  description="Tidak ada pengajuan koreksi presensi saat ini." 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
