import { useState, useEffect } from "react";
import { Settings, Save, Clock, Map, Building2, Lock } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { adminService } from "../../services/admin";
import { authService } from "../../services/auth";
import { useToast } from "../../contexts/ToastContext";

export default function SystemSettings() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [formData, setFormData] = useState({
    app_name: "IAIMU Attendance",
    default_checkin_time: "07:00",
    default_checkout_time: "16:00",
    staff_checkin_time: "07:30",
    staff_include_saturday: false,
    late_tolerance_minutes: "15",
    default_radius_meters: "50",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    let cancelled = false;
    adminService
      .getSettings()
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          const sat = res.data.staff_include_saturday;
          setFormData({
            app_name: res.data.app_name || "IAIMU Attendance",
            default_checkin_time: res.data.default_checkin_time || "07:00",
            default_checkout_time: res.data.default_checkout_time || "16:00",
            staff_checkin_time: res.data.staff_checkin_time || "07:30",
            staff_include_saturday: sat === true || sat === 1 || sat === "1" || sat === "true",
            late_tolerance_minutes: String(res.data.late_tolerance_minutes ?? "15"),
            default_radius_meters: String(res.data.default_radius_meters ?? "50"),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        staff_include_saturday: formData.staff_include_saturday ? "1" : "0",
      };
      const res = await adminService.updateSettings(payload);
      if (res.success) {
        success(res.message || "Pengaturan berhasil disimpan.");
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      error("Kata sandi baru dan konfirmasi tidak cocok.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await authService.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });
      if (res.success) {
        success("Kata sandi berhasil diubah.");
        setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal mengubah kata sandi.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi parameter global yang berlaku untuk seluruh civitas dan perangkat."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identitas Aplikasi */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Identitas Aplikasi</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400">Pengaturan nama utama sistem presensi</p>
            </div>
          </div>
          <CardContent className="p-6 pt-6">
            <div className="max-w-md space-y-1.5">
              <label className="text-xs font-semibold">Nama Aplikasi</label>
              <Input
                name="app_name"
                value={formData.app_name}
                onChange={handleChange}
                placeholder="Misal: IAIMU Attendance"
              />
            </div>
          </CardContent>
        </Card>

        {/* Aturan Waktu Absensi */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Aturan Waktu & Hari Kerja</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400">
                Jam masuk, jam pulang, toleransi keterlambatan, dan hari kerja Tendik
              </p>
            </div>
          </div>
          <CardContent className="p-6 pt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Jam Check-in Standar (Dosen)</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    name="default_checkin_time"
                    value={formData.default_checkin_time}
                    onChange={handleChange}
                  />
                  <span className="text-xs font-medium text-[#86868B]">WIB</span>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                  Rujukan dosen yang belum memiliki jadwal kelas spesifik.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Jam Check-out Default</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    name="default_checkout_time"
                    value={formData.default_checkout_time}
                    onChange={handleChange}
                  />
                  <span className="text-xs font-medium text-[#86868B]">WIB</span>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                  Waktu standar selesai jam kerja apabila tidak terikat jadwal akhir kelas.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Jam Check-in Tendik (Harian)</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    name="staff_checkin_time"
                    value={formData.staff_checkin_time}
                    onChange={handleChange}
                  />
                  <span className="text-xs font-medium text-[#86868B]">WIB</span>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                  Berlaku untuk Tendik & jabatan struktural wajib hadir harian.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Toleransi Keterlambatan</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    name="late_tolerance_minutes"
                    value={formData.late_tolerance_minutes}
                    onChange={handleChange}
                    min="0"
                    className="w-28"
                  />
                  <span className="text-xs font-medium text-[#86868B]">Menit</span>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                  Melewati batas ini otomatis berstatus Terlambat.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F9F9FB] dark:bg-slate-900/50 border border-[#E5E5EA] dark:border-slate-700/60 max-w-2xl cursor-pointer">
              <input
                type="checkbox"
                name="staff_include_saturday"
                checked={formData.staff_include_saturday}
                onChange={handleChange}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div>
                <p className="text-xs font-semibold">Sertakan Hari Sabtu sebagai Hari Kerja Tendik</p>
                <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5">
                  Jika dicentang, ketidakhadiran Tendik di hari Sabtu ikut dihitung dalam rekap alpa.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Aturan Geofence */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Map size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Pengaturan Lokasi GPS (Geofencing)</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400">
                Parameter jangkauan radius bawaan untuk titik lokasi kampus
              </p>
            </div>
          </div>
          <CardContent className="p-6 pt-6">
            <div className="max-w-xs space-y-1.5">
              <label className="text-xs font-semibold">Radius Bawaan</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  name="default_radius_meters"
                  value={formData.default_radius_meters}
                  onChange={handleChange}
                  min="10"
                  className="w-32"
                />
                <span className="text-xs font-medium text-[#86868B]">Meter</span>
              </div>
              <p className="text-[11px] text-[#86868B] dark:text-slate-400">
                Digunakan bila titik lokasi belum menetapkan radius khusus.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} className="px-6">
            {!saving && <Save size={15} />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan Sistem"}
          </Button>
        </div>
      </form>

      {/* Ubah Kata Sandi Akun Admin */}
      <form onSubmit={handleSubmitPassword} className="pt-2">
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ubah Kata Sandi Akun</h3>
              <p className="text-xs text-[#86868B] dark:text-slate-400">
                Perbarui kata sandi masuk untuk akun administrator ini
              </p>
            </div>
          </div>
          <CardContent className="p-6 pt-6 space-y-4">
            <div className="grid gap-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan kata sandi saat ini"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="password"
                  name="new_password_confirmation"
                  value={passwordData.new_password_confirmation}
                  onChange={handlePasswordChange}
                  placeholder="Ketik ulang kata sandi baru"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F2F2F7] dark:border-slate-700/60">
              <Button type="submit" variant="danger" isLoading={savingPassword}>
                {!savingPassword && <Settings size={15} />}
                {savingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
