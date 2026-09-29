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

  // Use role name from backend (preferred) — fallback to role_id for legacy sessions
  const roleName = user.role || null;
  const roleId   = parseInt(user.role_id, 10);

  // Determine role from name first, then fallback to ID-based detection
  const isSuperAdmin   = roleName === 'super_admin'   || roleId === 1;
  const isAdminAkademik= roleName === 'admin_akademik' || roleId === 2;
  const isDosen        = roleName === 'dosen';
  const isTendik       = roleName === 'tendik';

  // Legacy: if no role name, treat role_id 3 as dosen
  const isDosenOrTendik = isDosen || isTendik || (!roleName && roleId === 3);

  const hasAccess =
    (allowedRoles.includes('super_admin')    && isSuperAdmin)    ||
    (allowedRoles.includes('admin_akademik') && isAdminAkademik) ||
    (allowedRoles.includes('dosen')          && isDosenOrTendik) ||
    (allowedRoles.includes('tendik')         && isTendik);

  if (!hasAccess) {
    // Redirect dosen / tendik to their own portal
    if (isDosenOrTendik) {
      return <Navigate to="/lecturer" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
