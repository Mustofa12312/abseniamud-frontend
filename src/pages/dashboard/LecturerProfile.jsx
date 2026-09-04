import { User, Mail, Hash, Phone, LogOut } from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { useAuth } from "../../contexts/AuthContext"

export default function LecturerProfile() {
  const { user, logout } = useAuth()
  
  // Extract lecturer details from relations if they exist
  const lecturerData = user?.lecturer || {}

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-400 to-teal-500 flex items-center justify-center shadow-lg border-4 border-white mb-4">
          <span className="font-bold text-white text-3xl">{user?.name?.charAt(0) || 'D'}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name || 'Nama Dosen'}</h1>
        <p className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm mt-2 font-medium">Dosen Tetap</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Email Akun</p>
                <p className="font-medium text-slate-800">{user?.email || '-'}</p>
              </div>
            </div>
            
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Hash size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">NIDN</p>
                <p className="font-medium text-slate-800">{lecturerData.nidn || '-'}</p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Hash size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">NIP</p>
                <p className="font-medium text-slate-800">{lecturerData.nip || '-'}</p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">No. Telepon</p>
                <p className="font-medium text-slate-800">{lecturerData.phone || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full h-14 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
          onClick={logout}
        >
          <LogOut size={18} className="mr-2" /> Keluar Aplikasi
        </Button>
      </div>
    </div>
  )
}
