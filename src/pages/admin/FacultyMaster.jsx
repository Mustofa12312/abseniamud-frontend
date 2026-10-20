import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { 
  GraduationCap, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  X, 
  CheckCircle2, 
  HelpCircle 
} from "lucide-react"
import { masterDataService } from "../../services/masterData"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"

export default function FacultyMaster() {
  const { success, error } = useToast()
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [deletingFaculty, setDeletingFaculty] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)

  // Import state
  const [selectedFile, setSelectedFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    code: ''
  })

  const fetchFaculties = async () => {
    try {
      const res = await masterDataService.getFaculties()
      if (res.success) {
        setFaculties(res.data)
      }
    } catch (err) {
      console.error("Failed to load faculties", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaculties()
  }, [])

  // Filter faculties by search query
  const filteredFaculties = faculties.filter(item => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const nameMatch = (item.name || '').toLowerCase().includes(q)
    const codeMatch = (item.code || '').toLowerCase().includes(q)
    return nameMatch || codeMatch
  })

  // Download Template (client-side or via backend)
  const handleDownloadTemplate = async () => {
    try {
      const blob = await masterDataService.downloadFacultyTemplate()
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "Template_Import_Fakultas.csv")
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      success("Template impor fakultas/prodi berhasil diunduh.")
    } catch (err) {
      // Fallback client-side template download
      const headers = "Nama Fakultas / Prodi;Kode\n"
      const dummyData = [
        "Fakultas Tarbiyah;TAR",
        "Fakultas Syariah;SYA",
        "Fakultas Ekonomi dan Bisnis Islam;FEBI",
        "Program Studi Pendidikan Agama Islam;PAI",
        "Program Studi Hukum Ekonomi Syariah;HES"
      ].join("\n") + "\n"

      const bom = "\uFEFF"
      const blob = new Blob([bom + headers + dummyData], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "Template_Import_Fakultas.csv")
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      success("Template impor fakultas/prodi berhasil diunduh.")
    }
  }

  // Export CSV
  const handleExportCSV = async () => {
    try {
      setSubmitting(true)
      const blob = await masterDataService.exportFaculties()
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Data_Fakultas_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      success("Data fakultas/prodi berhasil diekspor.")
    } catch (err) {
      console.error(err)
      error("Gagal mengekspor data fakultas/prodi.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle File Selection for Import & Parse Preview
  const handleFileProcess = (file) => {
    if (!file) return

    const validExtensions = ['.csv', '.xlsx', '.xls', '.txt']
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExt) {
      error("Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx).")
      return
    }

    setSelectedFile(file)

    // If CSV/TXT, parse preview client-side so user can review columns
    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0)
          if (lines.length > 0) {
            const firstLine = lines[0].replace(/^\uFEFF/, '')
            const delimiter = firstLine.includes(';') ? ';' : ','
            const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))
            const sampleRows = lines.slice(1, 6).map(line => {
              return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
            })
            setImportPreview({
              type: 'csv',
              headers,
              sampleRows,
              totalDataRows: Math.max(0, lines.length - 1)
            })
          }
        } catch (err) {
          console.error("Preview error", err)
        }
      }
      reader.readAsText(file)
    } else {
      // Excel file preview summary
      setImportPreview({
        type: 'excel',
        totalDataRows: 'Akan dihitung otomatis oleh sistem'
      })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  // Submit Import
  const handleImportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      error("Silakan pilih file yang akan diimpor.")
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await masterDataService.importFaculties(formData)
      if (res.success) {
        success(res.message || "Data fakultas/prodi berhasil diimpor.")
        fetchFaculties()
        setIsImportModalOpen(false)
        setSelectedFile(null)
        setImportPreview(null)
      } else {
        error(res.message || "Gagal mengimpor data fakultas/prodi.")
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Terjadi kesalahan saat mengimpor data.")
    } finally {
      setImporting(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingFaculty(null)
    setFormData({ name: '', code: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingFaculty(item)
    setFormData({
      name: item.name,
      code: item.code || ''
    })
    setIsModalOpen(true)
  }

  const handleOpenDelete = (item) => {
    setDeletingFaculty(item)
    setIsDeleteModalOpen(true)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingFaculty) {
        const res = await masterDataService.updateFaculty(editingFaculty.id, formData)
        if (res.success) {
          success(res.message || "Fakultas berhasil diperbarui.")
          fetchFaculties()
          setIsModalOpen(false)
        }
      } else {
        const res = await masterDataService.createFaculty(formData)
        if (res.success) {
          success(res.message || "Fakultas berhasil ditambahkan.")
          fetchFaculties()
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

  const handleDelete = async () => {
    if (!deletingFaculty) return
    setSubmitting(true)
    
    try {
      const res = await masterDataService.deleteFaculty(deletingFaculty.id)
      if (res.success) {
        success(res.message || "Fakultas berhasil dihapus.")
        fetchFaculties()
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      error(err.response?.data?.message || "Gagal menghapus fakultas.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Master Fakultas / Prodi</h2>
            <Badge variant="default" className="text-xs bg-slate-100 text-slate-700">
              {faculties.length} Total
            </Badge>
          </div>
          <p className="text-slate-500 mt-1">Kelola data fakultas atau program studi.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Input 
              icon={Search} 
              placeholder="Cari nama atau kode fakultas..." 
              className="w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Template Button */}
            <Button 
              onClick={handleDownloadTemplate} 
              variant="outline" 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50" 
              disabled={submitting}
              title="Unduh format template CSV untuk impor data fakultas/prodi"
            >
              <FileSpreadsheet size={16} /> Template
            </Button>

            {/* Import Button */}
            <Button 
              onClick={() => {
                setSelectedFile(null)
                setImportPreview(null)
                setIsImportModalOpen(true)
              }} 
              variant="outline" 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" 
              disabled={submitting}
              title="Impor data fakultas/prodi secara massal"
            >
              <Upload size={16} /> Import
            </Button>

            {/* Export Button */}
            <Button 
              onClick={handleExportCSV} 
              variant="outline" 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" 
              disabled={submitting}
              title="Ekspor seluruh data fakultas/prodi ke format CSV"
            >
              <Download size={16} /> Export
            </Button>

            {/* Create Button */}
            <Button 
              onClick={handleOpenCreate} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus size={16} /> Tambah Fakultas
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 animate-pulse">Memuat data fakultas...</div>
        ) : filteredFaculties.length > 0 ? (
          filteredFaculties.map((faculty) => (
            <Card key={faculty.id} className="border-none shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                    <GraduationCap size={20} />
                  </div>
                  {faculty.code && (
                    <Badge variant="primary" className="text-xs font-semibold">
                      {faculty.code}
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-slate-800">{faculty.name}</h3>
                <div className="mt-2 space-y-1.5 flex-1">
                  <p className="text-sm text-slate-600 flex items-center justify-between">
                    <span className="text-slate-400">Kode:</span> 
                    <span className="font-medium text-slate-700">{faculty.code || '-'}</span>
                  </p>
                </div>
                
                <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => handleOpenEdit(faculty)} variant="outline" size="sm" className="w-full text-xs h-8">
                    <Edit2 size={14} className="mr-1.5"/> Edit
                  </Button>
                  <Button onClick={() => handleOpenDelete(faculty)} variant="outline" size="sm" className="w-full text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Trash2 size={14} className="mr-1.5"/> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
            <EmptyState 
              title={searchQuery ? "Fakultas / Prodi Tidak Ditemukan" : "Belum Ada Fakultas"} 
              description={searchQuery 
                ? `Tidak ada data yang cocok dengan pencarian "${searchQuery}".` 
                : "Data master fakultas atau program studi masih kosong. Silakan tambah data baru atau gunakan fitur impor massal."
              } 
            />
          </div>
        )}
      </div>

      {/* ===================== IMPORT MODAL ===================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <Card className="w-full max-w-xl shadow-2xl rounded-2xl overflow-hidden border border-slate-200 my-8">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Import Data Fakultas / Prodi</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Unggah berkas CSV atau Excel untuk menambahkan data fakultas secara massal
                    </CardDescription>
                  </div>
                </div>
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Template Download Card (Biar tidak keliru) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50/70 to-emerald-50/60 border border-brand-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-brand-900 font-semibold text-sm">
                    <HelpCircle size={16} className="text-brand-600 shrink-0" />
                    <span>Gunakan Template Resmi</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unduh file template resmi agar susunan kolom sesuai dan tidak terjadi kesalahan impor data.
                  </p>
                </div>
                <Button 
                  type="button"
                  onClick={handleDownloadTemplate} 
                  variant="outline" 
                  size="sm"
                  className="bg-white hover:bg-brand-50 text-brand-700 border-brand-300 font-medium text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <FileSpreadsheet size={15} /> Unduh Template (.csv)
                </Button>
              </div>

              {/* Column Guidelines */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Panduan Kolom File
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">Nama Fakultas / Prodi</span>
                      <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">Wajib</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Nama lengkap fakultas atau prodi. Contoh: <code className="text-slate-700 bg-slate-100 px-1 rounded">Fakultas Tarbiyah</code></p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">Kode</span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">Opsional</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Kode atau singkatan prodi. Contoh: <code className="text-slate-700 bg-slate-100 px-1 rounded">TAR</code> atau <code className="text-slate-700 bg-slate-100 px-1 rounded">PAI</code></p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * Catatan: Jika nama fakultas/prodi sudah ada di database, kodenya akan diperbarui secara otomatis.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                    : selectedFile 
                      ? 'border-emerald-400 bg-emerald-50/30' 
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/60'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls,.txt"
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0])
                    }
                  }} 
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti berkas</p>
                    </div>
                    <Badge variant="success" className="mt-1 flex items-center gap-1 text-xs">
                      <CheckCircle2 size={12} /> File siap diimpor
                    </Badge>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                      <Upload size={22} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-700">
                        Seret & lepas berkas di sini, atau <span className="text-emerald-600 font-semibold underline underline-offset-2">pilih file</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Mendukung format .CSV, .XLSX, dan .XLS (Maks. 5 MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Preview (For CSV so user can double-check) */}
              {importPreview && importPreview.type === 'csv' && importPreview.sampleRows && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-500" />
                      Pratinjau Data ({importPreview.totalDataRows} baris terdeteksi):
                    </span>
                    <span className="text-[11px] text-slate-500">Menampilkan hingga 5 baris pertama</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          {importPreview.headers.map((h, i) => (
                            <th key={i} className="p-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                              {h || `Kolom ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {importPreview.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-slate-100 last:border-r-0 max-w-[160px] truncate">
                                {cell || <span className="text-slate-300 italic">-</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importing}
                >
                  Batal
                </Button>
                <Button 
                  type="button"
                  onClick={handleImportSubmit} 
                  disabled={!selectedFile || importing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px] flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengimpor...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Mulai Impor
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================== FORM MODAL (Create / Edit) ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="w-full max-w-md shadow-xl rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>{editingFaculty ? 'Edit Fakultas / Prodi' : 'Tambah Fakultas / Prodi Baru'}</CardTitle>
              <CardDescription>
                Silakan lengkapi informasi data fakultas atau program studi di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Fakultas / Prodi <span className="text-rose-500">*</span></label>
                  <Input 
                    type="text" 
                    name="name" 
                    placeholder="Contoh: Fakultas Tarbiyah, Pendidikan Agama Islam"
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Kode / Singkatan (Opsional)</label>
                  <Input 
                    type="text" 
                    name="code" 
                    placeholder="Contoh: TAR, PAI, FEBI"
                    value={formData.code} 
                    onChange={handleChange} 
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================== DELETE MODAL ===================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="w-full max-w-sm shadow-xl rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>Konfirmasi Hapus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus fakultas <strong>{deletingFaculty?.name}</strong>? Tindakan ini tidak dapat dibatalkan dan dapat berpengaruh pada data mata kuliah terkait.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>
                  Batal
                </Button>
                <Button type="button" onClick={handleDelete} disabled={submitting} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
                  {submitting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
