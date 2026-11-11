import { useState, useEffect, useCallback } from "react"
import { Bell, Plus, Edit2, Trash2, Loader2, Megaphone, Smartphone, Search, Calendar, X } from "lucide-react"
import api from "../../services/api"
import { useToast } from "../../contexts/ToastContext"

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { success, error } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '', is_active: true, is_important: false })
  const [editingId, setEditingId] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/announcements')
      if (res.data.success) {
        setAnnouncements(res.data.data || [])
      }
    } catch {
      error("Gagal memuat pengumuman")
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchAnnouncements()
    })
    return () => { active = false }
  }, [fetchAnnouncements])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitLoading(true)
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, formData)
        success("Pengumuman berhasil diubah")
      } else {
        await api.post('/admin/announcements', formData)
        success("Pengumuman berhasil dibuat")
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ title: '', content: '', is_active: true, is_important: false })
      fetchAnnouncements()
    } catch {
      error("Gagal menyimpan pengumuman")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      content: item.content,
      is_active: Boolean(item.is_active),
      is_important: Boolean(item.is_important)
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/announcements/${id}`)
      success("Pengumuman berhasil dihapus")
      setDeleteConfirmId(null)
      fetchAnnouncements()
    } catch {
      error("Gagal menghapus pengumuman")
    }
  }

  const filteredAnnouncements = announcements.filter(item => {
    const q = searchQuery.toLowerCase()
    return item.title?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / itemsPerPage))
  const paginatedAnnouncements = filteredAnnouncements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      {/* ── BEGIN: Header Section ── */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-purpose="page-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Pengumuman Kampus</h2>
          <p className="text-sm text-[#86868B] dark:text-slate-400 mt-1">
            Kelola informasi dan pengumuman untuk seluruh dosen dan tendik.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData({ title: '', content: '', is_active: true, is_important: false })
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-apple-sm inline-flex items-center gap-2 transition-all cursor-pointer shrink-0"
          type="button"
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          <span>Buat Pengumuman</span>
        </button>
      </section>
      {/* ── END: Header Section ── */}

      {/* ── BEGIN: Create/Edit Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-[#FAFAFC] dark:bg-slate-850 border-b border-[#F0F0F2] dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-white">
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400 mb-1.5">
                  Judul Pengumuman
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Misal: Libur Nasional Awal Perkuliahan..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-apple-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400 mb-1.5">
                  Isi Pengumuman
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Tuliskan detail pengumuman secara lengkap di sini..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-apple-sm transition-all"
                ></textarea>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-[#1D1D1F] dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 accent-emerald-600"
                    />
                    <span>Aktif (Tampil di Sistem)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-[#1D1D1F] dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.is_important}
                      onChange={e => setFormData({...formData, is_important: e.target.checked})}
                      className="rounded text-red-600 focus:ring-red-500 h-4 w-4 accent-red-600"
                    />
                    <span>Penting (Broadcast ke Android)</span>
                  </label>
                </div>

                {formData.is_important && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                    <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>Pengumuman ini otomatis disinkronkan sebagai <strong>Push Notification Prioritas Tinggi</strong> pada aplikasi Android seluruh dosen dan tendik.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F0F0F2] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-[#E5E5EA] dark:border-slate-700 text-[#1D1D1F] dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-apple-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── END: Create/Edit Form Modal ── */}

      {/* ── BEGIN: Main Card Container ── */}
      <section
        className="bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700/60 rounded-2xl shadow-apple-card overflow-hidden"
        data-purpose="announcements-card"
      >
        {/* Card Header & Search Bar */}
        <div className="p-6 pb-4 border-b border-[#F0F0F2] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="font-semibold text-[#1D1D1F] dark:text-white text-sm">Daftar Pengumuman</h3>
              <p className="text-[12px] text-[#86868B] dark:text-slate-400">Semua pengumuman aktif dan arsip kampus</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-50 dark:bg-slate-900 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-apple-sm"
              placeholder="Cari pengumuman..."
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            <Search className="w-3.5 h-3.5 text-[#86868B] dark:text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Table/List Columns Header */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-[#FAFAFC] dark:bg-slate-850 border-b border-[#F0F0F2] dark:border-slate-700 text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-8">Pengumuman</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Aksi</div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-[#F5F5F7] dark:divide-slate-700/50" data-purpose="announcements-list">
          {loading ? (
            <div className="p-12 text-center text-[#86868B] dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <p className="text-xs">Memuat data pengumuman...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center text-[#86868B] dark:text-slate-400">
              <Bell className="w-8 h-8 text-neutral-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#1D1D1F] dark:text-white">Tidak ada pengumuman</p>
              <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">Belum ada pengumuman yang sesuai dengan pencarian Anda.</p>
            </div>
          ) : (
            paginatedAnnouncements.map((item) => (
              <div
                key={item.id}
                className="p-6 hover:bg-neutral-50/50 dark:hover:bg-slate-750/50 transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center gap-4"
              >
                <div className="md:col-span-8 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Megaphone className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm md:text-base font-semibold text-[#1D1D1F] dark:text-white leading-snug">
                        {item.title}
                      </h4>
                      {item.is_important && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/70 dark:border-red-900/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          <Smartphone className="w-2.5 h-2.5" /> Push Alert HP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#86868B] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] dark:text-slate-400 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Dibuat: {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex md:justify-center items-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      item.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 shadow-apple-sm'
                        : 'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-600'
                    }`}
                  >
                    {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>

                <div className="md:col-span-2 flex items-center md:justify-end gap-1">
                  <button
                    aria-label="Edit Pengumuman"
                    onClick={() => handleEdit(item)}
                    className="p-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    type="button"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <button
                    aria-label="Hapus Pengumuman"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-2 text-[#86868B] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    type="button"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Pagination */}
        <div
          className="p-4 sm:px-6 border-t border-[#F0F0F2] dark:border-slate-700 bg-[#FAFAFC] dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868B] dark:text-slate-400"
          data-purpose="announcements-pagination"
        >
          <div>
            Menampilkan <span className="font-semibold text-[#1D1D1F] dark:text-white">{filteredAnnouncements.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)}</span> dari <span className="font-semibold text-[#1D1D1F] dark:text-white">{filteredAnnouncements.length}</span> pengumuman
          </div>
          {totalPages > 1 && (
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-slate-700 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-medium shadow-apple-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                type="button"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center shadow-apple-sm transition-colors cursor-pointer ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                  type="button"
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-slate-700 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-medium shadow-apple-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                type="button"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </section>
      {/* ── END: Main Card Container ── */}

      {/* ── BEGIN: Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/40">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-[#1D1D1F] dark:text-white text-base mb-1.5">Hapus Pengumuman?</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400 mb-6">Tindakan ini tidak dapat dibatalkan dan pengumuman akan terhapus dari sistem.</p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-apple-sm transition-colors cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── END: Delete Confirmation Modal ── */}
    </div>
  )
}
