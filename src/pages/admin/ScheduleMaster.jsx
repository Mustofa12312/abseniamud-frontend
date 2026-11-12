import { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  Clock,
  Plus,
  BookOpen,
  MapPin,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  CalendarDays,
  User,
} from "lucide-react";
import { scheduleService } from "../../services/schedule";
import { masterDataService } from "../../services/masterData";
import { useToast } from "../../contexts/ToastContext";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    borderColor: "#E5E5EA",
    minHeight: "2.625rem",
    boxShadow: "none",
    "&:hover": { borderColor: "#10B981" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export default function ScheduleMaster() {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState({});
  const [rooms, setRooms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    day_of_week: "Senin",
    course_id: "",
    room_id: "",
    start_time: "08:00",
    end_time: "09:30",
  });

  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1");

  const defaultSemesterForTerm = activeAcademicYear?.term === "Genap" ? "2" : "1";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [schedRes, roomRes, facRes, activeYearRes] = await Promise.all([
        scheduleService.getSchedules(),
        masterDataService.getRooms(),
        masterDataService.getFaculties(),
        masterDataService.getActiveAcademicYear(),
      ]);
      if (schedRes.success) setSchedules(schedRes.data || {});
      if (roomRes.success) setRooms(roomRes.data || []);
      if (facRes.success) setFaculties(facRes.data || []);
      if (activeYearRes?.success && activeYearRes.data) {
        setActiveAcademicYear(activeYearRes.data);
      } else {
        setActiveAcademicYear(null);
      }
    } catch {
      error("Gagal memuat data jadwal mengajar.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchData();
    });
    return () => { active = false; };
  }, [fetchData]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedFaculty || !selectedSemester) {
        setCourses([]);
        return;
      }
      try {
        const res = await masterDataService.getCourses(selectedFaculty, selectedSemester);
        if (res.success) setCourses(res.data || []);
      } catch {
        error("Gagal memuat daftar mata kuliah.");
      }
    };
    fetchCourses();
  }, [selectedFaculty, selectedSemester, error]);

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setFormData({
      day_of_week: "Senin",
      course_id: "",
      room_id: "",
      start_time: "08:00",
      end_time: "09:30",
    });
    setSelectedFaculty("");
    setSelectedSemester(defaultSemesterForTerm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (day, item) => {
    setEditingSchedule({ ...item, oldDay: day });
    setFormData({
      day_of_week: item.day_of_week,
      course_id: item.course_id,
      room_id: item.room_id,
      start_time: item.start_time,
      end_time: item.end_time,
    });
    setSelectedFaculty(item.faculty_id ? String(item.faculty_id) : "");
    setSelectedSemester(item.semester ? String(item.semester) : defaultSemesterForTerm);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (day, item) => {
    setDeletingSchedule({ ...item, day });
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.course_id) {
      error("Pilih mata kuliah terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const res = editingSchedule
        ? await scheduleService.updateSchedule(editingSchedule.id, formData)
        : await scheduleService.createSchedule(formData);

      if (res.success) {
        await fetchData();
        setIsModalOpen(false);
        success(editingSchedule ? "Jadwal berhasil diperbarui." : "Jadwal berhasil ditambahkan.");
      }
    } catch (err) {
      error(err?.response?.data?.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSchedule) return;
    setSubmitting(true);
    try {
      const res = await scheduleService.deleteSchedule(deletingSchedule.id);
      if (res.success) {
        await fetchData();
        setIsDeleteModalOpen(false);
        success("Jadwal berhasil dihapus.");
      }
    } catch (err) {
      error(err?.response?.data?.message || "Gagal menghapus jadwal.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourseObj = courses.find((c) => String(c.id) === String(formData.course_id));
  const semesterOptions = activeAcademicYear?.term === "Ganjil" ? [1, 3, 5, 7] : [2, 4, 6, 8];

  const courseOptions = [
    ...courses.map((c) => ({ value: c.id, label: c.name })),
    ...(editingSchedule &&
    formData.course_id &&
    !courses.some((c) => String(c.id) === String(formData.course_id))
      ? [{ value: formData.course_id, label: `${editingSchedule.course_name} (Tersimpan)` }]
      : []),
  ];

  const selectedCourseOption = formData.course_id
    ? {
        value: formData.course_id,
        label:
          selectedCourseObj?.name ||
          (editingSchedule ? editingSchedule.course_name : "Mata Kuliah"),
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Mengajar"
        description="Kelola plotting jadwal perkuliahan dosen, waktu, dan penggunaan ruangan."
        badge={
          activeAcademicYear && (
            <Badge variant={activeAcademicYear.term === "Ganjil" ? "warning" : "info"}>
              {activeAcademicYear.name} ({activeAcademicYear.term})
            </Badge>
          )
        }
        actions={
          <Button size="sm" onClick={handleOpenCreate} disabled={!activeAcademicYear}>
            <Plus className="w-4 h-4" />
            Tambah Jadwal
          </Button>
        }
      />

      {!activeAcademicYear && !loading && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            Belum ada Tahun Akademik yang aktif. Silakan aktifkan salah satu periode di menu{" "}
            <strong>Tahun Akademik</strong> terlebih dahulu sebelum membuat atau mengubah jadwal.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day) => {
          const dayItems = schedules[day] || [];
          return (
            <Card key={day} className="flex flex-col overflow-hidden">
              <CardHeader className="py-4 px-5 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {day}
                </CardTitle>
                <Badge variant={dayItems.length > 0 ? "primary" : "default"}>
                  {dayItems.length} Sesi
                </Badge>
              </CardHeader>

              <CardContent className="p-0 sm:p-0 flex-1 flex flex-col">
                {loading ? (
                  <div className="p-8 flex items-center justify-center text-xs text-[#86868B] gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    Memuat jadwal...
                  </div>
                ) : dayItems.length > 0 ? (
                  <div className="divide-y divide-[#F2F2F7] dark:divide-slate-700/50 flex-1">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 hover:bg-[#F9F9FB] dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <h4 className="font-semibold text-sm text-[#1D1D1F] dark:text-slate-100 leading-snug">
                            {item.course_name}
                          </h4>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {item.start_time} - {item.end_time}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-[#86868B] dark:text-slate-400">
                          <p className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate text-[#1D1D1F]/80 dark:text-slate-300 font-medium">
                              {item.lecturer_name}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate text-[#1D1D1F]/80 dark:text-slate-300">
                              {item.room_name}
                            </span>
                          </p>
                        </div>

                        <div className="mt-3.5 flex items-center gap-2">
                          <Button
                            onClick={() => handleOpenEdit(day, item)}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                          <Button
                            onClick={() => handleOpenDelete(day, item)}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="m-4 p-8 flex-1 flex items-center justify-center rounded-xl border border-dashed border-[#E5E5EA] dark:border-slate-700/70 text-center text-xs text-[#86868B] dark:text-slate-400">
                    Tidak ada jadwal untuk hari {day}.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? "Edit Jadwal Mengajar" : "Tambah Jadwal Mengajar"}
        subtitle="Pilih hari, filter mata kuliah, jam perkuliahan, dan ruangan."
        icon={CalendarDays}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" form="scheduleForm" isLoading={submitting}>
              {editingSchedule ? "Simpan Perubahan" : "Tambah Jadwal"}
            </Button>
          </>
        }
      >
        <form id="scheduleForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">Hari</label>
            <select
              name="day_of_week"
              value={formData.day_of_week}
              onChange={handleChange}
              className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Filter Fakultas / Prodi
              </label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
              >
                <option value="">Pilih Fakultas / Prodi</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Semester ({activeAcademicYear?.term || "Aktif"})
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
              >
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>
                    Semester {s} ({activeAcademicYear?.term || "Aktif"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Mata Kuliah <span className="text-red-500">*</span>
            </label>
            <Select
              options={courseOptions}
              value={selectedCourseOption}
              onChange={(opt) =>
                handleChange({ target: { name: "course_id", value: opt ? opt.value : "" } })
              }
              placeholder={
                !selectedFaculty
                  ? editingSchedule
                    ? "Pilih Fakultas untuk mengganti MK..."
                    : "Pilih Fakultas terlebih dahulu..."
                  : courses.length === 0
                  ? "Tidak ada mata kuliah ditemukan"
                  : "Cari & pilih mata kuliah..."
              }
              isDisabled={!selectedFaculty && !editingSchedule}
              isClearable
              isSearchable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              styles={selectStyles}
              className="text-sm text-[#1D1D1F]"
            />
          </div>

          <div className="rounded-xl border border-[#E5E5EA] dark:border-slate-700/60 bg-[#F9F9FB] dark:bg-slate-900/50 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Dosen Pengampu
            </span>
            <p className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">
              {selectedCourseObj
                ? selectedCourseObj.lecturer_name || "Belum ada dosen pengampu"
                : editingSchedule
                ? editingSchedule.lecturer_name || "-"
                : "Pilih mata kuliah di atas"}
            </p>
            <p className="text-[11px] text-[#86868B] dark:text-slate-400">
              Otomatis tersinkron dari data Master Mata Kuliah.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Ruangan <span className="text-red-500">*</span>
            </label>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleChange}
              required
              className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
            >
              <option value="" disabled>
                Pilih Ruangan...
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Jadwal"
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
              Ya, Hapus Jadwal
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-400">
          Apakah Anda yakin ingin menghapus sesi jadwal{" "}
          <span className="font-semibold text-[#1D1D1F] dark:text-slate-100">
            {deletingSchedule?.course_name}
          </span>{" "}
          pada hari {deletingSchedule?.day}? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
