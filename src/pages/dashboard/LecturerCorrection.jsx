import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Clock, Send, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { attendanceService } from "../../services/attendance";
import { useToast } from "../../contexts/ToastContext";

export default function LecturerCorrection() {
  const { success, error } = useToast();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    type: "Lupa Check-in",
    reason: "",
  });

  const fetchCorrections = useCallback(async () => {
    try {
      const res = await attendanceService.getCorrections();
      if (res.success) {
        setCorrections(res.data || []);
      }
    } catch {
      // ignore initial error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchCorrections();
    });
    return () => { active = false; };
  }, [fetchCorrections]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await attendanceService.submitCorrection(formData);
      if (res.success) {
        success(res.message || "Pengajuan koreksi berhasil dikirim.");
        setFormData({ date: "", type: "Lupa Check-in", reason: "" });
        fetchCorrections();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengirim pengajuan koreksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (String(status).toUpperCase()) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Koreksi Presensi"
        description="Ajukan pembenaran absensi apabila terkendala lupa check-in/out atau masalah perangkat."
      />

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <Card className="md:col-span-1">
          <CardHeader className="pb-4 border-b border-[#F2F2F7] dark:border-slate-700/60">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={17} className="text-emerald-600" /> Form Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Tanggal</label>
                <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Jenis Kendala</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
                >
                  <option value="Lupa Check-in">Lupa Check-in</option>
                  <option value="Lupa Check-out">Lupa Check-out</option>
                  <option value="Masalah GPS/Lokasi">Masalah GPS/Lokasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Alasan / Keterangan</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
                  placeholder="Jelaskan alasan pengajuan secara singkat..."
                  required
                />
              </div>

              <Button type="submit" isLoading={submitting} className="w-full">
                {!submitting && <Send size={15} />}
                {submitting ? "Mengirim..." : "Ajukan Koreksi"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="pb-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Riwayat Pengajuan Anda</CardTitle>
            <Badge>{corrections.length} Total</Badge>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#86868B] animate-pulse">Memuat riwayat...</div>
            ) : corrections.length > 0 ? (
              <div className="divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
                {corrections.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-5 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/25 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CalendarIcon size={14} className="text-emerald-600" />
                        <span className="font-semibold text-sm">{item.date}</span>
                        <span className="text-[#D2D2D7]">•</span>
                        <span className="text-xs font-medium text-[#86868B] dark:text-slate-400">{item.type}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#86868B] dark:text-slate-300 pl-3 border-l-2 border-[#E5E5EA] dark:border-slate-700 italic">
                        "{item.reason}"
                      </p>
                      <p className="text-[11px] text-[#86868B] flex items-center gap-1">
                        <Clock size={11} /> Diajukan: {item.created_at}
                      </p>
                    </div>
                    <div className="shrink-0">{renderStatusBadge(item.status)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Belum Ada Riwayat"
                description="Belum ada riwayat pengajuan koreksi yang Anda buat."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
