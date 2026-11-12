import { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { BookOpen, Plus, Edit2, Trash2, Search, X, AlertTriangle, User, Layers } from "lucide-react";
import { masterDataService } from "../../services/masterData";
import { lecturerService } from "../../services/lecturer";
import { useToast } from "../../contexts/ToastContext";

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

export default function CourseMaster() {
  const { success, error } = useToast();
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    faculty_id: "",
    lecturer_id: "",
    name: "",
    code: "",
    semester: "1",
    sks: "2",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [facRes, courseRes, lectRes] = await Promise.all([
        masterDataService.getFaculties(),
        masterDataService.getCourses(filterFaculty),
        lecturerService.getLecturers(),
      ]);
      if (facRes.success) setFaculties(facRes.data || []);
      if (courseRes.success) setCourses(courseRes.data || []);
      if (lectRes.success) setLecturers(lectRes.data || []);
    } catch {
      error("Gagal memuat data mata kuliah.");
    } finally {
      setLoading(false);
    }
  }, [filterFaculty, error]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchData();
    });
    return () => { active = false; };
  }, [fetchData]);

  const semesterOptions = Array.from(
    new Set([
      1, 2, 3, 4, 5, 6, 7, 8,
      ...courses
        .map((c) => Number(c.semester))
        .filter((n) => Number.isInteger(n) && n > 0),
    ])
  ).sort((a, b) => a - b);

  const filteredCourses = courses
    .filter((course) => {
      if (filterSemester === "odd" && Number(course.semester) % 2 === 0) return false;
      if (filterSemester === "even" && Number(course.semester) % 2 !== 0) return false;
      if (
        filterSemester &&
        filterSemester !== "odd" &&
        filterSemester !== "even" &&
        String(course.semester) !== String(filterSemester)
      ) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (course.name || "").toLowerCase().includes(q) ||
        (course.code || "").toLowerCase().includes(q) ||
        (course.lecturer_name || "").toLowerCase().includes(q) ||
        (course.faculty?.name || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const semDiff = (Number(a.semester) || 0) - (Number(b.semester) || 0);
      if (semDiff !== 0) return semDiff;
      return (a.name || "").localeCompare(b.name || "", "id");
    });

  const totalVisibleSks = filteredCourses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);
  const hasActiveFilter = Boolean(searchQuery || filterFaculty || filterSemester);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterFaculty("");
    setFilterSemester("");
  };

  const handleOpenCreate = () => {
    const prefilledSemester = /^\d+$/.test(filterSemester) ? filterSemester : "1";
    setEditingCourse(null);
    setFormData({
      faculty_id: filterFaculty || (faculties.length > 0 ? faculties[0].id : ""),
      lecturer_id: "",
      name: "",
      code: "",
      semester: prefilledSemester,
      sks: "2",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingCourse(item);
    setFormData({
      faculty_id: item.faculty_id || "",
      lecturer_id: item.lecturer_id || "",
      name: item.name || "",
      code: item.code || "",
      semester: String(item.semester || "1"),
      sks: String(item.sks || "2"),
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setDeletingCourse(item);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.faculty_id) {
      error("Pilih fakultas / program studi terlebih dahulu.");
      return;
    }
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      error("Nama mata kuliah wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        name: trimmedName,
        code: formData.code.trim() || null,
        lecturer_id: formData.lecturer_id || null,
        semester: Number(formData.semester),
        sks: Number(formData.sks),
      };

      const res = editingCourse
        ? await masterDataService.updateCourse(editingCourse.id, submitData)
        : await masterDataService.createCourse(submitData);

      if (res.success) {
        success(
          res.message ||
            (editingCourse
              ? "Mata kuliah berhasil diperbarui."
              : "Mata kuliah berhasil ditambahkan.")
        );
        fetchData();
        setIsModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    setSubmitting(true);
    try {
      const res = await masterDataService.deleteCourse(deletingCourse.id);
      if (res.success) {
        success(res.message || "Mata kuliah berhasil dihapus.");
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal menghapus mata kuliah.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFacultyOption = formData.faculty_id
    ? faculties
        .filter((f) => String(f.id) === String(formData.faculty_id))
        .map((f) => ({ value: f.id, label: f.name }))[0] || null
    : null;

  const selectedLecturerOption = formData.lecturer_id
    ? lecturers
        .filter((l) => String(l.id) === String(formData.lecturer_id))
        .map((l) => ({ value: l.id, label: l.name }))[0] || null
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Mata Kuliah"
        description="Kelola daftar mata kuliah, bobot SKS, semester, dan dosen pengampu."
        badge={<Badge variant="default">{courses.length} Mata Kuliah</Badge>}
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            Tambah Mata Kuliah
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center gap-2.5 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
              <Input
                icon={Search}
                placeholder="Cari nama mata kuliah, kode, atau dosen pengampu..."
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
              aria-label="Filter Fakultas atau Program Studi"
              className="h-10 sm:h-11 rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3.5 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 sm:w-56 lg:w-60"
            >
              <option value="">Semua Fakultas / Prodi</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <div className="relative flex items-center sm:w-48 shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#86868B] absolute left-3 pointer-events-none" />
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                aria-label="Filter Semester"
                className="h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 pl-8 pr-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
              >
                <option value="">Semua Semester</option>
                <optgroup label="Per Semester">
                  {semesterOptions.map((s) => (
                    <option key={s} value={String(s)}>
                      Semester {s}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Berdasarkan Periode">
                  <option value="odd">Semester Ganjil (1, 3, 5, 7)</option>
                  <option value="even">Semester Genap (2, 4, 6, 8)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
            <p className="text-xs text-[#86868B] dark:text-slate-400">
              Menampilkan <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{filteredCourses.length}</span> dari{" "}
              <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{courses.length}</span> mata kuliah
              {filteredCourses.length > 0 && ` · ${totalVisibleSks} SKS`}
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
                  <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10" />
                  <div className="flex gap-1.5">
                    <div className="w-14 h-5 rounded-full bg-black/5 dark:bg-white/10" />
                    <div className="w-14 h-5 rounded-full bg-black/5 dark:bg-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-44 rounded bg-black/5 dark:bg-white/10" />
                  <div className="h-3.5 w-32 rounded bg-black/5 dark:bg-white/10" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 w-full rounded bg-black/5 dark:bg-white/10" />
                  <div className="h-3.5 w-2/3 rounded bg-black/5 dark:bg-white/10" />
                </div>
                <div className="pt-3 border-t border-[#F2F2F7] dark:border-slate-700/60 flex justify-end gap-2">
                  <div className="h-8 w-20 rounded-xl bg-black/5 dark:bg-white/10" />
                  <div className="h-8 w-20 rounded-xl bg-black/5 dark:bg-white/10" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="flex flex-col hover:border-[#D2D2D7] dark:hover:border-slate-600 transition-all"
            >
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <Badge variant="primary">Smt {course.semester}</Badge>
                    <Badge variant="default">{course.sks} SKS</Badge>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-slate-100 leading-snug">
                  {course.name}
                </h3>
                <p className="text-xs text-[#86868B] dark:text-slate-400 mt-1">
                  {course.faculty?.name || "Tanpa Fakultas"}
                </p>

                <div className="mt-4 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#86868B] dark:text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Pengampu
                    </span>
                    <span className="font-medium text-[#1D1D1F] dark:text-slate-200 truncate max-w-[60%] text-right">
                      {course.lecturer_name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#86868B] dark:text-slate-400">Kode MK</span>
                    <span className="font-mono font-medium text-[#1D1D1F] dark:text-slate-200">
                      {course.code || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#F2F2F7] dark:border-slate-700/60 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2">
                  <Button onClick={() => handleOpenEdit(course)} variant="outline" size="sm" className="sm:px-3.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleOpenDelete(course)}
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
              icon={BookOpen}
              title={hasActiveFilter ? "Mata Kuliah Tidak Ditemukan" : "Belum Ada Mata Kuliah"}
              description={
                hasActiveFilter
                  ? "Tidak ada mata kuliah yang cocok dengan filter atau pencarian saat ini."
                  : "Data master mata kuliah masih kosong. Tambahkan mata kuliah baru untuk mulai menyusun jadwal."
              }
              action={
                hasActiveFilter ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filter
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4" /> Tambah Mata Kuliah
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
        title={editingCourse ? "Edit Mata Kuliah" : "Tambah Mata Kuliah Baru"}
        subtitle="Lengkapi informasi mata kuliah, SKS, dan dosen pengampu."
        icon={BookOpen}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" form="courseForm" isLoading={submitting}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="courseForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Fakultas / Prodi <span className="text-red-500">*</span>
            </label>
            <Select
              options={faculties.map((f) => ({ value: f.id, label: f.name }))}
              value={selectedFacultyOption}
              onChange={(opt) => handleChange({ target: { name: "faculty_id", value: opt ? opt.value : "" } })}
              placeholder="Pilih Fakultas / Prodi..."
              isSearchable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              styles={selectStyles}
              className="text-sm text-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Dosen Pengampu (Opsional)
            </label>
            <Select
              options={lecturers.map((l) => ({ value: l.id, label: l.name }))}
              value={selectedLecturerOption}
              onChange={(opt) => handleChange({ target: { name: "lecturer_id", value: opt ? opt.value : "" } })}
              placeholder="Pilih Dosen Pengampu..."
              isClearable
              isSearchable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              styles={selectStyles}
              className="text-sm text-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
              Nama Mata Kuliah <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              placeholder="Contoh: Filsafat Ilmu"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Kode (Opsional)
              </label>
              <Input
                type="text"
                name="code"
                placeholder="MKU-101"
                value={formData.code}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                className="flex h-10 sm:h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-white dark:bg-slate-900/70 px-3 text-sm text-[#1D1D1F] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500"
              >
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                SKS <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="sks"
                min="1"
                max="8"
                value={formData.sks}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Mata Kuliah"
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
              Ya, Hapus Mata Kuliah
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-400">
          Apakah Anda yakin ingin menghapus mata kuliah{" "}
          <span className="font-semibold text-[#1D1D1F] dark:text-slate-100">{deletingCourse?.name}</span>?
          Jadwal yang merujuk ke mata kuliah ini juga akan ikut terdampak.
        </p>
      </Modal>
    </div>
  );
}
