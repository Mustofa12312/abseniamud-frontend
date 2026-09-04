import { useState, useEffect } from "react"
import { MapPin, Clock, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Card, CardContent } from "../../components/ui/Card"
import { useAuth } from "../../contexts/AuthContext"
import { useGeolocation } from "../../hooks/useGeolocation"
import { attendanceService } from "../../services/attendance"

export default function LecturerDashboard() {
  const [time, setTime] = useState(new Date())
  const { user } = useAuth()
  const { coordinates, loading: locationLoading, error: locationError, requestLocation } = useGeolocation()
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCheckIn = async () => {
    try {
      setAttendanceLoading(true)
      setStatusMessage("")
      
      const coords = await requestLocation()
      const res = await attendanceService.checkIn(coords)
      
      if (res.success) {
        setStatusMessage("Check-in Berhasil!")
        // Update local state if needed
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setStatusMessage(err.response.data.message)
      } else if (typeof err === 'string') {
        setStatusMessage(err) // From useGeolocation
      } else {
        setStatusMessage("Gagal melakukan Check-in.")
      }
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleCheckOut = async () => {
    // Similar logic for check out
    try {
      setAttendanceLoading(true)
      setStatusMessage("")
      
      const coords = await requestLocation()
      const res = await attendanceService.checkOut(coords)
      
      if (res.success) {
        setStatusMessage("Check-out Berhasil!")
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setStatusMessage(err.response.data.message)
      } else if (typeof err === 'string') {
        setStatusMessage(err) // From useGeolocation
      } else {
        setStatusMessage("Gagal melakukan Check-out.")
      }
    } finally {
      setAttendanceLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for bottom nav space */}
      {/* Header Profile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Halo, {user?.name || 'Dosen'}</h1>
          <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm">
            <Calendar size={14} /> 
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center border-2 border-brand-200">
          <span className="font-bold text-brand-700 text-lg">{user?.name?.charAt(0) || 'D'}</span>
        </div>
      </div>

      {/* Clock Display */}
      <Card className="bg-gradient-to-br from-brand-600 to-teal-700 border-0 shadow-lg shadow-brand-900/20 text-white overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] rounded-full bg-white/10 blur-[40px]" />
        
        <CardContent className="p-6 relative z-10 flex flex-col items-center justify-center min-h-[160px]">
          <p className="text-brand-100 text-sm mb-1 font-medium tracking-wider uppercase">Waktu Saat Ini</p>
          <div className="text-5xl font-bold tracking-tighter tabular-nums drop-shadow-sm">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <MapPin size={14} className="text-teal-200" />
            <span className="text-teal-50">{coordinates ? `Lokasi Terbaca (Akurasi ${Math.round(coordinates.accuracy)}m)` : 'Menunggu Lokasi...'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {statusMessage && (
         <div className={`p-4 rounded-xl text-sm font-medium ${statusMessage.includes('Berhasil') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
           {statusMessage}
         </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          size="lg" 
          className="h-24 flex flex-col gap-2 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
          onClick={handleCheckIn}
          disabled={attendanceLoading || locationLoading}
        >
          {attendanceLoading || locationLoading ? (
            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
          ) : (
            <CheckCircle2 size={28} className="opacity-90" />
          )}
          <span className="font-semibold text-base tracking-wide">MASUK</span>
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="h-24 flex flex-col gap-2 rounded-2xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all active:scale-95"
          onClick={handleCheckOut}
          disabled={attendanceLoading || locationLoading}
        >
          {attendanceLoading || locationLoading ? (
             <div className="w-6 h-6 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin"></div>
          ) : (
            <XCircle size={28} className="opacity-90" />
          )}
          <span className="font-semibold text-base tracking-wide">PULANG</span>
        </Button>
      </div>
    </div>
  )
}
