import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { ShieldCheck, Clock, Activity, User, Monitor } from "lucide-react"
import { adminService } from "../../services/admin"

export default function AuditLogMaster() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminService.getAuditLogs()
        if (res.success) {
          setLogs(res.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const getActionColor = (action) => {
    if (action.includes('APPROVE')) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (action.includes('REJECT') || action.includes('DELETE')) return 'text-rose-600 bg-rose-50 border-rose-200'
    if (action.includes('UPDATE')) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-brand-600 bg-brand-50 border-brand-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Audit Log <ShieldCheck className="text-emerald-500" />
          </h2>
          <p className="text-slate-500 mt-1">Rekam jejak forensik dari setiap perubahan krusial di sistem.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
          <CardTitle className="text-lg flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Activity size={18} className="text-slate-500" /> Riwayat Aktivitas
            </span>
            <Badge variant="outline" className="bg-white">{logs.length} Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Menarik data dari database...</div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-start gap-4">
                  
                  {/* Timestamp & IP Column */}
                  <div className="md:w-48 shrink-0 space-y-2">
                    <p className="font-semibold text-sm text-slate-700 flex items-center gap-1.5">
                      <Clock size={14} className="text-brand-500"/> {log.created_at.split(' ')[0]}
                    </p>
                    <p className="text-xs text-slate-500 pl-5">{log.created_at.split(' ')[1]}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono bg-slate-100 w-fit px-1.5 py-0.5 rounded mt-2">
                      <Monitor size={10} /> {log.ip_address || '127.0.0.1'}
                    </p>
                  </div>

                  {/* Log Details Column */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <User size={14} className="text-slate-400" /> {log.admin_name}
                      </span>
                      <span className="text-slate-300">melakukan</span>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </div>
                    
                    <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm text-sm">
                      <p className="text-slate-700 font-medium mb-1 border-b border-slate-50 pb-1">
                        Target: <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600">{log.target}</span>
                      </p>
                      {log.details && (
                        <div className="mt-2 text-xs text-slate-500 font-mono overflow-x-auto">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <ShieldCheck size={48} className="text-slate-200 mb-3" />
              <p>Belum ada rekaman aktivitas keamanan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
