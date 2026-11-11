import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import LecturerLayout from "./layouts/LecturerLayout";
import AdminLayout from "./layouts/AdminLayout";
import { ACADEMIC_ADMIN_ROLES, ADMIN_ROLES } from "./utils/rbac";

const Login = lazy(() => import("./pages/auth/Login"));

// Lecturer / Tendik Portal Pages
const LecturerDashboard = lazy(() => import("./pages/dashboard/LecturerDashboard"));
const LecturerHistory = lazy(() => import("./pages/dashboard/LecturerHistory"));
const LecturerProfile = lazy(() => import("./pages/dashboard/LecturerProfile"));
const LecturerCorrection = lazy(() => import("./pages/dashboard/LecturerCorrection"));
const LecturerLeave = lazy(() => import("./pages/dashboard/LecturerLeave"));
const LecturerSchedule = lazy(() => import("./pages/dashboard/LecturerSchedule"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Monitoring = lazy(() => import("./pages/admin/Monitoring"));
const LocationMaster = lazy(() => import("./pages/admin/LocationMaster"));
const RoomMaster = lazy(() => import("./pages/admin/RoomMaster"));
const AcademicYearMaster = lazy(() => import("./pages/admin/AcademicYearMaster"));
const FacultyMaster = lazy(() => import("./pages/admin/FacultyMaster"));
const CourseMaster = lazy(() => import("./pages/admin/CourseMaster"));
const LecturerMaster = lazy(() => import("./pages/admin/LecturerMaster"));
const PositionMaster = lazy(() => import("./pages/admin/PositionMaster"));
const AssignmentMaster = lazy(() => import("./pages/admin/AssignmentMaster"));
const ReportMaster = lazy(() => import("./pages/admin/ReportMaster"));
const ScheduleMaster = lazy(() => import("./pages/admin/ScheduleMaster"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const CorrectionMaster = lazy(() => import("./pages/admin/CorrectionMaster"));
const AuditLogMaster = lazy(() => import("./pages/admin/AuditLogMaster"));
const UserMaster = lazy(() => import("./pages/admin/UserMaster"));
const StaffMaster = lazy(() => import("./pages/admin/StaffMaster"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminLeaves = lazy(() => import("./pages/admin/AdminLeaves"));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-[#86868B]">
      <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      <span className="text-xs font-medium">Memuat halaman...</span>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Lecturer & Tendik Routes */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin_akademik', 'dosen', 'tendik']} />}>
                <Route path="/lecturer" element={<LecturerLayout />}>
                  <Route index element={<LecturerDashboard />} />
                  <Route path="history" element={<LecturerHistory />} />
                  <Route path="profile" element={<LecturerProfile />} />
                  <Route path="corrections" element={<LecturerCorrection />} />
                  <Route path="leaves" element={<LecturerLeave />} />
                  <Route path="schedules" element={<LecturerSchedule />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  {/* Shared Admin & Admin Keuangan routes */}
                  <Route index element={<AdminDashboard />} />
                  <Route path="reports" element={<ReportMaster />} />

                  {/* Super Admin & Admin Akademik restricted routes */}
                  <Route element={<ProtectedRoute allowedRoles={ACADEMIC_ADMIN_ROLES} />}>
                    <Route path="monitoring" element={<Monitoring />} />
                    <Route path="users" element={<UserMaster />} />
                    <Route path="academic-years" element={<AcademicYearMaster />} />
                    <Route path="locations" element={<LocationMaster />} />
                    <Route path="rooms" element={<RoomMaster />} />
                    <Route path="faculties" element={<FacultyMaster />} />
                    <Route path="courses" element={<CourseMaster />} />
                    <Route path="lecturers" element={<LecturerMaster />} />
                    <Route path="staff" element={<StaffMaster />} />
                    <Route path="positions" element={<PositionMaster />} />
                    <Route path="assignments" element={<AssignmentMaster />} />
                    <Route path="schedules" element={<ScheduleMaster />} />
                    <Route path="corrections" element={<CorrectionMaster />} />
                    <Route path="audit-logs" element={<AuditLogMaster />} />
                    <Route path="settings" element={<SystemSettings />} />
                    <Route path="announcements" element={<AdminAnnouncements />} />
                    <Route path="leaves" element={<AdminLeaves />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
