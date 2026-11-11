import { useState, useEffect, useCallback } from "react";
import { Check, X, Clock, AlertCircle, FileText, Calendar as CalendarIcon, User } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { adminService } from "../../services/admin";
import { useToast } from "../../contexts/ToastContext";

export default function CorrectionMaster() {
  const { success, error } = useToast();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, pending_total: 0 });
  const [processingId, setProcessingId] = useState(null);
  const itemsPerPage = 10;

  const fetchCorrections = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: itemsPerPage };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      const res = await adminService.getCorrections(params);
      if (res.success) {
        const list = res.data || [];
        setCorrections(list);
        setMeta({
          current_page: res.meta?.current_page ?? currentPage,
          last_page: res.meta?.last_page ?? 1,
          per_page: res.meta?.per_page ?? itemsPerPage,
          total: res.meta?.total ?? list.length,
          pending_total:
            res.meta?.pending_total ??
            list.filter((c) => String(c.status).toUpperCase() === "PENDING").length,
        });
      }
    } catch {
      error("Gagal memuat pengajuan koreksi.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchCorrections();
    });
    return () => { active = false; };
  }, [fetchCorrections]);

  const handleAction = async (id, actionType) => {
    setProcessingId(id);
    try {
      const res =
        actionType === "approve"
          ? await adminService.approveCorrection(id)
          : await adminService.rejectCorrection(id);

      if (res.success) {
        success(actionType === "approve" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak.");
        await fetchCorrections();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal memproses pengajuan.");
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Menunggu</Badge>;
      case "APPROVED":
        return <Badge variant="success">Disetujui</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = meta.pending_total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Koreksi Presensi"
        description="Tinjau dan proses pengajuan pembenaran absensi dari dosen maupun tendik."
        badge={
          pendingCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50">
              {pendingCount} Menunggu
            </span>
          )
        }
        actions={
          <div className="flex gap-1.5 flex-wrap">
            {[
              ["ALL", "Semua"],
              ["PENDING", "Menunggu"],
              ["APPROVED", "Disetujui"],
              ["REJECTED", "Ditolak"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === val
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 text-[#86868B] dark:text-slate-300 hover:bg-[#F5F5F7]"
                }`}
              >
                {label}
                {val === "PENDING" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText size={16} className="text-emerald-600" />
            <span>Kotak Masuk Pengajuan</span>
          </div>
          <Badge>{meta.total} Pengajuan</Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#86868B] animate-pulse">
            Memuat data pengajuan koreksi...
          </div>
        ) : corrections.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Semua Bersih!"
            description="Tidak ada pengajuan koreksi presensi pada filter saat ini."
          />
        ) : (
          <>
            <div className="divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
              {corrections.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/25 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                      <User size={15} className="text-emerald-600" /> {item.name}
                    </span>
                    <Badge variant="default">
                      <CalendarIcon size={11} /> {item.date}
                    </Badge>
                    <Badge variant="warning">{item.type}</Badge>
                    {renderStatusBadge(item.status)}
                  </div>

                  <div className="bg-[#F9F9FB] dark:bg-slate-900/60 border border-[#E5E5EA] dark:border-slate-700/60 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-[#86868B] mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-[#1D1D1F] dark:text-slate-300 italic">
                      "{item.reason}"
                    </p>
                  </div>

                  <p className="text-[11px] text-[#86868B] flex items-center gap-1">
                    <Clock size={11} /> Dikirim pada {item.submitted_at}
                  </p>
                </div>

                {item.status === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
                    <Button
                      size="sm"
                      disabled={processingId === item.id}
                      onClick={() => handleAction(item.id, "approve")}
                    >
                      <Check size={14} /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === item.id}
                      onClick={() => handleAction(item.id, "reject")}
                      className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <X size={14} /> Tolak
                    </Button>
                  </div>
                )}
              </div>
            ))}
            </div>
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              from={meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0}
              to={Math.min(meta.current_page * meta.per_page, meta.total)}
              onPageChange={setCurrentPage}
              itemLabel="pengajuan"
            />
          </>
        )}
      </Card>
    </div>
  );
}
