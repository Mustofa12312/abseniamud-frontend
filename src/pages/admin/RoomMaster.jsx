import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { CsvImportModal } from "../../components/ui/CsvImportModal";
import {
  DoorOpen,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  Search,
  X,
  AlertTriangle,
  ArrowUpDown,
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
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

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
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchRooms();
    });
    return () => { active = false; };
  }, [fetchRooms]);

  const totalCapacity = useMemo(
    () => rooms.reduce((acc, room) => acc + (Number(room.capacity) || 0), 0),
    [rooms]
  );

  const hasActiveFilter = searchQuery.trim() !== "" || capacityFilter !== "all" || sortBy !== "name_asc";

  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = rooms.filter((room) => {
      const cap = Number(room.capacity) || 0;
      if (capacityFilter === "with_capacity" && cap <= 0) return false;
      if (capacityFilter === "no_capacity" && cap > 0) return false;
      if (!q) return true;
      return (
        (room.name || "").toLowerCase().includes(q) ||
        (room.description || "").toLowerCase().includes(q) ||
        String(room.capacity || "").includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "capacity_desc") {
        return (Number(b.capacity) || 0) - (Number(a.capacity) || 0) || (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "capacity_asc") {
        return (Number(a.capacity) || 0) - (Number(b.capacity) || 0) || (a.name || "").localeCompare(b.name || "");
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [rooms, searchQuery, capacityFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setCapacityFilter("all");
    setSortBy("name_asc");
  };

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
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      error("Nama ruangan wajib diisi.");
      return;
    }

    const payload = {
      name: trimmedName,
      capacity: formData.capacity !== "" ? Number(formData.capacity) : null,
      description: formData.description.trim() || null,
    };

    setSubmitting(true);
    try {
      const res = editingRoom
        ? await masterDataService.updateRoom(editingRoom.id, payload)
        : await masterDataService.createRoom(payload);

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
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="default">{rooms.length} Ruangan</Badge>
            {totalCapacity > 0 && (
              <Badge variant="success">Total {totalCapacity} Orang</Badge>
            )}
          </div>
        }
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

      {/* Filter & Sort Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Cari nama ruangan, kapasitas, atau deskripsi..."
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

            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              aria-label="Filter kapasitas"
              className="h-10 sm:h-11 rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-xs sm:text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
            >
              <option value="all">Semua Kapasitas</option>
              <option value="with_capacity">Sudah Diatur</option>
              <option value="no_capacity">Belum Diatur</option>
            </select>

            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#86868B] absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Urutkan ruangan"
                className="h-10 sm:h-11 w-full sm:w-auto rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 pl-8 pr-3 text-xs sm:text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
              >
                <option value="name_asc">Urutkan: Nama A–Z</option>
                <option value="capacity_desc">Kapasitas Terbesar</option>
                <option value="capacity_asc">Kapasitas Terkecil</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
            <p className="text-xs text-[#86868B] dark:text-slate-400">
              Menampilkan <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{filteredRooms.length}</span> dari{" "}
              <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{rooms.length}</span> ruangan
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid Cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((idx) => (
            <Card key={idx} className="animate-pulse">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-700/70" />
                  <div className="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-200/70 dark:bg-slate-700/70" />
                  <div className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800/80" />
                </div>
                <div className="pt-3 border-t border-[#F2F2F7] dark:border-slate-700/60 flex justify-end gap-2">
                  <div className="h-8 w-20 rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
                  <div className="h-8 w-20 rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Card key={room.id} className="flex flex-col hover:border-[#D2D2D7] dark:hover:border-slate-600 hover:shadow-apple-card transition-all">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-[15px] font-semibold text-[#1D1D1F] dark:text-slate-100 leading-snug truncate"
                        title={room.name}
                      >
                        {room.name}
                      </h3>
                      <p className="text-xs text-[#86868B] dark:text-slate-400 mt-0.5">
                        Ruangan Perkuliahan
                      </p>
                    </div>
                  </div>
                  {room.capacity ? (
                    <Badge variant="success" className="shrink-0">
                      <Users className="w-3 h-3 mr-1" />
                      {room.capacity} Orang
                    </Badge>
                  ) : (
                    <Badge variant="default" className="shrink-0">
                      Belum diatur
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex-1">
                  <div className="rounded-xl bg-[#F9F9FB] dark:bg-slate-900/50 border border-[#F0F0F5] dark:border-slate-700/50 px-3.5 py-2.5 min-h-[54px] flex items-start gap-2.5">
                    <Building2 className="w-3.5 h-3.5 text-[#86868B] dark:text-slate-400 mt-0.5 shrink-0" />
                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        room.description
                          ? "text-[#1D1D1F]/85 dark:text-slate-300"
                          : "text-[#86868B] dark:text-slate-500 italic"
                      }`}
                    >
                      {room.description || "Belum ada deskripsi lokasi atau fasilitas."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#F2F2F7] dark:border-slate-700/60 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2">
                  <Button onClick={() => handleOpenEdit(room)} variant="outline" size="sm" className="sm:px-3.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleOpenDelete(room)}
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
              icon={DoorOpen}
              title={hasActiveFilter ? "Ruangan Tidak Ditemukan" : "Belum Ada Ruangan"}
              description={
                hasActiveFilter
                  ? "Tidak ada data ruangan yang cocok dengan kata kunci atau filter yang dipilih."
                  : "Data master ruangan masih kosong. Tambahkan ruangan baru atau gunakan fitur impor massal."
              }
              action={
                hasActiveFilter ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Pencarian & Filter
                  </Button>
                ) : (
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
        icon={DoorOpen}
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
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Kapasitas Kursi / Orang (Opsional)
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
