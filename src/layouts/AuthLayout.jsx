import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-brand-900 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/30 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
