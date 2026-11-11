import { useState, useEffect } from "react";
import { ShieldCheck, Clock, Activity, User, Monitor, Search } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { adminService } from "../../services/admin";

export default function AuditLogMaster() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const itemsPerPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });

    const params = {
      page: currentPage,
      per_page: itemsPerPage,
    };
    if (actionFilter !== "ALL") {
      params.action = actionFilter;
    }
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    adminService
      .getAuditLogs(params)
      .then((res) => {
        if (!cancelled && res.success) {
          const list = res.data || [];
          setLogs(list);
          setMeta({
            current_page: res.meta?.current_page ?? currentPage,
            last_page: res.meta?.last_page ?? 1,
            per_page: res.meta?.per_page ?? itemsPerPage,
            total: res.meta?.total ?? list.length,
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
  }, [currentPage, actionFilter, debouncedSearch]);

  const getActionVariant = (action = "") => {
    if (action.includes("APPROVE") || action.includes("CREATE")) return "success";
    if (action.includes("REJECT") || action.includes("DELETE")) return "danger";
    if (action.includes("UPDATE") || action.includes("RESET")) return "warning";
    return "info";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Rekam jejak forensik dari setiap perubahan krusial pada sistem."
        badge={<ShieldCheck size={18} className="text-emerald-600" />}
      />

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-64">
          <Input
            icon={Search}
            placeholder="Cari admin, aksi, atau target..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["ALL", "Semua"],
            ["APPROVE", "Setujui"],
            ["REJECT", "Tolak"],
            ["DELETE", "Hapus"],
            ["UPDATE", "Update"],
            ["CREATE", "Buat"],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setActionFilter(val);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                actionFilter === val
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-[#F5F5F7] dark:bg-slate-800 text-[#86868B] dark:text-slate-300 hover:bg-[#E8E8ED]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-slate-900/50 border-b border-[#E5E5EA] dark:border-slate-700/60 flex justify-between items-center">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Activity size={16} className="text-emerald-600" /> Riwayat Aktivitas
          </span>
          <Badge>{meta.total} Data</Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#86868B] animate-pulse">Menarik rekam jejak sistem...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Log Kosong"
            description="Belum ada rekaman aktivitas keamanan yang cocok."
          />
        ) : (
          <>
            <div className="divide-y divide-[#F2F2F7] dark:divide-slate-700/50">
              {logs.map((log) => {
                const [datePart, timePart] = String(log.created_at || "").split(" ");
                return (
                  <div
                    key={log.id}
                    className="p-5 hover:bg-[#F9F9FB] dark:hover:bg-slate-700/25 transition-colors flex flex-col md:flex-row md:items-start gap-4"
                  >
                    <div className="md:w-44 shrink-0 space-y-1">
                      <p className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                        <Clock size={13} className="text-emerald-600" /> {datePart || "-"}
                      </p>
                      <p className="text-xs text-[#86868B] dark:text-slate-400 pl-5">{timePart || ""}</p>
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400 flex items-center gap-1 font-mono bg-[#F5F5F7] dark:bg-slate-900/60 w-fit px-2 py-0.5 rounded-md mt-1">
                        <Monitor size={10} /> {log.ip_address || "127.0.0.1"}
                      </p>
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <User size={13} className="text-[#86868B]" /> {log.admin_name}
                        </span>
                        <span className="text-xs text-[#86868B]">melakukan</span>
                        <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                      </div>

                      <div className="bg-[#F9F9FB] dark:bg-slate-900/60 border border-[#E5E5EA] dark:border-slate-700/60 rounded-xl p-3 text-xs">
                        <p className="font-medium pb-1.5 border-b border-[#E5E5EA]/70 dark:border-slate-700/50">
                          Target:{" "}
                          <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-[#E5E5EA] dark:border-slate-700">
                            {log.target}
                          </span>
                        </p>
                        {log.details && (
                          <div className="mt-2 text-[#86868B] dark:text-slate-300 font-mono overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              from={meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0}
              to={Math.min(meta.current_page * meta.per_page, meta.total)}
              onPageChange={setCurrentPage}
              itemLabel="log"
            />
          </>
        )}
      </Card>
    </div>
  );
}
