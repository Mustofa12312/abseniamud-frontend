import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { CsvImportModal } from "../../components/ui/CsvImportModal";
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";
import { masterDataService } from "../../services/masterData";
import { useToast } from "../../contexts/ToastContext";
import { assertNotJsonBlob, triggerBlobDownload } from "../../utils/format";

const FACULTY_IMPORT_COLUMNS = [
  { label: "Nama Fakultas / Prodi", required: true, example: "Fakultas Tarbiyah" },
  { label: "Kode", required: false, example: "TAR" },
];

export default function FacultyMaster() {
  const { success, error } = useToast();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deletingFaculty, setDeletingFaculty] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });

  const fetchFaculties = useCallback(async () => {
    try {
      const res = await masterDataService.getFaculties();
      if (res.success) {
        setFaculties(res.data || []);
      }
    } catch {
      error("Gagal memuat data fakultas/prodi.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchFaculties();
    });
    return () => { active = false; };
  }, [fetchFaculties]);

  const filteredFaculties = faculties.filter((fac) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (fac.name || "").toLowerCase().includes(q) ||
      (fac.code || "").toLowerCase().includes(q)
    );
  });

  const handleDownloadTemplate = async () => {
    try {
      const blob = await masterDataService.downloadFacultyTemplate();
      await assertNotJsonBlob(blob, "Gagal mengunduh template fakultas.");
      triggerBlobDownload(blob, "Template_Import_Fakultas.csv");
      success("Template impor fakultas/prodi berhasil diunduh.");
    } catch {
      const headers = "Nama Fakultas / Prodi;Kode\n";
      const dummyData =
        [
          "Fakultas Tarbiyah;TAR",
          "Fakultas Syariah;SYA",
          "Fakultas Ekonomi dan Bisnis Islam;FEBI",
          "Program Studi Pendidikan Agama Islam;PAI",
          "Program Studi Hukum Ekonomi Syariah;HES",
        ].join("\n") + "\n";
      triggerBlobDownload(headers + dummyData, "Template_Import_Fakultas.csv", "text/csv;charset=utf-8;", true);
      success("Template impor fakultas/prodi berhasil diunduh.");
    }
  };

  const handleExportCSV = async () => {
    try {
      setSubmitting(true);
      const blob = await masterDataService.exportFaculties();
      await assertNotJsonBlob(blob, "Gagal mengekspor data fakultas/prodi.");
      triggerBlobDownload(blob, `Data_Fakultas_${new Date().toISOString().slice(0, 10)}.csv`);
      success("Data fakultas/prodi berhasil diekspor.");
    } catch (err) {
      error(err.message || "Gagal mengekspor data fakultas/prodi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportFile = async (file) => {
    try {
      const payload = new FormData();
      payload.append("file", file);
      const res = await masterDataService.importFaculties(payload);
      if (res.success) {
        success(res.message || "Data fakultas/prodi berhasil diimpor.");
        fetchFaculties();
        return true;
      }
      error(res.message || "Gagal mengimpor data fakultas/prodi.");
      return false;
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan saat mengimpor data.");
      return false;
    }
  };

  const handleOpenCreate = () => {
    setEditingFaculty(null);
    setFormData({ name: "", code: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingFaculty(item);
    setFormData({
      name: item.name || "",
      code: item.code || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setDeletingFaculty(item);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = editingFaculty
        ? await masterDataService.updateFaculty(editingFaculty.id, formData)
        : await masterDataService.createFaculty(formData);

      if (res.success) {
        success(
          res.message ||
            (editingFaculty ? "Fakultas berhasil diperbarui." : "Fakultas berhasil ditambahkan.")
        );
        fetchFaculties();
        setIsModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFaculty) return;
    setSubmitting(true);
    try {
      const res = await masterDataService.deleteFaculty(deletingFaculty.id);
      if (res.success) {
        success(res.message || "Fakultas berhasil dihapus.");
        fetchFaculties();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menghapus fakultas.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Fakultas / Prodi"
        description="Kelola data fakultas dan program studi di lingkungan IAIMU."
        badge={<Badge variant="default">{faculties.length} Total</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={submitting}>
              <FileSpreadsheet className="w-4 h-4" />
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} disabled={submitting}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={submitting}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              Tambah Fakultas
            </Button>
          </>
        }
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Input
              icon={Search}
              placeholder="Cari nama fakultas, prodi, atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={searchQuery ? "pr-9" : ""}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-slate-200 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-[#86868B] dark:text-slate-400">
            Menampilkan{" "}
            <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">
              {filteredFaculties.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{faculties.length}</span>{" "}
            fakultas / prodi
          </p>
        </CardContent>
      </Card>

      {/* Grid Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card className="col-span-full p-12 text-center text-sm text-[#86868B] animate-pulse">
            Memuat data fakultas...
          </Card>
        ) : filteredFaculties.length > 0 ? (
          filteredFaculties.map((faculty) => (
            <Card
              key={faculty.id}
              className="flex flex-col hover:border-[#D2D2D7] dark:hover:border-slate-600 hover:shadow-apple-card transition-all"
            >
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 flex-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-[#1D1D1F] dark:text-slate-100 leading-snug">
                        {faculty.name}
                      </h3>
                      <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">
                        Fakultas / Program Studi
                      </p>
                    </div>
                  </div>
                  {faculty.code ? (
                    <Badge variant="primary" className="font-mono shrink-0">
                      {faculty.code}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="shrink-0">
                      Tanpa Kode
                    </Badge>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#F2F2F7] dark:border-slate-700/60 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2">
                  <Button onClick={() => handleOpenEdit(faculty)} variant="outline" size="sm" className="sm:px-3.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleOpenDelete(faculty)}
                    variant="outline"
                    size="sm"
                    className="sm:px-3.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <EmptyState
              icon={GraduationCap}
              title={searchQuery ? "Fakultas / Prodi Tidak Ditemukan" : "Belum Ada Fakultas"}
              description={
                searchQuery
                  ? `Tidak ada data yang cocok dengan pencarian "${searchQuery}".`
                  : "Data master fakultas atau program studi masih kosong. Tambahkan data baru atau gunakan fitur impor massal."
              }
              action={
                searchQuery ? (
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                    Reset Pencarian
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4" /> Tambah Fakultas
                  </Button>
                )
              }
            />
          </Card>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? "Edit Fakultas / Prodi" : "Tambah Fakultas / Prodi"}
        subtitle="Isi informasi fakultas atau program studi."
        icon={GraduationCap}
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" form="facultyForm" isLoading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="facultyForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Nama Fakultas / Program Studi <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              placeholder="Contoh: Fakultas Tarbiyah"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Kode / Singkatan (Opsional)
            </label>
            <Input
              type="text"
              name="code"
              placeholder="Contoh: TAR / PAI / FEBI"
              value={formData.code}
              onChange={handleChange}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Fakultas / Prodi"
        icon={AlertTriangle}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} isLoading={submitting}>
              Ya, Hapus Data
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-400">
          Apakah Anda yakin ingin menghapus fakultas/prodi{" "}
          <span className="font-semibold text-[#1D1D1F] dark:text-slate-100">{deletingFaculty?.name}</span>?
          Mata kuliah yang terhubung dengan fakultas ini dapat ikut terpengaruh.
        </p>
      </Modal>

      {/* Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Fakultas / Prodi"
        subtitle="Unggah berkas CSV atau Excel untuk menambahkan fakultas atau program studi secara massal."
        templateDescription="Unduh template CSV fakultas agar pemisah kolom (;) dan struktur header sesuai."
        columns={FACULTY_IMPORT_COLUMNS}
        updateNote="* Catatan: Jika nama fakultas sudah terdaftar, kode singkatan akan diperbarui otomatis."
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImportFile}
        onInvalidFile={error}
      />
    </div>
  );
}
