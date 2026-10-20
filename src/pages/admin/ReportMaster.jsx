import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Button } from "../../components/ui/Button"
import { Download, FileSpreadsheet, Calendar as CalendarIcon, Filter, Eye, X, Printer, FileText, CheckCircle2, ShieldCheck } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"
import { EmptyState } from "../../components/ui/EmptyState"

export default function ReportMaster() {
  const { error } = useToast()
  const [reports, setReports] = useState([])
  const [periodStr, setPeriodStr] = useState("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [roleFilter, setRoleFilter] = useState("all")

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await adminService.getReports(selectedMonth, selectedYear)
      if (res.success) {
        setReports(res.data)
        setPeriodStr(res.period)
      }
    } catch (err) {
      console.error("Failed to load reports", err)
    } finally {
      setLoading(false)
    }
  }

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const openDetail = async (lecturerId) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    try {
      const res = await adminService.getAttendanceDetails(lecturerId, selectedMonth, selectedYear)
      if (res.success) {
        setDetailData(res)
      }
    } catch (err) {
      error("Gagal memuat detail presensi")
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [selectedMonth, selectedYear])

  const handleExportCSV = async () => {
    if (reports.length === 0) {
      error("Tidak ada data untuk diekspor pada periode ini.")
      return
    }

    setExporting(true)
    try {
      const blob = await adminService.exportReports(selectedMonth, selectedYear, roleFilter)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
      const categoryLabel = roleFilter === 'all' ? 'Semua' : roleFilter === 'dosen' ? 'Dosen' : 'Tendik'
      const monthLabel = selectedMonth === 'all' ? 'TahunanPenuh' : (monthNames[Number(selectedMonth) - 1] || selectedMonth)
      link.setAttribute("download", `Laporan_Absensi_${categoryLabel}_${monthLabel}_${selectedYear}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error("Gagal mengekspor data laporan.")
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = () => {
    if (reports.length === 0) {
      error("Tidak ada data untuk diekspor pada periode ini.")
      return
    }
    
    // Print window with formal print stylesheet
    window.print()
  }

  const yearOptions = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1]
  const categoryLabel = roleFilter === 'all' ? 'Dosen & Tenaga Kependidikan' : roleFilter === 'dosen' ? 'Dosen Pengajar' : 'Tenaga Kependidikan'

  return (
    <div className="space-y-6">
      {/* ── Screen View: Header & Action Buttons (Hidden when printing) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Laporan & Rekapitulasi Presensi</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5 text-sm">
            <CalendarIcon size={14} className="text-brand-600" /> Periode Aktif: <span className="font-semibold text-slate-700">{periodStr || 'Memuat...'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2 text-slate-700 border-slate-300 hover:bg-slate-100 shadow-sm">
            <Printer size={16} className="text-brand-700" /> Cetak PDF Resmi
          </Button>
          <Button onClick={handleExportCSV} disabled={exporting} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
            <FileSpreadsheet size={16} /> {exporting ? 'Mengekspor...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {/* ── Screen View: Filter Card (Hidden when printing) ── */}
      <Card className="border-slate-200/80 shadow-sm print:hidden">
        <CardHeader className="bg-slate-50/70 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter size={16} className="text-brand-600" /> Filter Parameter Laporan
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm font-medium"
            >
              <option value="all">Semua Kategori (Dosen & Tendik)</option>
              <option value="dosen">Hanya Dosen Pengajar</option>
              <option value="tendik">Hanya Tenaga Kependidikan</option>
            </select>
            
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm font-medium"
            >
              <option value="all">Semua Bulan (Tahunan)</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm font-medium"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>Tahun {year}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Nama Pengajar / Staf</TableHead>
                <TableHead className="font-bold text-slate-700">NIDN / NIP</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Hadir</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Terlambat</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Izin/Cuti</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Alpha</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Persentase</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    Memuat data laporan presensi...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    <EmptyState title="Tidak Ada Data Presensi" description="Belum ada data presensi yang tercatat pada periode bulan dan tahun ini." />
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-800">{report.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{report.nidn || "-"}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        {report.hadir}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                        {report.terlambat}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {report.izin || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                        {report.alpha}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-800">
                      {report.persentase}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(report.id)} className="h-8 text-brand-700 hover:text-brand-800 hover:bg-brand-50">
                        <Eye size={14} className="mr-1" /> Rincian
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Detail Modal (Screen Only) ── */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Rincian Presensi Harian</h3>
                {!detailLoading && detailData && (
                  <p className="text-sm text-slate-500">{detailData.lecturer?.name} • Periode {detailData.period}</p>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={() => setDetailModalOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto">
              {detailLoading ? (
                <div className="h-32 flex items-center justify-center text-slate-500 animate-pulse">Memuat detail...</div>
              ) : !detailData || !detailData.data || detailData.data.length === 0 ? (
                <EmptyState title="Tidak Ada Data" description="Tidak ada rekaman presensi harian pada periode ini." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Lokasi Masuk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.data.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell className="font-mono text-xs">{record.checkIn}</TableCell>
                        <TableCell className="font-mono text-xs">{record.checkOut}</TableCell>
                        <TableCell>{record.location}</TableCell>
                        <TableCell>
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                              ${record.status === 'HADIR' ? 'bg-emerald-100 text-emerald-800' : 
                                record.status === 'TERLAMBAT' ? 'bg-amber-100 text-amber-800' : 
                                'bg-rose-100 text-rose-800'}`}>
                              {record.status}
                           </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Formal Academic Printable Sheet (Active on window.print()) ── */}
      <div className="hidden print:block font-serif text-black p-4 w-full">
        {/* Official IAIMU Kop Surat */}
        <div className="border-b-[3px] border-double border-black pb-3 mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/logo.png" alt="Logo IAIMU" className="w-20 h-20 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">YAYASAN MIFTAHUL ULUM PAMEKASAN</h4>
              <h1 className="text-xl font-black uppercase text-black tracking-wide">INSTITUT AGAMA ISLAM MIFTAHUL ULUM</h1>
              <p className="text-xs text-black font-sans">Jl. Raya Bettet No. 12 Pamekasan, Madura, Jawa Timur 69351 • Telp: (0324) 321855</p>
              <p className="text-[11px] text-black font-mono">Website: https://iaimiftahululum.com • Surel: rektorat@iaimu.ac.id</p>
            </div>
          </div>
        </div>

        {/* Document Header Title */}
        <div className="text-center mb-6">
          <h2 className="text-base font-bold uppercase tracking-wider underline">BERITA ACARA REKAPITULASI PRESENSI & KEHADIRAN</h2>
          <p className="text-xs mt-1 font-sans">
            Periode: <strong>{periodStr}</strong> • Kategori: <strong>{categoryLabel}</strong>
          </p>
        </div>

        {/* Formal Printable Table */}
        <table className="w-full text-xs border-collapse border border-black font-sans mb-8">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="border border-black px-2 py-2 text-center w-8">No</th>
              <th className="border border-black px-3 py-2 text-left">Nama Lengkap</th>
              <th className="border border-black px-3 py-2 text-center">NIDN / NIP</th>
              <th className="border border-black px-2 py-2 text-center w-14">Hadir</th>
              <th className="border border-black px-2 py-2 text-center w-16">Terlambat</th>
              <th className="border border-black px-2 py-2 text-center w-14">Izin/Cuti</th>
              <th className="border border-black px-2 py-2 text-center w-14">Alpha</th>
              <th className="border border-black px-3 py-2 text-right w-20">Persentase</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, idx) => (
              <tr key={r.id} className="border-b border-black">
                <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                <td className="border border-black px-3 py-1.5 font-medium">{r.name}</td>
                <td className="border border-black px-3 py-1.5 text-center font-mono">{r.nidn || "-"}</td>
                <td className="border border-black px-2 py-1.5 text-center font-semibold">{r.hadir}</td>
                <td className="border border-black px-2 py-1.5 text-center">{r.terlambat}</td>
                <td className="border border-black px-2 py-1.5 text-center">{r.izin || 0}</td>
                <td className="border border-black px-2 py-1.5 text-center">{r.alpha}</td>
                <td className="border border-black px-3 py-1.5 text-right font-bold">{r.persentase}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Formal Signature Block */}
        <div className="flex justify-between items-start text-xs font-sans mt-10">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Dekan / Kepala Program Studi</p>
            <div className="h-20"></div>
            <p className="font-bold underline">( .................................................... )</p>
            <p className="text-[10px] text-slate-600">NIP / NIDN.</p>
          </div>

          <div className="text-center w-64">
            <p>Pamekasan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold mt-1">Biro Administrasi Kepegawaian (BAK)</p>
            <div className="h-20 flex flex-col items-center justify-center">
              <span className="text-[9px] border border-dashed border-slate-600 px-2 py-1 rounded font-mono text-slate-700">
                Dokumen Sah Digital IAIMU
              </span>
            </div>
            <p className="font-bold underline">( H. Achmad Fauzi, S.E., M.M. )</p>
            <p className="text-[10px] text-slate-600">Kepala Bagian Kepegawaian</p>
          </div>
        </div>
      </div>
    </div>
  )
}
