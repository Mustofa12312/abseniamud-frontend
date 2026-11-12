import { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet, Calendar as CalendarIcon, Filter, Eye, Printer } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { adminService } from "../../services/admin";
import { useToast } from "../../contexts/ToastContext";

export default function ReportMaster() {
  const { success, error } = useToast();
  const [reports, setReports] = useState([]);
  const [periodStr, setPeriodStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [roleFilter, setRoleFilter] = useState("all");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports(selectedMonth, selectedYear, roleFilter);
      if (res.success) {
        setReports(res.data || []);
        setPeriodStr(res.period || "");
      }
    } catch {
      error("Gagal memuat laporan presensi.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, roleFilter, error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchReports();
    });
    return () => { active = false; };
  }, [fetchReports]);

  const openDetail = async (id) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await adminService.getAttendanceDetails(id, selectedMonth, selectedYear);
      if (res.success) {
        setDetailData(res);
      }
    } catch {
      error("Gagal memuat detail presensi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (reports.length === 0) {
      error("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }

    setExporting(true);
    try {
      const blob = await adminService.exportReports(selectedMonth, selectedYear, roleFilter);
      if (blob.type && blob.type.includes("json")) {
        const text = await blob.text();
        const json = JSON.parse(text);
        error(json.message || "Gagal mengekspor data laporan.");
        return;
      }

      const excelBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement("a");
      link.href = url;
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      const categoryLabel = roleFilter === "all" ? "Semua" : roleFilter === "dosen" ? "Dosen" : "Tendik";
      const monthLabel =
        selectedMonth === "all" ? "TahunanPenuh" : monthNames[Number(selectedMonth) - 1] || selectedMonth;
      link.setAttribute("download", `Laporan_Absensi_${categoryLabel}_${monthLabel}_${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);

      success("File laporan Excel berhasil diunduh!");
    } catch (err) {
      let msg = "Gagal mengekspor data laporan.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) msg = json.message;
        } catch {
          // keep fallback msg
        }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      error(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (reports.length === 0) {
      error("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }
    window.print();
  };

  const yearOptions = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];
  const categoryLabel =
    roleFilter === "all"
      ? "Dosen & Tenaga Kependidikan"
      : roleFilter === "dosen"
      ? "Dosen Pengajar"
      : "Tenaga Kependidikan";

  return (
    <div className="space-y-6">
      <PageHeader
        className="print:hidden"
        title="Laporan & Rekapitulasi Presensi"
        description={
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-emerald-600" />
            Periode Aktif: <strong className="text-[#1D1D1F] dark:text-slate-200">{periodStr || "Memuat..."}</strong>
          </span>
        }
        actions={
          <>
            <Button onClick={handleExportPDF} variant="outline">
              <Printer size={15} /> Cetak PDF Resmi
            </Button>
            <Button onClick={handleExportCSV} isLoading={exporting}>
              {!exporting && <FileSpreadsheet size={15} />}
              {exporting ? "Mengekspor..." : "Export Excel"}
            </Button>
          </>
        }
      />

      {/* Screen Report Card */}
      <Card className="overflow-hidden print:hidden">
        <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter size={15} className="text-emerald-600" /> Filter Parameter Laporan
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 font-medium"
            >
              <option value="all">Semua Kategori (Dosen & Tendik)</option>
              <option value="dosen">Hanya Dosen Pengajar</option>
              <option value="tendik">Hanya Tenaga Kependidikan</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-3 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 font-medium"
            >
              <option value="all">Semua Bulan (Tahunan)</option>
              {[
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember",
              ].map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-9 px-3 border border-[#E5E5EA] dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 font-medium"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  Tahun {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pengajar / Staf</TableHead>
              <TableHead>NIDN / NIP</TableHead>
              <TableHead className="text-center">Hadir</TableHead>
              <TableHead className="text-center">Terlambat</TableHead>
              <TableHead className="text-center">Izin/Cuti</TableHead>
              <TableHead className="text-center">Alpha</TableHead>
              <TableHead className="text-right">Persentase</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#86868B] animate-pulse">
                  Memuat data laporan presensi...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    title="Tidak Ada Data Presensi"
                    description="Belum ada data presensi yang tercatat pada periode bulan dan tahun ini."
                  />
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-semibold">{report.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant={report.is_daily_mandatory ? "purple" : "default"}>
                        {report.is_daily_mandatory ? "Wajib Harian" : "Sesuai Jadwal"}
                      </Badge>
                      {report.working_days != null && (
                        <span className="text-[11px] text-[#86868B] dark:text-slate-400">
                          Target {report.working_days} hari
                        </span>
                      )}
                      {report.penugasan && report.penugasan !== "-" && (
                        <span className="text-[11px] text-[#86868B] dark:text-slate-400">
                          • {report.penugasan}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#86868B]">{report.nidn || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success">{report.hadir}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="warning">{report.terlambat}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="info">{report.izin || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="danger">{report.alpha}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">{report.persentase}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(report.id)}>
                      <Eye size={14} /> Rincian
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Attendance Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Rincian Presensi Harian"
        subtitle={
          !detailLoading && detailData
            ? `${detailData.lecturer?.name} • Periode ${detailData.period}`
            : undefined
        }
        size="xl"
        className="print:hidden"
      >
        {detailLoading ? (
          <div className="h-32 flex items-center justify-center text-[#86868B] animate-pulse">Memuat detail...</div>
        ) : !detailData?.data?.length ? (
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
                    <Badge
                      variant={
                        record.status === "HADIR"
                          ? "success"
                          : record.status === "TERLAMBAT"
                          ? "warning"
                          : ["IZIN", "SAKIT", "CUTI"].includes(record.status)
                          ? "info"
                          : "danger"
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Modal>

      {/* Formal Academic Printable Sheet (Active on window.print()) */}
      <div className="hidden print:block font-serif text-black p-4 w-full">
        <div className="border-b-[3px] border-double border-black pb-3 mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img
              src="/logo.png"
              alt="Logo IAIMU"
              className="w-20 h-20 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                YAYASAN MIFTAHUL ULUM PAMEKASAN
              </h4>
              <h1 className="text-xl font-black uppercase text-black tracking-wide">
                INSTITUT AGAMA ISLAM MIFTAHUL ULUM
              </h1>
              <p className="text-xs text-black font-sans">
                Jl. Raya Bettet No. 12 Pamekasan, Madura, Jawa Timur 69351 • Telp: (0324) 321855
              </p>
              <p className="text-[11px] text-black font-mono">
                Website: https://iaimiftahululum.com • Surel: rektorat@iaimu.ac.id
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base font-bold uppercase tracking-wider underline">
            BERITA ACARA REKAPITULASI PRESENSI & KEHADIRAN
          </h2>
          <p className="text-xs mt-1 font-sans">
            Periode: <strong>{periodStr}</strong> • Kategori: <strong>{categoryLabel}</strong>
          </p>
        </div>

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

        <div className="flex justify-between items-start text-xs font-sans mt-10">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Dekan / Kepala Program Studi</p>
            <div className="h-20" />
            <p className="font-bold underline">( .................................................... )</p>
            <p className="text-[10px] text-slate-600">NIP / NIDN.</p>
          </div>

          <div className="text-center w-64">
            <p>
              Pamekasan, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
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
  );
}
