import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { adminService } from "../../services/admin";
import { lecturerService } from "../../services/lecturer";
import { useToast } from "../../contexts/ToastContext";

export default function LecturerMaster() {
  const { success, error } = useToast();
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState(null);
  const [deletingLecturer, setDeletingLecturer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nidn: "",
    nip: "",
    phone: "",
  });

  const fileInputRef = useRef(null);

  const fetchLecturers = useCallback(async () => {
    try {
      const res = await lecturerService.getLecturers();
      if (res.success) {
        setLecturers(res.data || []);
      }
    } catch {
      error("Gagal memuat data dosen.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchLecturers();
    });
    return () => { active = false; };
  }, [fetchLecturers]);

  const handleExportCSV = async () => {
    try {
      setSubmitting(true);
      const blob = await adminService.exportLecturers();
      if (blob.type && blob.type.includes("json")) {
        const text = await blob.text();
        const json = JSON.parse(text);
        error(json.message || "Gagal mengekspor data dosen.");
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Data_Dosen_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
      success("Data Dosen berhasil diekspor.");
    } catch {
      error("Gagal mengekspor data dosen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "Nama Lengkap;Email;NIDN;NIP;Telepon;Alamat\n";
    const dummyData = "Budi Santoso;budi@iaimu.ac.id;123456789;198001012005011002;08123456789;Jl. Raya Pamekasan No. 1\n";
    const blob = new Blob([headers + dummyData], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Template_Import_Dosen.csv");
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
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
      const res = await adminService.importLecturers(fd);
      if (res.success) {
        success(res.message);
        await fetchLecturers();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengimpor data dosen.");
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenCreate = () => {
    setEditingLecturer(null);
    setFormData({ name: "", email: "", nidn: "", nip: "", phone: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lec) => {
    setEditingLecturer(lec);
    setFormData({
      name: lec.name || "",
      email: lec.email || "",
      nidn: lec.nidn && lec.nidn !== "-" ? lec.nidn : "",
      nip: lec.nip && lec.nip !== "-" ? lec.nip : "",
      phone: lec.phone || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (lec) => {
    setDeletingLecturer(lec);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedData = {
        ...formData,
        nidn: formData.nidn || "-",
        nip: formData.nip || "-",
      };

      if (editingLecturer) {
        const res = await lecturerService.updateLecturer(editingLecturer.id, formattedData);
        if (res.success) {
          await fetchLecturers();
          setIsModalOpen(false);
          success("Data dosen berhasil diperbarui.");
        }
      } else {
        const res = await lecturerService.createLecturer(formattedData);
        if (res.success) {
          await fetchLecturers();
          setIsModalOpen(false);
          success("Data dosen berhasil ditambahkan.");
        }
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data dosen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLecturer) return;
    setSubmitting(true);
    try {
      const res = await lecturerService.deleteLecturer(deletingLecturer.id);
      if (res.success) {
        await fetchLecturers();
        setIsDeleteModalOpen(false);
        success("Dosen berhasil dihapus.");
      }
    } catch {
      error("Gagal menghapus data dosen.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lecturers.filter(
      (row) =>
        row.name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        (row.nidn && row.nidn.toLowerCase().includes(q))
    );
  }, [lecturers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedData = filteredData.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Dosen"
        description="Kelola data profil akademik dosen, NIDN/NIP, dan impor massal."
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
            <Button onClick={handleOpenCreate}>
              <Plus size={16} /> Tambah Dosen
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <Input
              icon={Search}
              placeholder="Cari nama, email, atau NIDN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <span className="text-xs font-medium text-[#86868B] dark:text-slate-400 shrink-0">
            {filteredData.length} Dosen
          </span>
        </div>

        <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead>Nama Dosen</TableHead>
              <TableHead>Email Akun</TableHead>
              <TableHead>NIDN / NIP</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-[#86868B] animate-pulse">
                  Memuat data dosen...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState title="Tidak Ada Data Dosen" description="Belum ada dosen yang sesuai pencarian." />
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((lec) => (
                <TableRow key={lec.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-center font-semibold text-xs shrink-0">
                        {lec.name?.charAt(0)?.toUpperCase() || "D"}
                      </div>
                      <span className="font-semibold">{lec.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#86868B] dark:text-slate-400">{lec.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium font-mono">
                        {lec.nidn && lec.nidn !== "-" ? lec.nidn : "Belum diatur"}
                      </span>
                      {lec.nip && lec.nip !== "-" && <span className="text-[#86868B] font-mono">{lec.nip}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{lec.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEdit(lec)} title="Edit Dosen">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDelete(lec)}
                        title="Hapus Dosen"
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

        <Pagination
          currentPage={safePage}
          lastPage={totalPages}
          total={filteredData.length}
          from={filteredData.length ? (safePage - 1) * ITEMS_PER_PAGE + 1 : 0}
          to={Math.min(safePage * ITEMS_PER_PAGE, filteredData.length)}
          onPageChange={setCurrentPage}
          itemLabel="dosen"
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLecturer ? "Edit Data Dosen" : "Tambah Dosen Baru"}
        subtitle="Lengkapi identitas akademik dan kontak dosen."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="lecturerForm" isLoading={submitting}>
              {editingLecturer ? "Simpan" : "Tambah"}
            </Button>
          </>
        }
      >
        <form id="lecturerForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Nama Lengkap</label>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Email Akun</label>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">NIDN</label>
              <Input type="text" name="nidn" value={formData.nidn} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">NIP</label>
              <Input type="text" name="nip" value={formData.nip} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">No. Telepon</label>
            <Input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Dosen"
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
        <p className="text-sm text-[#86868B] dark:text-slate-300">
          Apakah Anda yakin ingin menghapus data dosen{" "}
          <strong className="text-[#1D1D1F] dark:text-white">{deletingLecturer?.name}</strong>? Tindakan ini tidak dapat
          dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
