import { useState, useEffect } from "react"
import { FileText, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Card } from "../../components/ui/Card"
import api from "../../services/api"
import { useToast } from "../../contexts/ToastContext"

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const { success, error } = useToast()

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
    if (window.confirm(`Yakin ingin mengubah status menjadi ${status}?`)) {
      try {
        await api.put(`/admin/leaves/${id}`, { status })
        success(`Status berhasil diubah menjadi ${status}`)
        fetchLeaves()
      } catch (err) {
        error("Gagal mengubah status")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Persetujuan Izin / Cuti</h1>
        <p className="text-sm text-slate-500">Kelola pengajuan ketidakhadiran dari dosen dan tendik.</p>
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
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada pengajuan izin/cuti.</td>
                </tr>
              ) : (
                leaves.map((item) => (
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
                          <button onClick={() => handleUpdateStatus(item.id, 'APPROVED')} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-semibold">
                            <CheckCircle size={14} /> Terima
                          </button>
                          <button onClick={() => handleUpdateStatus(item.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-semibold">
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
    </div>
  )
}
