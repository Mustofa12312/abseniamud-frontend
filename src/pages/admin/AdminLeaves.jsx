import { useState, useEffect, useMemo, useCallback } from "react"
import { 
  FileText, Loader2, Check, X, RotateCcw, Search, Calendar, UserX
} from "lucide-react"
import api from "../../services/api"
import { useToast } from "../../contexts/ToastContext"

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const { success, error } = useToast()
  const [confirmAction, setConfirmAction] = useState(null) // {id, status, name, type}
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchLeaves = useCallback(async () => {
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
  }, [error])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

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

  const counts = useMemo(() => ({
    ALL: leaves.length,
    PENDING: leaves.filter(l => (l.status || '').toUpperCase() === 'PENDING').length,
    APPROVED: leaves.filter(l => (l.status || '').toUpperCase() === 'APPROVED').length,
    REJECTED: leaves.filter(l => (l.status || '').toUpperCase() === 'REJECTED').length
  }), [leaves])

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const upperStatus = (l.status || '').toUpperCase()
      const matchesFilter = statusFilter === 'ALL' || upperStatus === statusFilter
      
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || 
        (l.user?.name || '').toLowerCase().includes(q) ||
        (l.user?.email || '').toLowerCase().includes(q) ||
        (l.reason || '').toLowerCase().includes(q) ||
        (l.type || '').toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
  }, [leaves, statusFilter, searchQuery])

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / itemsPerPage))
  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatDate = (start, end) => {
    try {
      if (!start) return '-'
      const startDate = new Date(start).toLocaleDateString('id-ID')
      if (!end || start === end) return startDate
      const endDate = new Date(end).toLocaleDateString('id-ID')
      return `${startDate} - ${endDate}`
    } catch {
      return start || '-'
    }
  }

  return (
    <div className="space-y-6">
      {/* ── BEGIN: Page Header & Segmented Filters ── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4" data-purpose="content-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Persetujuan Izin / Cuti</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola pengajuan ketidakhadiran dari dosen dan tendik.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari pengaju, email, alasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-apple-sm"
            />
          </div>

          {/* Apple-like Segmented Filter Pills */}
          <div 
            className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 self-start sm:self-auto shadow-inner"
            data-purpose="segmented-filter"
          >
            {[
              { val: 'ALL', label: 'Semua', count: counts.ALL },
              { val: 'PENDING', label: 'Menunggu', count: counts.PENDING },
              { val: 'APPROVED', label: 'Disetujui', count: counts.APPROVED },
              { val: 'REJECTED', label: 'Ditolak', count: counts.REJECTED }
            ].map(({ val, label }) => {
              const isActive = statusFilter === val
              return (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs' 
                      : 'hover:text-slate-900 dark:hover:text-white transition-colors'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </section>
      {/* ── END: Page Header & Segmented Filters ── */}

      {/* ── BEGIN: TableCardContainer ── */}
      <section
        className="bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700/60 rounded-2xl shadow-apple-card overflow-hidden"
        data-purpose="table-container"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6 font-semibold" scope="col">Pengaju</th>
                <th className="py-3.5 px-6 font-semibold" scope="col">Jenis</th>
                <th className="py-3.5 px-6 font-semibold" scope="col">Tanggal</th>
                <th className="py-3.5 px-6 font-semibold" scope="col">Alasan</th>
                <th className="py-3.5 px-6 font-semibold" scope="col">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] dark:divide-slate-700/60 text-[13px] text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-medium">Memuat data permohonan izin...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UserX className="w-7 h-7 text-neutral-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm text-slate-800 dark:text-white">Tidak ada pengajuan izin/cuti</p>
                      <p className="text-xs text-slate-400">Tidak ada data yang cocok dengan kriteria filter saat ini</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeaves.map((item) => {
                  const upperStatus = (item.status || '').toUpperCase()
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/60 transition-colors group">
                      {/* Column 1: Pengaju */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.user?.name || '-'}
                        </div>
                        <div className="text-[12px] text-slate-400 dark:text-slate-400 mt-0.5">
                          {item.user?.email || '-'}
                        </div>
                      </td>

                      {/* Column 2: Jenis */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800/40">
                          {item.type || 'Izin'}
                        </span>
                      </td>

                      {/* Column 3: Tanggal */}
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(item.start_date, item.end_date)}</span>
                        </div>
                      </td>

                      {/* Column 4: Alasan & Lampiran */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-xs">
                        <div className="text-[13px] truncate" title={item.reason}>
                          {item.reason || '-'}
                        </div>
                        {item.document_path && (
                          <a
                            href={item.document_path.startsWith('http') ? item.document_path : `/storage/${item.document_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-md mt-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" /> Lampiran
                          </a>
                        )}
                        {item.admin_notes && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-md mt-1 inline-block">
                            <span className="font-semibold">Catatan:</span> {item.admin_notes}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {upperStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Menunggu
                          </span>
                        )}
                        {upperStatus === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Disetujui
                          </span>
                        )}
                        {upperStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Ditolak
                          </span>
                        )}
                      </td>

                      {/* Column 6: Aksi */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        {upperStatus === 'PENDING' ? (
                          <div className="inline-flex items-center justify-end gap-2">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/60 border border-emerald-200/90 dark:border-emerald-800/60 transition-all shadow-apple-sm active:scale-95 cursor-pointer"
                              type="button"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Terima</span>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/60 border border-rose-200/90 dark:border-rose-800/60 transition-all shadow-apple-sm active:scale-95 cursor-pointer"
                              type="button"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2">
                            <span className="text-xs font-medium text-slate-400 inline-block px-1.5 py-0.5 italic">
                              Selesai
                            </span>
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
                                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Ubah status menjadi Ditolak"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">Ubah</span>
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
                                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                title="Ubah status menjadi Disetujui"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">Ubah</span>
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

        {/* ── BEGIN: Table Footer / Pagination ── */}
        <div
          className="p-4 px-6 border-t border-[#E5E5EA] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40"
          data-purpose="table-footer"
        >
          <div>
            Menampilkan <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredLeaves.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredLeaves.length)}</span> dari <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredLeaves.length}</span> pengajuan
          </div>

          {totalPages > 1 && (
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors cursor-pointer shadow-apple-sm"
                type="button"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700'
                  }`}
                  type="button"
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors cursor-pointer shadow-apple-sm"
                type="button"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
        {/* ── END: Table Footer / Pagination ── */}
      </section>
      {/* ── END: TableCardContainer ── */}

      {/* ── BEGIN: Confirmation Apple Modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              confirmAction.status === 'APPROVED' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 ring-4 ring-emerald-50/60 dark:ring-emerald-950/40' 
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 ring-4 ring-rose-50/60 dark:ring-rose-950/40'
            }`}>
              {confirmAction.status === 'APPROVED' ? (
                <Check className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <X className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              {confirmAction.status === 'APPROVED' ? 'Setujui Permohonan?' : 'Tolak Permohonan?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pengaju: <span className="font-semibold text-slate-800 dark:text-slate-200">{confirmAction.name || '-'}</span> ({confirmAction.type})
            </p>

            <div className="mb-5 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Catatan Admin {confirmAction.status === 'REJECTED' ? '(Alasan Penolakan)' : '(Opsional)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={confirmAction.status === 'REJECTED' ? "Tuliskan alasan penolakan..." : "Tuliskan catatan tambahan jika ada..."}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-200 resize-none shadow-apple-sm transition-all"
              />
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => {
                  setConfirmAction(null)
                  setAdminNotes('')
                }} 
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors disabled:opacity-50 cursor-pointer shadow-apple-sm"
              >
                Batal
              </button>
              <button
                onClick={() => handleUpdateStatus(confirmAction.id, confirmAction.status)}
                disabled={submitting}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-apple-sm ${
                  confirmAction.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : confirmAction.status === 'APPROVED' ? (
                  'Ya, Setujui'
                ) : (
                  'Ya, Tolak'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── END: Confirmation Apple Modal ── */}
    </div>
  )
}
