import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table"
import { Button } from "../../components/ui/Button"
import { Download, FileSpreadsheet, Calendar as CalendarIcon, Filter } from "lucide-react"
import { adminService } from "../../services/admin"

export default function ReportMaster() {
  const [reports, setReports] = useState([])
  const [periodStr, setPeriodStr] = useState("")
  const [loading, setLoading] = useState(true)
  
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

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

  useEffect(() => {
    fetchReports()
  }, [selectedMonth, selectedYear])

  const handleExportCSV = () => {
    if (reports.length === 0) {
      alert("Tidak ada data untuk diekspor pada periode ini.")
      return
    }

    // Tentukan headers CSV
    const headers = ["Nama Dosen", "NIDN", "Total Hadir", "Total Terlambat", "Total Alpa", "Persentase Kehadiran"]
    
    // Konversi baris data ke format CSV
    const csvRows = []
    csvRows.push(headers.join(",")) // Baris header

    for (const row of reports) {
      const values = [
        `"${row.name}"`, // Quote untuk menghindari error jika ada koma di nama
        `"${row.nidn}"`,
        row.hadir,
        row.terlambat,
        row.alpha,
        `"${row.persentase}"`
      ]
      csvRows.push(values.join(","))
    }

    // Gabungkan dengan newline
    const csvContent = csvRows.join("\n")
    
    // Buat Blob dan trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Rekap_Presensi_IAIMU_${periodStr.replace(" ", "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (reports.length === 0) {
      alert("Tidak ada data untuk diekspor pada periode ini.")
      return
    }
    
    const printWindow = window.open('', '_blank')
    const html = `
      <html>
        <head>
          <title>Laporan Presensi ${periodStr}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { text-align: center; color: #333; }
            p { text-align: center; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 14px; }
            th { background-color: #f8f9fa; }
            .left { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Laporan Presensi Dosen IAIMU</h2>
          <p>Periode: ${periodStr}</p>
          <table>
            <thead>
              <tr>
                <th>Nama Dosen</th>
                <th>NIDN</th>
                <th>Total Hadir</th>
                <th>Total Terlambat</th>
                <th>Total Alpa</th>
                <th>Persentase</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(r => `
                <tr>
                  <td class="left">${r.name}</td>
                  <td>${r.nidn}</td>
                  <td>${r.hadir}</td>
                  <td>${r.terlambat}</td>
                  <td>${r.alpha}</td>
                  <td>${r.persentase}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  // Generate opsi tahun (misal: dari tahun lalu hingga tahun depan)
  const yearOptions = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Laporan Presensi</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-1">
            <CalendarIcon size={14} /> Rekapitulasi Periode: <span className="font-semibold text-slate-700">{periodStr || 'Memuat...'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2 text-slate-700 hover:bg-slate-100">
            <Download size={18} /> PDF
          </Button>
          <Button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <FileSpreadsheet size={18} /> Export Excel (CSV)
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter size={16} className="text-brand-600" /> Filter Laporan
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
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
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Dosen</TableHead>
                <TableHead>NIDN</TableHead>
                <TableHead className="text-center">Total Hadir</TableHead>
                <TableHead className="text-center">Total Terlambat</TableHead>
                <TableHead className="text-center">Total Alpa</TableHead>
                <TableHead className="text-right">Persentase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 h-32 animate-pulse">
                    Memuat data laporan...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 h-32">
                    Belum ada data presensi untuk periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell className="text-slate-500">{report.nidn}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        {report.hadir}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                        {report.terlambat}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                        {report.alpha}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {report.persentase}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
