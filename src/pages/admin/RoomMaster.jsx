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
  MapPin,
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

const ROOM_IMPORT_COLUMNS = [
  { label: "Nama Ruangan", required: true, example: "Ruang Teori 101" },
  { label: "Kapasitas", required: false, example: "40" },
  { label: "Deskripsi", required: false, example: "Gedung A Lantai 1" },
];

export default function RoomMaster() {
  const { success, error } = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    description: "",
  });

  const fetchRooms = useCallback(async () => {
    try {
      const res = await masterDataService.getRooms();
      if (res.success) {
        setRooms(res.data || []);
      }
    } catch {
      error("Gagal memuat data ruangan.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filteredRooms = rooms.filter((room) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (room.name || "").toLowerCase().includes(q) ||
      (room.description || "").toLowerCase().includes(q) ||
      String(room.capacity || "").includes(q)
    );
  });

  const handleDownloadTemplate = async () => {
    try {
      const blob = await masterDataService.downloadRoomTemplate();
      await assertNotJsonBlob(blob, "Gagal mengunduh template ruangan.");
      triggerBlobDownload(blob, "Template_Import_Ruangan.csv");
      success("Template impor ruangan berhasil diunduh.");
    } catch {
      const headers = "Nama Ruangan;Kapasitas;Deskripsi\n";
      const dummyData =
        [
          "Ruang Teori 101;40;Gedung A Lantai 1",
          "Lab Komputer 1;30;Dilengkapi 30 unit PC dan AC",
          "Aula Utama;200;Gedung Rektorat Lantai 2",
          "Ruang Rapat 1;25;Ruang rapat senat dan pimpinan",
        ].join("\n") + "\n";
      triggerBlobDownload(headers + dummyData, "Template_Import_Ruangan.csv", "text/csv;charset=utf-8;", true);
      success("Template impor ruangan berhasil diunduh.");
    }
  };

  const handleExportCSV = async () => {
    try {
      setSubmitting(true);
      const blob = await masterDataService.exportRooms();
      await assertNotJsonBlob(blob, "Gagal mengekspor data ruangan.");
      triggerBlobDownload(blob, `Data_Ruangan_${new Date().toISOString().slice(0, 10)}.csv`);
      success("Data ruangan berhasil diekspor.");
    } catch (err) {
      error(err.message || "Gagal mengekspor data ruangan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportFile = async (file) => {
    try {
      const payload = new FormData();
      payload.append("file", file);
      const res = await masterDataService.importRooms(payload);
      if (res.success) {
        success(res.message || "Data ruangan berhasil diimpor.");
        fetchRooms();
        return true;
      }
      error(res.message || "Gagal mengimpor data ruangan.");
      return false;
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan saat mengimpor data.");
      return false;
    }
  };

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({ name: "", capacity: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRoom(item);
    setFormData({
      name: item.name || "",
      capacity: item.capacity || "",
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setDeletingRoom(item);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = editingRoom
        ? await masterDataService.updateRoom(editingRoom.id, formData)
        : await masterDataService.createRoom(formData);

      if (res.success) {
        success(
          res.message ||
            (editingRoom ? "Ruangan berhasil diperbarui." : "Ruangan berhasil ditambahkan.")
        );
        fetchRooms();
        setIsModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;
    setSubmitting(true);
    try {
      const res = await masterDataService.deleteRoom(deletingRoom.id);
      if (res.success) {
        success(res.message || "Ruangan berhasil dihapus.");
        fetchRooms();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menghapus ruangan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Ruangan"
        description="Kelola daftar ruangan kelas dan fasilitas untuk jadwal perkuliahan."
        badge={<Badge variant="default">{rooms.length} Total</Badge>}
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
              Tambah Ruangan
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
              placeholder="Cari nama ruangan, kapasitas, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-slate-200 p-1"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-[#86868B] dark:text-slate-400">
            Menampilkan <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{filteredRooms.length}</span> dari{" "}
            <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{rooms.length}</span> ruangan
          </p>
        </CardContent>
      </Card>

      {/* Grid Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card className="col-span-full p-12 text-center text-sm text-[#86868B] animate-pulse">
            Memuat data ruangan...
          </Card>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Card key={room.id} className="flex flex-col hover:border-[#D2D2D7] dark:hover:border-slate-600 transition-all">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  {room.capacity ? (
                    <Badge variant="success">{room.capacity} Orang</Badge>
                  ) : (
                    <Badge variant="default">Kapasitas belum diatur</Badge>
                  )}
                </div>

                <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-slate-100">{room.name}</h3>

                <div className="mt-3 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#86868B] dark:text-slate-400">Kapasitas</span>
                    <span className="font-medium text-[#1D1D1F] dark:text-slate-200">
                      {room.capacity ? `${room.capacity} Mahasiswa` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#86868B] dark:text-slate-400 block mb-0.5">Deskripsi</span>
                    <p className="text-xs text-[#1D1D1F]/80 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {room.description || "Tidak ada deskripsi tambahan."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F2F2F7] dark:border-slate-700/60 flex items-center gap-2">
                  <Button onClick={() => handleOpenEdit(room)} variant="outline" size="sm" className="flex-1">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleOpenDelete(room)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
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
              title={searchQuery ? "Ruangan Tidak Ditemukan" : "Belum Ada Ruangan"}
              description={
                searchQuery
                  ? `Tidak ada data ruangan yang cocok dengan pencarian "${searchQuery}".`
                  : "Data master ruangan masih kosong. Tambahkan ruangan baru atau gunakan fitur impor massal."
              }
              action={
                !searchQuery && (
                  <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4" /> Tambah Ruangan
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
        title={editingRoom ? "Edit Ruangan" : "Tambah Ruangan Baru"}
        subtitle="Isi detail ruangan untuk jadwal perkuliahan."
        icon={MapPin}
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" form="roomForm" isLoading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="roomForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Nama Ruangan <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              placeholder="Contoh: Ruang Teori 101 / Lab Komputer"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Kapasitas (Opsional)
            </label>
            <Input
              type="number"
              name="capacity"
              min="1"
              placeholder="Contoh: 40"
              value={formData.capacity}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Deskripsi / Lokasi Gedung (Opsional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Contoh: Gedung A Lantai 2, tersedia proyektor & AC"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-slate-100 placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Ruangan"
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
              Ya, Hapus Ruangan
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-400">
          Apakah Anda yakin ingin menghapus ruangan{" "}
          <span className="font-semibold text-[#1D1D1F] dark:text-slate-100">{deletingRoom?.name}</span>?
          Jadwal yang merujuk ke ruangan ini dapat terpengaruh.
        </p>
      </Modal>

      {/* Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Ruangan"
        subtitle="Unggah berkas CSV atau Excel untuk menambahkan data ruangan secara massal."
        templateDescription="Unduh template CSV ruangan agar pemisah kolom (;) dan header sesuai."
        columns={ROOM_IMPORT_COLUMNS}
        updateNote="* Catatan: Jika nama ruangan sudah terdaftar, kapasitas dan deskripsi akan diperbarui otomatis."
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImportFile}
        onInvalidFile={error}
      />
    </div>
  );
}
