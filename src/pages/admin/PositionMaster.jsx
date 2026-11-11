import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, CalendarCheck } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { scheduleService } from "../../services/schedule";
import { useToast } from "../../contexts/ToastContext";

export default function PositionMaster() {
  const { success, error } = useToast();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deletingPosition, setDeletingPosition] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    requires_daily_attendance: false,
    work_start_time: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getPositions();
      if (res.success) setPositions(res.data || []);
    } catch {
      error("Gagal memuat data jabatan.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingPosition(null);
    setFormData({ name: "", requires_daily_attendance: false, work_start_time: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingPosition(item);
    setFormData({
      name: item.name,
      requires_daily_attendance: Boolean(item.requires_daily_attendance),
      work_start_time: item.work_start_time || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setDeletingPosition(item);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = editingPosition
        ? await scheduleService.updatePosition(editingPosition.id, formData)
        : await scheduleService.createPosition(formData);

      if (res.success) {
        await fetchData();
        setIsModalOpen(false);
        success(editingPosition ? "Jabatan berhasil diperbarui." : "Jabatan berhasil ditambahkan.");
      }
    } catch (err) {
      error(err?.response?.data?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPosition) return;
    setSubmitting(true);
    try {
      const res = await scheduleService.deletePosition(deletingPosition.id);
      if (res.success) {
        await fetchData();
        setIsDeleteModalOpen(false);
        success("Jabatan berhasil dihapus.");
      }
    } catch {
      error("Gagal menghapus jabatan.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(
    () => positions.filter((item) => item.name?.toLowerCase().includes(searchQuery.toLowerCase())),
    [positions, searchQuery]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Jabatan"
        description="Kelola jabatan struktural atau fungsional beserta kewajiban presensi harian."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus size={16} /> Tambah Jabatan
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <Input
              type="text"
              icon={Search}
              placeholder="Cari nama jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Badge>{filteredData.length} Jabatan</Badge>
        </div>

        <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">No</TableHead>
              <TableHead>Nama Jabatan</TableHead>
              <TableHead className="text-center">Wajib Hadir Harian</TableHead>
              <TableHead className="text-center">Jam Masuk Khusus</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-[#86868B] animate-pulse">
                  Memuat data jabatan...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState title="Belum Ada Data" description="Tidak ada data jabatan ditemukan." />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-[#86868B]">{index + 1}</TableCell>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell className="text-center">
                    {item.requires_daily_attendance ? (
                      <Badge variant="success">
                        <CalendarCheck size={11} /> Ya
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#86868B]">Tidak</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {item.requires_daily_attendance && item.work_start_time ? item.work_start_time : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEdit(item)} title="Edit Jabatan">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDelete(item)}
                        title="Hapus Jabatan"
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
        title={editingPosition ? "Edit Jabatan" : "Tambah Jabatan"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="positionForm" isLoading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="positionForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Nama Jabatan</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Kaprodi Sistem Informasi"
              required
            />
          </div>

          <div className="rounded-xl border border-[#E5E5EA] dark:border-slate-700/60 bg-[#F9F9FB] dark:bg-slate-900/50 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requires_daily_attendance"
                checked={formData.requires_daily_attendance}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-semibold">Wajib hadir setiap hari kerja</p>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">
                  Pemegang jabatan ini wajib melakukan presensi harian terlepas dari jadwal mengajar.
                </p>
              </div>
            </label>

            {formData.requires_daily_attendance && (
              <div className="space-y-1.5 pl-7">
                <label className="text-xs font-semibold">Jam Masuk Khusus (Opsional)</label>
                <Input
                  type="time"
                  name="work_start_time"
                  value={formData.work_start_time}
                  onChange={handleChange}
                />
                <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                  Kosongkan untuk mengikuti jam masuk default dari Pengaturan.
                </p>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Jabatan?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={submitting}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-300">
          Apakah Anda yakin ingin menghapus jabatan <strong className="text-[#1D1D1F] dark:text-white">{deletingPosition?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
