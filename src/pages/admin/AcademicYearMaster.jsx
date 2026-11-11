import { useState, useEffect, useMemo, useCallback } from "react"
import { 
  Calendar, Plus, Edit2, Trash2, Check, Search, Info, Loader2, X
} from "lucide-react"
import { masterDataService } from "../../services/masterData"
import { useToast } from "../../contexts/ToastContext"

export default function AcademicYearMaster() {
  const { success, error } = useToast()
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL") // ALL | ACTIVE | INACTIVE

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [deletingYear, setDeletingYear] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activatingId, setActivatingId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    term: 'Ganjil',
    is_active: false
  })

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await masterDataService.getAcademicYears()
      if (res.success) {
        setAcademicYears(res.data || [])
      }
    } catch (err) {
      console.error("Failed to load academic years", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAcademicYears()
  }, [fetchAcademicYears])

  const handleOpenCreate = () => {
    setEditingYear(null)
    setFormData({ name: '', term: 'Ganjil', is_active: false })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingYear(item)
    setFormData({
      name: item.name,
      term: item.term,
      is_active: Boolean(item.is_active)
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingYear(item)
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingYear) {
        const res = await masterDataService.updateAcademicYear(editingYear.id, formData)
        if (res.success) {
          success(res.message || "Tahun Akademik berhasil diperbarui.")
          await fetchAcademicYears()
          setIsModalOpen(false)
        }
      } else {
        const res = await masterDataService.createAcademicYear(formData)
        if (res.success) {
          success(res.message || "Tahun Akademik berhasil ditambahkan.")
          await fetchAcademicYears()
          setIsModalOpen(false)
        }
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickActivate = async (year) => {
    if (year.is_active || activatingId) return
    setActivatingId(year.id)
    try {
      const res = await masterDataService.updateAcademicYear(year.id, {
        name: year.name,
        term: year.term,
        is_active: true
      })
      if (res.success) {
        success(res.message || `Tahun Akademik ${year.name} (${year.term}) diaktifkan.`)
        await fetchAcademicYears()
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal mengaktifkan Tahun Akademik.")
    } finally {
      setActivatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingYear) return
    setSubmitting(true)

    try {
      const res = await masterDataService.deleteAcademicYear(deletingYear.id)
      if (res.success) {
        success(res.message || "Tahun Akademik berhasil dihapus.")
        await fetchAcademicYears()
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal menghapus Tahun Akademik.")
    } finally {
      setSubmitting(false)
    }
  }

  const counts = useMemo(() => ({
    ALL: academicYears.length,
    ACTIVE: academicYears.filter(y => y.is_active).length,
    INACTIVE: academicYears.filter(y => !y.is_active).length
  }), [academicYears])

  const filteredYears = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return academicYears.filter(year => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && year.is_active) ||
        (statusFilter === "INACTIVE" && !year.is_active)

      const matchesSearch =
        !q ||
        (year.name || "").toLowerCase().includes(q) ||
        (year.term || "").toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })
  }, [academicYears, statusFilter, searchQuery])

  const formatUpdatedDate = (dateStr) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    } catch {
      return "-"
    }
  }

  return (
    <div className="space-y-6">
      {/* ── BEGIN: PageTitleHeader ── */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-purpose="page-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Tahun Akademik</h1>
          <p className="text-sm text-[#86868B] dark:text-slate-400 mt-1">
            Kelola data Tahun Akademik dan atur status Ganjil/Genap.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-apple-sm hover:shadow-apple-hover transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Tambah Data</span>
          </button>
        </div>
      </section>
      {/* ── END: PageTitleHeader ── */}

      {/* ── BEGIN: SearchAndFiltersBar ── */}
      <section
        className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-[#E5E5EA] dark:border-slate-700/60 shadow-apple-sm"
        data-purpose="filters-bar"
      >
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868B] dark:text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tahun akademik (mis. 2026)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-[#1D1D1F] dark:text-white placeholder-[#86868B] dark:placeholder-slate-400 bg-[#F5F5F7]/80 dark:bg-slate-900/60 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Filter Segmented Tabs (Apple style) */}
        <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] dark:bg-slate-900/70 rounded-xl w-full sm:w-auto self-stretch sm:self-auto justify-center">
          {[
            { key: "ALL", label: "Semua", count: counts.ALL },
            { key: "ACTIVE", label: "Aktif", count: counts.ACTIVE },
            { key: "INACTIVE", label: "Non-Aktif", count: counts.INACTIVE }
          ].map(({ key, label, count }) => {
            const isSelected = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3.5 py-1 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "font-semibold bg-white dark:bg-slate-800 text-[#1D1D1F] dark:text-white shadow-apple-sm"
                    : "font-medium text-[#86868B] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60"
                }`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      </section>
      {/* ── END: SearchAndFiltersBar ── */}

      {/* ── BEGIN: AcademicYearCardGrid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-purpose="academic-cards-grid">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E5E5EA] dark:border-slate-700/60 p-6 shadow-apple-card animate-pulse h-[260px]"
            />
          ))
        ) : filteredYears.length > 0 ? (
          filteredYears.map((year) => {
            const isActive = Boolean(year.is_active)
            const isGanjil = year.term === "Ganjil"
            const isActivating = activatingId === year.id

            return (
              <article
                key={year.id}
                data-purpose={isActive ? "academic-card-active" : "academic-card-inactive"}
                className={`relative group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-apple-card hover:shadow-apple-hover transition-all duration-300 flex flex-col justify-between ${
                  isActive
                    ? "border-2 border-emerald-500/80"
                    : "border border-[#E5E5EA] dark:border-slate-700/60"
                }`}
              >
                <div>
                  {/* Top Row: Icon Badge and Status Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                          : "bg-[#F5F5F7] dark:bg-slate-700/60 text-[#86868B] dark:text-slate-400 ring-black/5 dark:ring-slate-600"
                      }`}
                    >
                      <Calendar className="w-5 h-5" strokeWidth={1.8} />
                    </div>

                    {isActive ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold tracking-wide shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>AKTIF</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-slate-700 text-[#6E6E73] dark:text-slate-300 text-[11px] font-semibold">
                        <span>NON-AKTIF</span>
                      </div>
                    )}
                  </div>

                  {/* Academic Year Title & Semester Pill */}
                  <div className="space-y-2.5">
                    <h3
                      className={`text-2xl font-bold tracking-tight transition-colors ${
                        isActive
                          ? "text-[#1D1D1F] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
                          : "text-[#1D1D1F] dark:text-white group-hover:text-neutral-700 dark:group-hover:text-slate-200"
                      }`}
                    >
                      {year.name}
                    </h3>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isGanjil
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/50"
                        }`}
                      >
                        Semester {year.term}
                      </span>
                    </div>
                  </div>

                  {/* Metadata List */}
                  <div className="mt-5 pt-4 border-t border-[#F0F0F2] dark:border-slate-700/60 space-y-2 text-xs text-[#86868B] dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-[#86868B] dark:text-slate-400">Semester</span>
                      <span className="font-medium text-[#1D1D1F] dark:text-slate-200">{year.term}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#86868B] dark:text-slate-400">Status Presensi</span>
                      {isActive ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Berjalan Normal
                        </span>
                      ) : (
                        <span className="font-medium text-[#86868B] dark:text-slate-400">
                          Arsip Tersimpan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#86868B] dark:text-slate-400">Diperbarui</span>
                      <span className="font-medium text-[#1D1D1F] dark:text-slate-300">
                        {formatUpdatedDate(year.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-6 pt-4 border-t border-[#F0F0F2] dark:border-slate-700/60 flex items-center justify-between gap-2">
                  {isActive ? (
                    <span className="text-[11px] text-[#86868B] dark:text-slate-400 italic">
                      Tahun Terpilih
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickActivate(year)}
                      disabled={isActivating}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {isActivating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Mengaktifkan...</span>
                        </>
                      ) : (
                        <span>Jadikan Aktif</span>
                      )}
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(year)}
                      title="Ubah data"
                      className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(year)}
                      disabled={isActive}
                      title={isActive ? "Tahun aktif tidak dapat dihapus" : "Hapus tahun akademik"}
                      className="p-2 rounded-xl text-[#86868B] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-800 rounded-2xl border border-[#E5E5EA] dark:border-slate-700/60 p-12 text-center shadow-apple-card">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] dark:bg-slate-700 flex items-center justify-center mx-auto mb-3 text-[#86868B]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
              {academicYears.length === 0 ? "Belum Ada Tahun Akademik" : "Data Tidak Ditemukan"}
            </h3>
            <p className="text-xs text-[#86868B] dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {academicYears.length === 0
                ? "Data master tahun akademik masih kosong. Silakan tambah data baru."
                : "Tidak ada tahun akademik yang sesuai dengan pencarian atau filter yang dipilih."}
            </p>
          </div>
        )}
      </section>
      {/* ── END: AcademicYearCardGrid ── */}

      {/* ── BEGIN: NoticeCard ── */}
      <section
        className="rounded-2xl bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700/60 p-4 shadow-apple-sm flex items-start gap-3.5"
        data-purpose="system-note"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-[#6E6E73] dark:text-slate-400 leading-relaxed">
          <span className="font-semibold text-[#1D1D1F] dark:text-white">Petunjuk Kebijakan Akademik:</span>{" "}
          Mengubah status Tahun Akademik menjadi{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">AKTIF</span> akan secara otomatis
          menyelaraskan jadwal presensi dosen pengampu pada portal absensi digital IAIMU. Pastikan plotting mata
          kuliah dan jadwal kelas telah rampung sebelum mengaktifkan semester berjalan.
        </div>
      </section>
      {/* ── END: NoticeCard ── */}

      {/* ── BEGIN: Create / Edit Apple Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAFAFC] dark:bg-slate-850 border-b border-[#F0F0F2] dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  {editingYear ? "Edit Tahun Akademik" : "Tambah Tahun Akademik"}
                </h3>
                <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">
                  Silakan lengkapi informasi tahun akademik di bawah ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#EBEBED] dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Tahun Akademik
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Contoh: 2026-2027"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-apple-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Semester
                </label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-apple-sm transition-all"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>

              <label
                htmlFor="is_active"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F5F5F7] dark:bg-slate-900/60 border border-[#E5E5EA] dark:border-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-xs font-medium text-[#1D1D1F] dark:text-slate-200">
                  Jadikan sebagai Tahun Akademik Aktif
                </span>
              </label>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E5EA] dark:border-slate-700 text-xs font-semibold text-[#1D1D1F] dark:text-slate-300 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-apple-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── END: Create / Edit Apple Modal ── */}

      {/* ── BEGIN: Delete Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-apple-hover border border-[#E5E5EA] dark:border-slate-700 overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto mb-4 ring-4 ring-rose-50/60 dark:ring-rose-950/40">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white mb-1">
              Konfirmasi Hapus
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-slate-400 mb-6">
              Apakah Anda yakin ingin menghapus Tahun Akademik{" "}
              <strong className="text-[#1D1D1F] dark:text-white">
                {deletingYear?.name} ({deletingYear?.term})
              </strong>
              ?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E5EA] dark:border-slate-700 text-xs font-semibold text-[#1D1D1F] dark:text-slate-300 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-apple-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── END: Delete Confirmation Modal ── */}
    </div>
  )
}
