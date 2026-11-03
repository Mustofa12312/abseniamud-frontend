import { useState, useEffect } from "react"
import { FileText, Loader2, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import api from "../../services/api"
import { useToast } from "../../contexts/ToastContext"

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { success, error } = useToast()
  const [confirmAction, setConfirmAction] = useState(null) // {id, status, name, type}
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/leaves')
      if (res.data?.success) {
        setLeaves(res.data.data || [])
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal memuat data izin")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleUpdateStatus = async (id, status) => {
    try {
      setSubmitting(true)
      const payload = { status }
      if (adminNotes.trim()) {
        payload.admin_notes = adminNotes.trim()
      }
      const res = await api.put(`/admin/leaves/${id}`, payload)
      if (res.data?.success) {
        success(`Pengajuan berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`)
        setLeaves(prev => prev.map(item => item.id === id ? { ...item, status, admin_notes: payload.admin_notes || item.admin_notes } : item))
        setConfirmAction(null)
        setAdminNotes('')
        fetchLeaves()
      } else {
        error(res.data?.message || "Gagal mengubah status")
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal mengubah status pengajuan izin")
    } finally {
      setSubmitting(false)
    }
  }

  const counts = {
    ALL: leaves.length,
    PENDING: leaves.filter(l => (l.status || '').toUpperCase() === 'PENDING').length,
    APPROVED: leaves.filter(l => (l.status || '').toUpperCase() === 'APPROVED').length,
    REJECTED: leaves.filter(l => (l.status || '').toUpperCase() === 'REJECTED').length
  }

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'ALL') return true
    return (l.status || '').toUpperCase() === statusFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Persetujuan Izin / Cuti</h1>
          <p className="text-sm text-slate-500">Kelola pengajuan ketidakhadiran dari dosen dan tendik.</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            ['ALL', `Semua (${counts.ALL})`],
            ['PENDING', `Menunggu (${counts.PENDING})`],
            ['APPROVED', `Disetujui (${counts.APPROVED})`],
            ['REJECTED', `Ditolak (${counts.REJECTED})`]
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === val ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
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
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-600" /> Memuat data...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    Belum ada pengajuan izin/cuti untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((item) => {
                  const upperStatus = (item.status || '').toUpperCase()
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{item.user?.name || '-'}</div>
                        <div className="text-xs text-slate-500">{item.user?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.start_date === item.end_date 
                          ? new Date(item.start_date).toLocaleDateString('id-ID')
                          : `${new Date(item.start_date).toLocaleDateString('id-ID')} - ${new Date(item.end_date).toLocaleDateString('id-ID')}`
                        }
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2">{item.reason}</p>
                        {item.document_path && (
                          <a
                            href={item.document_path.startsWith('http') ? item.document_path : `/storage/${item.document_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-0.5 rounded mt-1"
                          >
                            <FileText size={12} /> Lampiran
                          </a>
                        )}
                        {item.admin_notes && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            <span className="font-semibold">Catatan:</span> {item.admin_notes}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {upperStatus === 'PENDING' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                            Menunggu
                          </span>
                        )}
                        {upperStatus === 'APPROVED' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                            Disetujui
                          </span>
                        )}
                        {upperStatus === 'REJECTED' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {upperStatus === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setAdminNotes('')
                                setConfirmAction({
                                  id: item.id,
                                  status: 'APPROVED',
                                  name: item.user?.name,
                                  type: item.type
                                })
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-semibold"
                            >
                              <CheckCircle size={14} /> Terima
                            </button>
                            <button
                              onClick={() => {
                                setAdminNotes('')
                                setConfirmAction({
                                  id: item.id,
                                  status: 'REJECTED',
                                  name: item.user?.name,
                                  type: item.type
                                })
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-semibold"
                            >
                              <XCircle size={14} /> Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            {upperStatus === 'APPROVED' ? (
                              <button
                                onClick={() => {
                                  setAdminNotes('')
                                  setConfirmAction({
                                    id: item.id,
                                    status: 'REJECTED',
                                    name: item.user?.name,
                                    type: item.type
                                  })
                                }}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors"
                                title="Ubah status menjadi Ditolak"
                              >
                                <RotateCcw size={12} /> Ubah ke Tolak
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setAdminNotes('')
                                  setConfirmAction({
                                    id: item.id,
                                    status: 'APPROVED',
                                    name: item.user?.name,
                                    type: item.type
                                  })
                                }}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 px-2.5 py-1 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Ubah status menjadi Disetujui"
                              >
                                <RotateCcw size={12} /> Ubah ke Setuju
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmAction.status === 'APPROVED' ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {confirmAction.status === 'APPROVED' ? (
                  <CheckCircle size={22} className="text-emerald-600" />
                ) : (
                  <XCircle size={22} className="text-red-600" />
                )}
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">
                {confirmAction.status === 'APPROVED' ? 'Setujui Permohonan?' : 'Tolak Permohonan?'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Pengaju: <span className="font-semibold text-slate-700">{confirmAction.name || '-'}</span> ({confirmAction.type})
              </p>

              <div className="mb-5 text-left">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Catatan Admin {confirmAction.status === 'REJECTED' ? '(Alasan Penolakan)' : '(Opsional)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={confirmAction.status === 'REJECTED' ? "Tuliskan alasan penolakan..." : "Tuliskan catatan tambahan jika ada..."}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setConfirmAction(null)
                    setAdminNotes('')
                  }} 
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUpdateStatus(confirmAction.id, confirmAction.status)}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    confirmAction.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Memproses...
                    </>
                  ) : confirmAction.status === 'APPROVED' ? (
                    'Ya, Setujui'
                  ) : (
                    'Ya, Tolak'
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
