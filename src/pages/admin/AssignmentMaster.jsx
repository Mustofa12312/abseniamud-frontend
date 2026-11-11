import { useState, useEffect, useCallback, useMemo } from "react";
import Select from "react-select";
import { Plus, Edit2, Trash2, Search, Briefcase } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { scheduleService } from "../../services/schedule";
import { lecturerService } from "../../services/lecturer";
import { useToast } from "../../contexts/ToastContext";

export default function AssignmentMaster() {
  const { success, error } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ lecturer_id: "", position_id: "", is_primary: false });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assRes, lecRes, posRes] = await Promise.all([
        scheduleService.getAssignments(),
        lecturerService.getLecturers(),
        scheduleService.getPositions(),
      ]);
      if (assRes.success) setAssignments(assRes.data || []);
      if (lecRes.success) setLecturers(lecRes.data || []);
      if (posRes.success) setPositions(posRes.data || []);
    } catch {
      error("Gagal memuat data penugasan.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setFormData({ lecturer_id: "", position_id: "", is_primary: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingAssignment(item);
    setFormData({
      lecturer_id: item.lecturer_id,
      position_id: item.position_id,
      is_primary: Boolean(item.is_primary),
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setDeletingAssignment(item);
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
      const res = editingAssignment
        ? await scheduleService.updateAssignment(editingAssignment.id, formData)
        : await scheduleService.createAssignment(formData);

      if (res.success) {
        await fetchData();
        setIsModalOpen(false);
        success(editingAssignment ? "Penugasan berhasil diperbarui." : "Penugasan berhasil ditambahkan.");
      }
    } catch (err) {
      error(err?.response?.data?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;
    setSubmitting(true);
    try {
      const res = await scheduleService.deleteAssignment(deletingAssignment.id);
      if (res.success) {
        await fetchData();
        setIsDeleteModalOpen(false);
        success("Penugasan berhasil dihapus.");
      }
    } catch {
      error("Gagal menghapus penugasan.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assignments.filter(
      (item) =>
        item.lecturer_name?.toLowerCase().includes(q) || item.position_name?.toLowerCase().includes(q)
    );
  }, [assignments, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penugasan Dosen"
        description="Kelola penempatan dosen pada jabatan struktural atau fungsional tertentu."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus size={16} /> Tambah Penugasan
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#F2F2F7] dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <Input
              type="text"
              icon={Search}
              placeholder="Cari dosen atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Badge>{filteredData.length} Penugasan</Badge>
        </div>

        <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">No</TableHead>
              <TableHead>Nama Dosen</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-[#86868B] animate-pulse">
                  Memuat data penugasan...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState title="Belum Ada Penugasan" description="Tidak ada data penugasan dosen ditemukan." />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-[#86868B]">{index + 1}</TableCell>
                  <TableCell className="font-semibold">{item.lecturer_name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Briefcase size={14} className="text-emerald-600" />
                      {item.position_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.is_primary ? (
                      <Badge variant="success">Jabatan Utama</Badge>
                    ) : (
                      <Badge variant="default">Jabatan Tambahan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEdit(item)} title="Edit">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDelete(item)}
                        title="Hapus"
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

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? "Edit Penugasan" : "Tambah Penugasan"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="assignmentForm" isLoading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="assignmentForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Dosen</label>
            <Select
              options={lecturers.map((lec) => ({ value: lec.id, label: lec.name }))}
              value={
                formData.lecturer_id
                  ? {
                      value: formData.lecturer_id,
                      label: lecturers.find((l) => l.id == formData.lecturer_id)?.name || "",
                    }
                  : null
              }
              onChange={(selectedOption) =>
                handleChange({ target: { name: "lecturer_id", value: selectedOption ? selectedOption.value : "" } })
              }
              placeholder="Pilih Dosen..."
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Jabatan</label>
            <select
              name="position_id"
              value={formData.position_id}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            >
              <option value="" disabled>
                Pilih Jabatan
              </option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              name="is_primary"
              checked={formData.is_primary}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-[#86868B] dark:text-slate-300">
              Tandai sebagai jabatan utama (menonaktifkan status utama di jabatan lain dosen ini bila ada)
            </span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Penugasan?"
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
          Apakah Anda yakin ingin menghapus penugasan{" "}
          <strong className="text-[#1D1D1F] dark:text-white">{deletingAssignment?.position_name}</strong> untuk dosen{" "}
          <strong className="text-[#1D1D1F] dark:text-white">{deletingAssignment?.lecturer_name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
