import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check roles based on ID or name. For now, assuming user.role_id maps to 'super_admin' (1) or 'admin_akademik' (2).
  // Ideally, user object from backend should return `role: { name: 'super_admin' }` or similar.
  // For safety, let's assume if it's admin routes, role_id must be 1 or 2.
  const isSuperAdmin = user.role_id === 1;
  const isAdminAkademik = user.role_id === 2;
  const isDosen = user.role_id === 3;

  const hasAccess = 
    (allowedRoles.includes('super_admin') && isSuperAdmin) || 
    (allowedRoles.includes('admin_akademik') && isAdminAkademik) ||
    (allowedRoles.includes('dosen') && isDosen);

  if (!hasAccess) {
    // If user is just a lecturer but trying to access admin
    if (isDosen) {
      return <Navigate to="/lecturer" replace />;
    }
    // Otherwise go to login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
