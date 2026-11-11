import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Smartphone, ShieldCheck, CheckCircle2, Ban } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { adminService } from "../../services/admin";
import { useToast } from "../../contexts/ToastContext";

export default function UserMaster() {
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "dosen",
    attendance_type: "schedule_based",
    is_active: true,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminService.getUsers();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch {
      error("Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchUsers();
    });
    return () => { active = false; };
  }, [fetchUsers]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      const res = editingUser
        ? await adminService.updateUser(editingUser.id, payload)
        : await adminService.createUser(payload);

      if (res.success) {
        await fetchUsers();
        success(editingUser ? "Pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan.");
        setIsModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan, periksa formulir Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "dosen",
      attendance_type: user.attendance_type || "schedule_based",
      is_active: user.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "dosen",
      attendance_type: "schedule_based",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminService.deleteUser(deleteTarget.id);
      if (res.success) {
        await fetchUsers();
        success("Pengguna berhasil dihapus.");
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menghapus pengguna.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleConfirmResetDevice = async () => {
    if (!resetTarget) return;
    try {
      const res = await adminService.resetDevice(resetTarget.id);
      if (res.success) {
        await fetchUsers();
        success(res.message || "Perangkat berhasil di-reset.");
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mereset perangkat pengguna.");
    } finally {
      setResetTarget(null);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const nextActive = user.is_active === false;
      const res = await adminService.updateUser(user.id, { is_active: nextActive });
      if (res.success) {
        await fetchUsers();
        success(nextActive ? "Akun diaktifkan." : "Akun dinonaktifkan.");
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengubah status akun.");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="purple">Super Admin</Badge>;
      case "admin_akademik":
        return <Badge variant="info">Admin Akademik</Badge>;
      case "admin_keuangan":
        return <Badge variant="primary">Admin Keuangan</Badge>;
      case "dosen":
        return <Badge variant="default">Dosen</Badge>;
      case "tendik":
        return <Badge variant="warning">Tendik</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesQuery =
        !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna & Hak Akses"
        description="Kelola akun masuk, peran akses sistem, status aktif, dan ikatan perangkat Android."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Akun
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            type="text"
            icon={Search}
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["ALL", "super_admin", "admin_akademik", "admin_keuangan", "dosen", "tendik"].map((roleKey) => (
            <button
              key={roleKey}
              type="button"
              onClick={() => {
                setRoleFilter(roleKey);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === roleKey
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-[#F5F5F7] dark:bg-slate-800 text-[#86868B] dark:text-slate-300 hover:bg-[#E8E8ED]"
              }`}
            >
              {roleKey === "ALL" ? "Semua" : roleKey.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#86868B] animate-pulse">Memuat data pengguna...</div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Tidak Ada Pengguna"
            description="Tidak ada akun yang sesuai dengan filter pencarian Anda."
          />
        ) : (
          <>
            <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Hak Akses</TableHead>
                  <TableHead>Perangkat Terikat</TableHead>
                  <TableHead>Status Akun</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((u) => {
                  const isActive = u.is_active !== false;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-semibold text-[#1D1D1F] dark:text-slate-100">{u.name}</p>
                        <p className="text-xs text-[#86868B] dark:text-slate-400">{u.email}</p>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        {u.device_bound ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 px-2.5 py-0.5 rounded-full">
                            <Smartphone size={12} /> {u.bound_device_name || "Perangkat Terikat"}
                          </span>
                        ) : (
                          <span className="text-xs text-[#86868B] dark:text-slate-500">Belum terikat</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          title="Klik untuk aktif/nonaktifkan akun"
                          className="cursor-pointer"
                        >
                          {isActive ? (
                            <Badge variant="success">
                              <CheckCircle2 size={11} /> Aktif
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              <Ban size={11} /> Nonaktif
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetTarget(u)}
                            title="Reset Ikatan Perangkat HP"
                            className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                          >
                            <Smartphone size={13} /> Reset HP
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openEdit(u)} title="Edit Akun">
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteTarget(u)}
                            title="Hapus Akun"
                            className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination
              currentPage={safePage}
              lastPage={totalPages}
              total={filteredUsers.length}
              from={(safePage - 1) * itemsPerPage + 1}
              to={Math.min(safePage * itemsPerPage, filteredUsers.length)}
              onPageChange={setCurrentPage}
              itemLabel="pengguna"
            />
          </>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
        subtitle={
          editingUser
            ? "Kosongkan kata sandi bila tidak ingin mengubah password saat ini."
            : "Isi detail akun pengguna untuk akses web & mobile."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="userForm" isLoading={submitting}>
              {editingUser ? "Simpan Perubahan" : "Buat Akun"}
            </Button>
          </>
        }
      >
        <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Nama Lengkap</label>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Alamat Email</label>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              Kata Sandi {editingUser && <span className="text-[#86868B] font-normal">(Opsional)</span>}
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingUser}
              placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Hak Akses</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="dosen">Dosen</option>
                <option value="tendik">Tenaga Kependidikan (Tendik)</option>
                <option value="admin_akademik">Admin Akademik</option>
                <option value="admin_keuangan">Admin Keuangan</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Tipe Presensi</label>
              <select
                name="attendance_type"
                value={formData.attendance_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="schedule_based">Sesuai Jadwal Mengajar</option>
                <option value="daily_mandatory">Wajib Hadir Harian</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span className="text-xs font-medium">Akun Aktif (Izinkan login ke sistem)</span>
          </label>
        </form>
      </Modal>

      {/* Confirm Reset Device Modal */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset Ikatan Perangkat?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmResetDevice}>
              Reset Perangkat
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-300 leading-relaxed">
          Sesi aktif aplikasi Android milik <strong className="text-[#1D1D1F] dark:text-white">{resetTarget?.name}</strong>{" "}
          akan dicabut sehingga pengguna dapat login dari perangkat HP baru.
        </p>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Pengguna?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Hapus Permanen
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-300 leading-relaxed">
          Apakah Anda yakin ingin menghapus akun <strong className="text-[#1D1D1F] dark:text-white">{deleteTarget?.name}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
