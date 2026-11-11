import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Clock, Send, FileText, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../contexts/ToastContext";
import { featureService } from "../../services/features";
import { resolveLeaveDocument } from "../../utils/format";

export default function LecturerLeave() {
  const { success, error } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [formData, setFormData] = useState({
    type: "IZIN",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await featureService.getLeaves();
      if (res.success) setLeaves(res.data || []);
    } catch {
      // ignore initial error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchLeaves();
    });
    return () => { active = false; };
  }, [fetchLeaves]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      error("Tanggal mulai dan selesai harus diisi!");
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      error("Tanggal selesai tidak boleh sebelum tanggal mulai!");
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (documentFile) {
        payload = new FormData();
        payload.append("type", formData.type);
        payload.append("start_date", formData.start_date);
        payload.append("end_date", formData.end_date);
        payload.append("reason", formData.reason);
        payload.append("document", documentFile);
      } else {
        payload = formData;
      }

      const res = await featureService.submitLeave(payload);
      if (res.success) {
        success("Pengajuan izin berhasil dikirim!");
        setFormData({ type: "IZIN", start_date: "", end_date: "", reason: "" });
        setDocumentFile(null);
        fetchLeaves();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengirim pengajuan.");
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
        title="Izin & Cuti"
        description="Ajukan permohonan izin, sakit, atau cuti beserta dokumen pendukung bila ada."
      />

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <Card className="md:col-span-1">
          <CardHeader className="pb-4 border-b border-[#F2F2F7] dark:border-slate-700/60">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={17} className="text-emerald-600" /> Form Pengajuan
            </CardTitle>
            <CardDescription>Lengkapi data permohonan ketidakhadiran Anda.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Jenis Ketidakhadiran</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
                >
                  <option value="IZIN">Izin</option>
                  <option value="SAKIT">Sakit</option>
                  <option value="CUTI">Cuti</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Tanggal Mulai</label>
                <Input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Tanggal Selesai</label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  min={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Alasan / Keterangan</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
                  placeholder="Jelaskan alasan pengajuan..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip size={13} /> Surat / Lampiran (Opsional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-[#86868B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <Button type="submit" isLoading={submitting} className="w-full">
                {!submitting && <Send size={15} />}
                {submitting ? "Mengirim..." : "Ajukan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="pb-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Riwayat Pengajuan Anda</CardTitle>
            <Badge>{leaves.length} Total</Badge>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#86868B] animate-pulse">Memuat riwayat...</div>
            ) : leaves.length > 0 ? (
              <div className="divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
                {leaves.map((item) => {
                  const doc = resolveLeaveDocument(item.document_path, import.meta.env.VITE_API_URL);
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:px-5 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/25 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="purple">{item.type}</Badge>
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-emerald-600" />
                            {item.start_date === item.end_date
                              ? new Date(item.start_date).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : `${new Date(item.start_date).toLocaleDateString("id-ID")} - ${new Date(
                                  item.end_date
                                ).toLocaleDateString("id-ID")}`}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#86868B] dark:text-slate-300 italic">"{item.reason}"</p>
                        {featureService.isUploadedDocument(item) ? (
                          <div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await featureService.openLeaveDocument(item);
                                } catch (err) {
                                  error(err.response?.data?.message || "Gagal membuka dokumen lampiran.");
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              <Paperclip size={11} /> Lihat Lampiran
                            </button>
                          </div>
                        ) : doc && (
                          <div>
                            {doc.type === "url" ? (
                              <a
                                href={doc.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                <Paperclip size={11} /> {doc.label}
                              </a>
                            ) : (
                              <span className="text-[11px] text-[#86868B]">Ref: {doc.text}</span>
                            )}
                          </div>
                        )}
                        {item.admin_notes && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md inline-block">
                            Catatan Admin: {item.admin_notes}
                          </p>
                        )}
                        <p className="text-[11px] text-[#86868B] flex items-center gap-1">
                          <Clock size={11} /> Diajukan:{" "}
                          {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}
                        </p>
                      </div>
                      <div className="shrink-0">{renderStatusBadge(item.status)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Belum Ada Riwayat"
                description="Belum ada riwayat pengajuan izin atau cuti yang Anda buat."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
