import { useState, useEffect } from "react"
import { FileText, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Card } from "../../components/ui/Card"
import api from "../../services/api"
import { useToast } from "../../contexts/ToastContext"

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { success, error } = useToast()
  const [confirmAction, setConfirmAction] = useState(null) // {id, status}

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/leaves')
      if (res.data.success) {
        setLeaves(res.data.data)
      }
    } catch (err) {
      error("Gagal memuat data izin")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/admin/leaves/${id}`, { status })
      success(`Status berhasil diubah menjadi ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`)
      setConfirmAction(null)
      fetchLeaves()
    } catch (err) {
      error("Gagal mengubah status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Persetujuan Izin / Cuti</h1>
          <p className="text-sm text-slate-500">Kelola pengajuan ketidakhadiran dari dosen dan tendik.</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {[['ALL','Semua'],['PENDING','Menunggu'],['APPROVED','Disetujui'],['REJECTED','Ditolak']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === val ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Pengaju</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Alasan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Memuat data...
                  </td>
                </tr>
              ) : leaves.filter(l => statusFilter === 'ALL' ? true : l.status === statusFilter).length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada pengajuan izin/cuti untuk filter ini.</td>
                </tr>
              ) : (
                leaves.filter(l => statusFilter === 'ALL' ? true : l.status === statusFilter).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.user?.name}</div>
                      <div className="text-xs text-slate-500">{item.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.start_date === item.end_date 
                        ? new Date(item.start_date).toLocaleDateString('id-ID')
                        : `${new Date(item.start_date).toLocaleDateString('id-ID')} - ${new Date(item.end_date).toLocaleDateString('id-ID')}`
                      }
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2">{item.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Menunggu</span>}
                      {item.status === 'APPROVED' && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Disetujui</span>}
                      {item.status === 'REJECTED' && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Ditolak</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setConfirmAction({ id: item.id, status: 'APPROVED' })} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-semibold">
                            <CheckCircle size={14} /> Terima
                          </button>
                          <button onClick={() => setConfirmAction({ id: item.id, status: 'REJECTED' })} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-semibold">
                            <XCircle size={14} /> Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction.status === 'APPROVED' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {confirmAction.status === 'APPROVED' ? <CheckCircle size={22} className="text-emerald-600" /> : <XCircle size={22} className="text-red-600" />}
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                {confirmAction.status === 'APPROVED' ? 'Setujui Permohonan?' : 'Tolak Permohonan?'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">Tindakan ini akan memperbarui status pengajuan izin/cuti.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button
                  onClick={() => handleUpdateStatus(confirmAction.id, confirmAction.status)}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${confirmAction.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {confirmAction.status === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
