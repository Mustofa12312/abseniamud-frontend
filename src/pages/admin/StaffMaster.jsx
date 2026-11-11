import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Select from "react-select";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  BookOpen,
  Download,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { adminService } from "../../services/admin";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = {
  name: "",
  email: "",
  nip: "",
  phone: "",
  department: "",
  address: "",
  is_also_lecturer: false,
  nidn: "",
};

export default function StaffMaster() {
  const { success, error } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const [isFromLecturerModalOpen, setIsFromLecturerModalOpen] = useState(false);
  const [availableLecturers, setAvailableLecturers] = useState([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState("");
  const [fromLecturerDept, setFromLecturerDept] = useState("");

  const fileInputRef = useRef(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await adminService.getStaff();
      if (res.success) setStaff(res.data || []);
    } catch {
      error("Gagal memuat data tendik.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchStaff();
    });
    return () => { active = false; };
  }, [fetchStaff]);

  const handleExportCSV = async () => {
    try {
      setSubmitting(true);
      const blob = await adminService.exportStaff();
      if (blob.type && blob.type.includes("json")) {
        const text = await blob.text();
        const json = JSON.parse(text);
        error(json.message || "Gagal mengekspor data tendik.");
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Data_Tendik_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
      success("Data Tendik berhasil diekspor.");
    } catch {
      error("Gagal mengekspor data tendik.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setSubmitting(true);
      const blob = await adminService.downloadStaffTemplate();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Template_Import_Tendik.csv");
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
      success("Template impor tendik berhasil diunduh.");
    } catch {
      error("Gagal mengunduh template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      error("Harap unggah file berformat CSV atau Excel (.xlsx).");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminService.importStaff(fd);
      if (res.success) {
        success(res.message);
        await fetchStaff();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengimpor data tendik.");
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchAvailableLecturers = async () => {
    try {
      const res = await adminService.getAvailableLecturers();
      if (res.success) setAvailableLecturers(res.data || []);
    } catch {
      error("Gagal memuat daftar dosen.");
    }
  };

  const handleCreateFromLecturer = async (e) => {
    e.preventDefault();
    if (!selectedLecturerId) {
      error("Pilih dosen terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminService.createStaffFromLecturer({
        user_id: selectedLecturerId,
        department: fromLecturerDept,
      });
      if (res.success) {
        success(res.message);
        setIsFromLecturerModalOpen(false);
        setSelectedLecturerId("");
        setFromLecturerDept("");
        await fetchStaff();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menjadikan dosen sebagai tendik.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setFormData({
      name: s.name || "",
      email: s.email || "",
      nip: s.nip || "",
      phone: s.phone || "",
      department: s.department || "",
      address: s.address || "",
      is_also_lecturer: Boolean(s.is_also_lecturer),
      nidn: s.nidn || "",
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.is_also_lecturer && !formData.nidn.trim()) {
      error("NIDN wajib diisi jika tendik ini juga mengajar.");
      return;
    }
    setSubmitting(true);
    try {
      const res = editingStaff
        ? await adminService.updateStaff(editingStaff.id, formData)
        : await adminService.createStaff(formData);
      if (res.success) {
        success(editingStaff ? "Data tendik berhasil diperbarui." : "Tendik berhasil ditambahkan.");
        setIsModalOpen(false);
        await fetchStaff();
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    setSubmitting(true);
    try {
      const res = await adminService.deleteStaff(deletingStaff.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        success("Tendik berhasil dihapus.");
        await fetchStaff();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menghapus.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staff.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.nip && s.nip.toLowerCase().includes(q))
    );
  }, [staff, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Tendik"
        description="Tenaga kependidikan — presensi wajib harian mengikuti jam masuk Tendik."
        actions={
          <>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button onClick={handleDownloadTemplate} variant="outline" size="sm" disabled={submitting}>
              <FileSpreadsheet size={15} /> Template
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" disabled={submitting}>
              <Upload size={15} /> Import
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={submitting}>
              <Download size={15} /> Export
            </Button>
            <Button
              onClick={() => {
                setAvailableLecturers([]);
                setIsFromLecturerModalOpen(true);
                fetchAvailableLecturers();
              }}
              variant="outline"
              size="sm"
              disabled={submitting}
            >
              <UserCheck size={15} /> Ambil dari Dosen
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus size={16} /> Tambah Tendik
            </Button>
          </>
        }
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
        <UserCheck size={17} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          Semua Tendik otomatis mengikuti aturan <strong>kehadiran wajib harian</strong>. Tendik yang juga mengajar
          akan tampil di daftar dosen untuk penjadwalan kelas, sedangkan jam masuk tetap mengikuti aturan Tendik.
        </p>
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <Input
              icon={Search}
              placeholder="Cari nama, NIP, atau unit kerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Badge>{filtered.length} Tendik</Badge>
        </div>

        <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead className="text-center">Juga Mengajar?</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-[#86868B] animate-pulse">
                  Memuat data tendik...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="Tidak Ada Data Tendik"
                    description="Belum ada tenaga kependidikan yang sesuai pencarian."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${
                          s.is_also_lecturer
                            ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400"
                            : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {s.name?.charAt(0)?.toUpperCase() || "T"}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold">{s.name}</span>
                        {s.is_also_lecturer && (
                          <Badge variant="purple">
                            <BookOpen size={10} /> Dosen
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#86868B] dark:text-slate-400">{s.email}</TableCell>
                  <TableCell className="font-mono text-xs">{s.nip || "—"}</TableCell>
                  <TableCell>{s.department || "—"}</TableCell>
                  <TableCell className="text-center">
                    {s.is_also_lecturer ? (
                      <Badge variant="purple">Ya (NIDN: {s.nidn || "—"})</Badge>
                    ) : (
                      <span className="text-xs text-[#86868B]">Tidak</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEdit(s)} title="Edit Tendik">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setDeletingStaff(s);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Hapus Tendik"
                        className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? "Edit Tendik" : "Tambah Tendik Baru"}
        subtitle="Isi data tenaga kependidikan beserta opsi tugas mengajar."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="staffForm" isLoading={submitting}>
              {editingStaff ? "Simpan" : "Tambah"}
            </Button>
          </>
        }
      >
        <form id="staffForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Nama Lengkap</label>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Email</label>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">NIP</label>
              <Input type="text" name="nip" value={formData.nip} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">No. Telepon</label>
              <Input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Unit Kerja / Departemen</label>
            <Input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Contoh: BAK, Perpustakaan, LP2M"
            />
          </div>

          <div className="rounded-xl border border-[#E5E5EA] dark:border-slate-700/60 bg-[#F9F9FB] dark:bg-slate-900/50 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_also_lecturer"
                checked={formData.is_also_lecturer}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <BookOpen size={13} className="text-purple-600" />
                  Tendik ini juga mengajar sebagai dosen
                </p>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">
                  Jika dicentang, akun ini akan muncul di daftar dosen agar bisa ditugaskan ke mata kuliah.
                </p>
              </div>
            </label>

            {formData.is_also_lecturer && (
              <div className="space-y-1.5 pl-7">
                <label className="text-xs font-semibold">
                  NIDN <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nidn"
                  value={formData.nidn}
                  onChange={handleChange}
                  placeholder="Nomor Induk Dosen Nasional"
                  required={formData.is_also_lecturer}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-[#F9F9FB] dark:bg-slate-900/40 p-3 text-xs text-[#86868B] dark:text-slate-400">
            Password default akun baru: <strong className="text-[#1D1D1F] dark:text-slate-200">password</strong>.
            Minta pengguna segera menggantinya setelah login pertama.
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Tendik"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={submitting}>
              Ya, Hapus
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-[#86868B] dark:text-slate-300">
          <p>
            Apakah Anda yakin ingin menghapus{" "}
            <strong className="text-[#1D1D1F] dark:text-white">{deletingStaff?.name}</strong>?
          </p>
          {deletingStaff?.is_also_lecturer && (
            <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
              Tendik ini juga terdaftar sebagai dosen. Data dosen akan ikut dihapus jika belum memiliki mata kuliah.
            </div>
          )}
        </div>
      </Modal>

      {/* Ambil dari Dosen Modal */}
      <Modal
        isOpen={isFromLecturerModalOpen}
        onClose={() => setIsFromLecturerModalOpen(false)}
        title="Ambil dari Dosen"
        subtitle="Pilih dosen yang sudah ada untuk diberi tugas tambahan sebagai Tendik."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFromLecturerModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="fromLecturerForm"
              isLoading={submitting}
              disabled={!selectedLecturerId}
            >
              Jadikan Tendik
            </Button>
          </>
        }
      >
        <form id="fromLecturerForm" onSubmit={handleCreateFromLecturer} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              Pilih Dosen <span className="text-rose-500">*</span>
            </label>
            <Select
              options={availableLecturers.map((lecturer) => ({
                value: lecturer.id,
                label: `${lecturer.name} ${lecturer.lecturer?.nidn ? `(NIDN: ${lecturer.lecturer.nidn})` : ""}`,
              }))}
              onChange={(selectedOption) => setSelectedLecturerId(selectedOption ? selectedOption.value : "")}
              value={
                selectedLecturerId
                  ? {
                      value: selectedLecturerId,
                      label:
                        availableLecturers.find((l) => l.id == selectedLecturerId)?.name +
                        (availableLecturers.find((l) => l.id == selectedLecturerId)?.lecturer?.nidn
                          ? ` (NIDN: ${availableLecturers.find((l) => l.id == selectedLecturerId).lecturer.nidn})`
                          : ""),
                    }
                  : null
              }
              placeholder="-- Cari & Pilih Dosen --"
              isClearable
              className="text-sm text-[#1D1D1F]"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "0.75rem",
                  borderColor: "#E5E5EA",
                  minHeight: "2.625rem",
                  boxShadow: "none",
                }),
              }}
            />
            {availableLecturers.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Sedang memuat atau semua dosen sudah terdaftar sebagai Tendik.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Unit Kerja</label>
            <Input
              placeholder="Contoh: BAK, BAAK..."
              value={fromLecturerDept}
              onChange={(e) => setFromLecturerDept(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
