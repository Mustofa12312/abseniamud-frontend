import { useState, useEffect } from "react";
import { Clock, BookOpen, MapPin, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { scheduleService } from "../../services/schedule";

const DAY_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAY_BADGE = {
  Senin: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/50 text-blue-700 dark:text-blue-400",
  Selasa: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-800/50 text-purple-700 dark:text-purple-400",
  Rabu: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400",
  Kamis: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50 text-amber-700 dark:text-amber-400",
  Jumat: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50 text-rose-700 dark:text-rose-400",
  Sabtu: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
  Minggu: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400",
};

export default function LecturerSchedule() {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    scheduleService
      .getSchedules()
      .then((res) => {
        if (!cancelled && res.success) {
          setSchedules(res.data || {});
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

  const allSchedules = DAY_ORDER.flatMap((day) => (schedules[day] || []).map((s) => ({ ...s, day })));
  const totalMatkul = allSchedules.length;
  const totalSKS = allSchedules.reduce((sum, s) => sum + (Number(s.sks) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Jadwal Mengajar" description="Jadwal mata kuliah semester aktif Anda" />

      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Total Sesi Mengajar</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalMatkul}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 pt-4">
              <p className="text-xs font-medium text-[#86868B] dark:text-slate-400">Total SKS</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalSKS}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      ) : allSchedules.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Belum Ada Jadwal"
            description="Belum ada jadwal mengajar yang ditugaskan untuk Anda."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {DAY_ORDER.filter((day) => schedules[day]?.length > 0).map((day) => (
            <Card key={day} className="overflow-hidden">
              <CardHeader className="py-3.5 px-5 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60">
                <CardTitle className="text-sm flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DAY_BADGE[day]}`}>
                    {day}
                  </span>
                  <span className="text-xs font-normal text-[#86868B] dark:text-slate-400">
                    {schedules[day].length} sesi
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-0 divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
                {schedules[day].map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 sm:px-5 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/25 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div>
                      <h3 className="font-semibold text-sm">{item.course_name}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-[#86868B] dark:text-slate-400 mt-1">
                        {item.room_name && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {item.room_name}
                          </span>
                        )}
                        {Boolean(item.sks) && (
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} /> {item.sks} SKS
                          </span>
                        )}
                        {item.faculty_name && (
                          <span>
                            {item.faculty_name}
                            {item.semester ? ` (Smt ${item.semester})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
                      <Clock size={11} /> {item.start_time} – {item.end_time}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
