import { useState } from "react";
import { Mail, Hash, Phone, MapPin, LogOut, Edit2, Save, Building2, Lock } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth";
import { useToast } from "../../contexts/ToastContext";
import { getRoleDisplayLabel } from "../../utils/rbac";

export default function LecturerProfile() {
  const { user, logout, refreshUser } = useAuth();
  const { success, error } = useToast();

  // Support lecturer profile, staff profile, or hybrid accounts seamlessly
  const lecturerData = user?.lecturer || {};
  const staffData = user?.staff_profile || {};
  const profilePhone = lecturerData.phone || staffData.phone || "";
  const profileAddress = lecturerData.address || staffData.address || "";
  const displayNip = lecturerData.nip || staffData.nip || "-";
  const roleLabel = getRoleDisplayLabel(user);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const openEditModal = () => {
    setFormData({
      phone: profilePhone,
      address: profileAddress,
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });
    setIsEditModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.new_password && formData.new_password !== formData.new_password_confirmation) {
      error("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }
    if (formData.new_password && !formData.current_password) {
      error("Masukkan kata sandi saat ini untuk mengubah kata sandi baru!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        phone: formData.phone,
        address: formData.address,
      };
      if (formData.new_password) {
        payload.current_password = formData.current_password;
        payload.new_password = formData.new_password;
        payload.new_password_confirmation = formData.new_password_confirmation;
      }

      const res = await authService.updateProfile(payload);
      if (res.success) {
        success("Profil berhasil diperbarui!");
        setIsEditModalOpen(false);
        await refreshUser();
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Avatar & Header Card */}
      <Card>
        <CardContent className="pt-8 pb-7 flex flex-col items-center text-center">
          <div className="h-22 w-22 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md ring-4 ring-emerald-50 dark:ring-emerald-950/50 mb-4">
            <span className="font-bold text-white text-3xl">
              {user?.name?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
              {user?.name || "Nama Pengguna"}
            </h1>
            <button
              type="button"
              onClick={openEditModal}
              title="Edit Profil"
              className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <Badge variant="primary" className="mt-2.5">
            {roleLabel}
          </Badge>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-0 divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
          <div className="p-4 sm:px-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                Email Akun
              </p>
              <p className="font-medium text-sm truncate mt-0.5">{user?.email || "-"}</p>
            </div>
          </div>

          {user?.lecturer && (
            <div className="p-4 sm:px-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Hash size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                  NIDN
                </p>
                <p className="font-medium text-sm mt-0.5">{lecturerData.nidn || "-"}</p>
              </div>
            </div>
          )}

          <div className="p-4 sm:px-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Hash size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                NIP / Nomor Induk Pegawai
              </p>
              <p className="font-medium text-sm mt-0.5">{displayNip}</p>
            </div>
          </div>

          {staffData.department && (
            <div className="p-4 sm:px-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                  Unit Kerja / Departemen
                </p>
                <p className="font-medium text-sm mt-0.5">{staffData.department}</p>
              </div>
            </div>
          )}

          <div className="p-4 sm:px-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                No. Telepon
              </p>
              <p className="font-medium text-sm mt-0.5">{profilePhone || "-"}</p>
            </div>
          </div>

          <div className="p-4 sm:px-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868B] dark:text-slate-400 uppercase tracking-wider">
                Alamat Lengkap
              </p>
              <p className="font-medium text-sm mt-0.5">{profileAddress || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button size="lg" className="w-full" onClick={openEditModal}>
          <Edit2 size={17} /> Lengkapi Profil & Kata Sandi
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
          onClick={logout}
        >
          <LogOut size={17} /> Keluar Aplikasi
        </Button>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profil & Keamanan"
        subtitle="Perbarui informasi kontak atau ubah kata sandi Anda"
        icon={Lock}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="edit-profile-form" isLoading={isSubmitting}>
              {!isSubmitting && <Save size={15} />} Simpan Perubahan
            </Button>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">Informasi Kontak</h4>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Nomor Telepon</label>
              <Input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Alamat Lengkap</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
                placeholder="Masukkan alamat domisili..."
              />
            </div>
          </div>

          <hr className="border-[#F2F2F7] dark:border-slate-700" />

          <div className="space-y-3.5">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">Ubah Kata Sandi</h4>
              <p className="text-[11px] text-[#86868B] mt-0.5">Kosongkan bila tidak ingin mengubah kata sandi.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Kata Sandi Saat Ini</label>
              <Input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Kata Sandi Baru</label>
              <Input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Konfirmasi Kata Sandi Baru</label>
              <Input
                type="password"
                name="new_password_confirmation"
                value={formData.new_password_confirmation}
                onChange={handleChange}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
