import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import AuthLayout from "./layouts/AuthLayout"
import Login from "./pages/auth/Login"
import LecturerLayout from "./layouts/LecturerLayout"
import LecturerDashboard from "./pages/dashboard/LecturerDashboard"
import LecturerHistory from "./pages/dashboard/LecturerHistory"
import LecturerProfile from "./pages/dashboard/LecturerProfile"
import AdminLayout from "./layouts/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import Monitoring from "./pages/admin/Monitoring"
import LocationMaster from "./pages/admin/LocationMaster"
import RoomMaster from "./pages/admin/RoomMaster"
import FacultyMaster from "./pages/admin/FacultyMaster"
import CourseMaster from "./pages/admin/CourseMaster"

import LecturerMaster from "./pages/admin/LecturerMaster"
import ReportMaster from "./pages/admin/ReportMaster"
import ScheduleMaster from "./pages/admin/ScheduleMaster"
import SystemSettings from "./pages/admin/SystemSettings"
import LecturerCorrection from "./pages/dashboard/LecturerCorrection"
import CorrectionMaster from "./pages/admin/CorrectionMaster"
import AuditLogMaster from "./pages/admin/AuditLogMaster"
import UserMaster from "./pages/admin/UserMaster"

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          {/* Lecturer Routes */}
          <Route path="/lecturer" element={<LecturerLayout />}>
            <Route index element={<LecturerDashboard />} />
            <Route path="history" element={<LecturerHistory />} />
            <Route path="profile" element={<LecturerProfile />} />
            <Route path="corrections" element={<LecturerCorrection />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="users" element={<UserMaster />} />
            <Route path="locations" element={<LocationMaster />} />
            <Route path="rooms" element={<RoomMaster />} />
            <Route path="faculties" element={<FacultyMaster />} />
            <Route path="courses" element={<CourseMaster />} />
            <Route path="lecturers" element={<LecturerMaster />} />
            <Route path="schedules" element={<ScheduleMaster />} />
            <Route path="reports" element={<ReportMaster />} />
            <Route path="corrections" element={<CorrectionMaster />} />
            <Route path="audit-logs" element={<AuditLogMaster />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
