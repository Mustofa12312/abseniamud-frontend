import { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
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
  Search,
  X,
} from "lucide-react";
import { scheduleService } from "../../services/schedule";
import { masterDataService } from "../../services/masterData";
import { useToast } from "../../contexts/ToastContext";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const JS_DAY_TO_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const TODAY_DAY_NAME = JS_DAY_TO_ID[new Date().getDay()];

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

function ScheduleDaySection({
  day,
  items,
  isToday,
  hasActiveFilter,
  canCreate,
  onAddForDay,
  onEdit,
  onDelete,
  onResetFilters,
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3.5 px-4 sm:px-5 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <CardTitle className="text-sm sm:text-base">{day}</CardTitle>
          {isToday && <Badge variant="info">Hari Ini</Badge>}
          <Badge variant={items.length > 0 ? "primary" : "default"}>{items.length} Sesi</Badge>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddForDay(day)}
          disabled={!canCreate}
          className="h-8 px-2.5 text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tambah {day}</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        {items.length > 0 ? (
          <>
            {/* Compact Desktop Table */}
            <div className="hidden md:block">
              <Table containerClassName="border-0 rounded-none shadow-none bg-transparent dark:bg-transparent">
                <TableHeader>
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="w-36">Jam</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Prodi</TableHead>
                    <TableHead>Dosen Pengampu</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-right w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3 shrink-0" />
                          {item.start_time} - {item.end_time}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-semibold text-sm text-[#1D1D1F] dark:text-slate-100 leading-snug">
                          {item.course_name}
                        </p>
                        {(item.semester || item.sks || item.course_code) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-[#86868B] dark:text-slate-400">
                            {item.semester && <span>Smt {item.semester}</span>}
                            {item.sks && <span>· {item.sks} SKS</span>}
                            {item.course_code && <span className="font-mono">· {item.course_code}</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-[#86868B] dark:text-slate-400 max-w-[180px]">
                        <span className="line-clamp-2">{item.faculty_name || "-"}</span>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-medium text-[#1D1D1F] dark:text-slate-200">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                          {item.lecturer_name}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <Badge variant="default">
                          <MapPin className="w-3 h-3" />
                          {item.room_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(day, item)}
                            title="Edit Jadwal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(day, item)}
                            title="Hapus Jadwal"
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Compact Mobile List */}
            <div className="md:hidden divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-[#F9F9FB] dark:hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {item.start_time} - {item.end_time}
                      </span>
                      {item.semester && (
                        <Badge variant="primary" className="text-[10px]">
                          Smt {item.semester}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-[#1D1D1F] dark:text-slate-100 leading-snug">
                      {item.course_name}
                    </h4>
                    <p className="text-xs text-[#86868B] dark:text-slate-400">
                      {item.lecturer_name} · <span className="text-[#1D1D1F] dark:text-slate-200 font-medium">{item.room_name}</span>
                    </p>
                    {item.faculty_name && (
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400 truncate">
                        {item.faculty_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(day, item)}
                      title="Edit Jadwal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(day, item)}
                      title="Hapus Jadwal"
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={
              hasActiveFilter
                ? `Tidak ada jadwal hari ${day} yang cocok`
                : `Belum ada jadwal hari ${day}`
            }
            description={
              hasActiveFilter
                ? "Coba ubah atau reset filter Prodi, Semester, Ruangan, atau kata kunci pencarian."
                : `Hari ${day} belum memiliki sesi perkuliahan terjadwal.`
            }
            action={
              hasActiveFilter ? (
                <Button variant="outline" size="sm" onClick={onResetFilters}>
                  Reset Filter
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onAddForDay(day)}
                  disabled={!canCreate}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Jadwal {day}
                </Button>
              )
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function ScheduleMaster() {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState({});
  const [rooms, setRooms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeDay, setActiveDay] = useState(TODAY_DAY_NAME);
  const hasAutoSelectedDay = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterRoom, setFilterRoom] = useState("");

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
      if (schedRes.success) {
        const grouped = schedRes.data || {};
        setSchedules(grouped);

        if (!hasAutoSelectedDay.current) {
          hasAutoSelectedDay.current = true;
          const todayCount = (grouped[TODAY_DAY_NAME] || []).length;
          if (todayCount === 0) {
            const firstPopulatedDay = DAYS.find((d) => (grouped[d] || []).length > 0);
            if (firstPopulatedDay) setActiveDay(firstPopulatedDay);
          }
        }
      }
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
    return () => {
      active = false;
    };
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

  const allItemsFlat = DAYS.flatMap((d) => schedules[d] || []);

  const semesterFilterOptions = Array.from(
    new Set([
      1, 2, 3, 4, 5, 6, 7, 8,
      ...allItemsFlat.map((item) => Number(item.semester)).filter((n) => Number.isInteger(n) && n > 0),
    ])
  ).sort((a, b) => a - b);

  const q = searchQuery.toLowerCase().trim();
  const filteredByDay = DAYS.reduce((acc, day) => {
    const dayItems = schedules[day] || [];
    acc[day] = dayItems.filter((item) => {
      if (filterFaculty && String(item.faculty_id) !== String(filterFaculty)) return false;
      if (filterSemester && String(item.semester) !== String(filterSemester)) return false;
      if (filterRoom && String(item.room_id) !== String(filterRoom)) return false;
      if (!q) return true;
      return (
        (item.course_name || "").toLowerCase().includes(q) ||
        (item.course_code || "").toLowerCase().includes(q) ||
        (item.lecturer_name || "").toLowerCase().includes(q) ||
        (item.room_name || "").toLowerCase().includes(q) ||
        (item.faculty_name || "").toLowerCase().includes(q)
      );
    });
    return acc;
  }, {});

  const totalRawSchedules = allItemsFlat.length;
  const totalFilteredSchedules = DAYS.reduce((sum, day) => sum + filteredByDay[day].length, 0);
  const hasActiveFilter = Boolean(searchQuery || filterFaculty || filterSemester || filterRoom);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterFaculty("");
    setFilterSemester("");
    setFilterRoom("");
  };

  const handleOpenCreate = (targetDay = null) => {
    const initialDay = targetDay || (activeDay !== "ALL" ? activeDay : TODAY_DAY_NAME);
    setEditingSchedule(null);
    setFormData({
      day_of_week: initialDay,
      course_id: "",
      room_id: filterRoom || "",
      start_time: "08:00",
      end_time: "09:30",
    });
    setSelectedFaculty(filterFaculty || "");
    setSelectedSemester(filterSemester || defaultSemesterForTerm);
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
        if (activeDay !== "ALL" && formData.day_of_week) {
          setActiveDay(formData.day_of_week);
        }
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
  const baseModalSemesters = activeAcademicYear?.term === "Ganjil" ? [1, 3, 5, 7] : [2, 4, 6, 8];
  const modalSemesterOptions = Array.from(
    new Set([
      ...baseModalSemesters,
      ...(Number(selectedSemester) > 0 ? [Number(selectedSemester)] : []),
    ])
  ).sort((a, b) => a - b);

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

  const populatedDaysInAll = DAYS.filter((day) => filteredByDay[day].length > 0);
  const emptyDaysInAll = DAYS.filter((day) => filteredByDay[day].length === 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jadwal Mengajar"
        description="Kelola plotting jadwal perkuliahan penuh (Senin – Minggu) untuk seluruh prodi dan ruangan."
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            {activeAcademicYear && (
              <Badge variant={activeAcademicYear.term === "Ganjil" ? "warning" : "info"}>
                {activeAcademicYear.name} ({activeAcademicYear.term})
              </Badge>
            )}
            <Badge variant="default">{totalRawSchedules} Sesi</Badge>
          </div>
        }
        actions={
          <Button size="sm" onClick={() => handleOpenCreate()} disabled={!activeAcademicYear}>
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

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center gap-2.5 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[200px]">
                <Input
                  icon={Search}
                  placeholder="Cari mata kuliah, dosen, prodi, atau ruangan..."
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
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                aria-label="Filter Fakultas atau Prodi"
                className="h-10 sm:h-11 rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 sm:w-52"
              >
                <option value="">Semua Prodi</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                aria-label="Filter Semester"
                className="h-10 sm:h-11 rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 sm:w-36"
              >
                <option value="">Semua Smt</option>
                {semesterFilterOptions.map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>

              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                aria-label="Filter Ruangan"
                className="h-10 sm:h-11 rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 sm:w-40"
              >
                <option value="">Semua Ruang</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
              <p className="text-xs text-[#86868B] dark:text-slate-400">
                <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">
                  {totalFilteredSchedules}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">
                  {totalRawSchedules}
                </span>{" "}
                sesi
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
          </div>

          {/* 7-Day Week Pill Selector */}
          <div className="pt-2 border-t border-[#F2F2F7] dark:border-slate-700/60 flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            {DAYS.map((day) => {
              const count = filteredByDay[day].length;
              const isSelected = activeDay === day;
              const isToday = day === TODAY_DAY_NAME;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : count > 0
                      ? "bg-white dark:bg-slate-900/60 text-[#1D1D1F] dark:text-slate-200 border-[#E5E5EA] dark:border-slate-700/70 hover:bg-[#F9F9FB] dark:hover:bg-slate-800"
                      : "bg-[#F9F9FB] dark:bg-slate-900/30 text-[#86868B] dark:text-slate-500 border-transparent hover:border-[#E5E5EA] dark:hover:border-slate-700/60"
                  }`}
                >
                  {isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-emerald-500"
                      }`}
                      title="Hari ini"
                    />
                  )}
                  <span>{day}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-black/5 dark:bg-white/10 text-[#6E6E73] dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setActiveDay("ALL")}
              className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                activeDay === "ALL"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                  : "bg-white dark:bg-slate-900/60 text-[#1D1D1F] dark:text-slate-200 border-[#E5E5EA] dark:border-slate-700/70 hover:bg-[#F9F9FB] dark:hover:bg-slate-800"
              }`}
            >
              <span>Semua Hari</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                  activeDay === "ALL"
                    ? "bg-white/20 dark:bg-black/15"
                    : "bg-black/5 dark:bg-white/10 text-[#6E6E73] dark:text-slate-400"
                }`}
              >
                {totalFilteredSchedules}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      {loading ? (
        <Card>
          <CardContent className="p-10 flex items-center justify-center text-sm text-[#86868B] gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Memuat data jadwal mengajar...
          </CardContent>
        </Card>
      ) : activeDay === "ALL" ? (
        populatedDaysInAll.length > 0 ? (
          <div className="space-y-4">
            {populatedDaysInAll.map((day) => (
              <ScheduleDaySection
                key={day}
                day={day}
                items={filteredByDay[day]}
                isToday={day === TODAY_DAY_NAME}
                hasActiveFilter={hasActiveFilter}
                canCreate={Boolean(activeAcademicYear)}
                onAddForDay={handleOpenCreate}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onResetFilters={resetFilters}
              />
            ))}

            {emptyDaysInAll.length > 0 && (
              <div className="rounded-xl border border-dashed border-[#E5E5EA] dark:border-slate-700/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#86868B] dark:text-slate-400">
                <span>
                  Hari tanpa sesi {hasActiveFilter ? "yang cocok" : ""}:{" "}
                  <strong className="text-[#1D1D1F] dark:text-slate-200">
                    {emptyDaysInAll.join(", ")}
                  </strong>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {emptyDaysInAll.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setActiveDay(d)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 hover:border-emerald-500 text-[11px] font-medium text-[#1D1D1F] dark:text-slate-200 cursor-pointer"
                    >
                      Buka {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title={hasActiveFilter ? "Jadwal Tidak Ditemukan" : "Belum Ada Jadwal Mengajar"}
              description={
                hasActiveFilter
                  ? "Tidak ada sesi jadwal di hari mana pun yang cocok dengan filter saat ini."
                  : "Belum ada sesi jadwal yang dibuat pada tahun akademik aktif."
              }
              action={
                hasActiveFilter ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filter
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleOpenCreate()} disabled={!activeAcademicYear}>
                    <Plus className="w-4 h-4" />
                    Tambah Jadwal Pertama
                  </Button>
                )
              }
            />
          </Card>
        )
      ) : (
        <ScheduleDaySection
          day={activeDay}
          items={filteredByDay[activeDay] || []}
          isToday={activeDay === TODAY_DAY_NAME}
          hasActiveFilter={hasActiveFilter}
          canCreate={Boolean(activeAcademicYear)}
          onAddForDay={handleOpenCreate}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onResetFilters={resetFilters}
        />
      )}

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
                {modalSemesterOptions.map((s) => (
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
