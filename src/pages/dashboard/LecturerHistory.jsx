import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { attendanceService } from "../../services/attendance";

export default function LecturerHistory() {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const itemsPerPage = 10;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    let cancelled = false;
    attendanceService
      .getSummary(selectedMonth, selectedYear)
      .then((summaryRes) => {
        if (!cancelled && summaryRes.success) {
          setSummary(summaryRes.data || null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    attendanceService
      .getHistory(selectedMonth, selectedYear, { page: currentPage, per_page: itemsPerPage })
      .then((historyRes) => {
        if (cancelled) return;
        if (historyRes.success) {
          const list = historyRes.data || [];
          setHistory(list);
          setMeta({
            current_page: historyRes.meta?.current_page ?? currentPage,
            last_page: historyRes.meta?.last_page ?? 1,
            per_page: historyRes.meta?.per_page ?? itemsPerPage,
            total: historyRes.meta?.total ?? list.length,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear, currentPage]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "HADIR":
        return "success";
      case "TERLAMBAT":
        return "warning";
      case "IZIN":
      case "SAKIT":
      case "CUTI":
        return "purple";
      case "TIDAK_HADIR":
      case "ALPHA":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat & Rekap Presensi"
        description={summary?.period || `${months[selectedMonth - 1]} ${selectedYear}`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setLoading(true);
                setCurrentPage(1);
                setSelectedMonth(Number(e.target.value));
              }}
              className="h-9 px-3 rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            >
              {months.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                setLoading(true);
                setCurrentPage(1);
                setSelectedYear(Number(e.target.value));
              }}
              className="h-9 px-3 rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Summary Cards */}
      {!loading && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Hadir</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary.hadir}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Terlambat</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary.terlambat}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Izin / Sakit</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{summary.izin_sakit ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Tidak Hadir</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{summary.tidak_hadir}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Total Tercatat</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{summary.total}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily List */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400">
          Riwayat Harian
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-28" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="Tidak Ada Riwayat"
              description="Belum ada riwayat presensi dalam periode yang dipilih."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {history.map((record) => {
              const barColor =
                record.status === "HADIR"
                  ? "bg-emerald-500"
                  : record.status === "TERLAMBAT"
                  ? "bg-amber-500"
                  : ["IZIN", "SAKIT", "CUTI"].includes(record.status)
                  ? "bg-purple-500"
                  : "bg-rose-500";
              return (
                <Card key={record.id} className="overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                  <CardContent className="p-4 pt-4 pl-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-sm">{record.date}</span>
                      <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-[#F5F5F7] dark:bg-slate-900/60 rounded-xl p-2.5">
                        <p className="text-[11px] text-[#86868B] dark:text-slate-400 flex items-center gap-1 mb-0.5">
                          <MapPin size={11} /> Masuk
                        </p>
                        <p className="font-mono font-semibold text-xs flex items-center gap-1">
                          <Clock size={12} className="text-emerald-600" /> {record.checkIn || "-"}
                        </p>
                      </div>
                      <div className="bg-[#F5F5F7] dark:bg-slate-900/60 rounded-xl p-2.5">
                        <p className="text-[11px] text-[#86868B] dark:text-slate-400 flex items-center gap-1 mb-0.5">
                          <MapPin size={11} /> Pulang
                        </p>
                        <p className="font-mono font-semibold text-xs flex items-center gap-1">
                          <Clock size={12} className="text-amber-600" /> {record.checkOut || "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && meta.last_page > 1 && (
          <Card className="overflow-hidden">
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              from={meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0}
              to={Math.min(meta.current_page * meta.per_page, meta.total)}
              onPageChange={setCurrentPage}
              itemLabel="riwayat"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
