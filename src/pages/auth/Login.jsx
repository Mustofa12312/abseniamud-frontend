import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { useAuth } from "../../contexts/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await login(email, password)
      
      if (response.success) {
        // Arahkan berdasarkan role (contoh 1: super_admin, 2: dosen)
        if (response.data.user.role_id === 1) {
          navigate("/admin")
        } else {
          navigate("/lecturer")
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        // Validation errors
        const firstError = Object.values(err.response.data.errors)[0][0]
        setError(firstError)
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError("Koneksi ke server gagal.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-brand-900 overflow-hidden">
        {/* Dekorasi Latar Belakang Geometris/Gradient (sama seperti sebelumnya) */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/30 blur-[100px]" />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 shadow-brand-900/50">
            <span className="text-2xl font-bold text-brand-600">IAIMU</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Selamat Datang</h1>
          <p className="text-brand-100">Sistem Presensi Geofencing</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-teal-400"></div>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-slate-800">Masuk Akun</CardTitle>
            <CardDescription className="text-slate-500">
              Silakan masukkan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email atau NIDN</label>
                <Input
                  type="text"
                  placeholder="ahmad@iaimu.ac.id"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-2" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    Memproses...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={18} /> Masuk
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-brand-200 text-sm">
          &copy; 2026 Institut Agama Islam Miftahul Ulum
        </p>
      </div>
    </div>
  )
}
