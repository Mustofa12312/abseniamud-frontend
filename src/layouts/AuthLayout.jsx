import { Outlet } from "react-router-dom"
import { motion } from "framer-motion"

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-200/50 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brand-300/30 blur-[120px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
            {/* Placeholder Logo */}
            <span className="text-white font-bold text-2xl">IA</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            IAIMU Attendance
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sistem Presensi Terintegrasi
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Outlet />
      </div>
    </div>
  )
}
