/**
 * Centralized Role-Based Access Control (RBAC) helpers shared across routes,
 * layouts, and UI components.
 */

export const ADMIN_ROLES = ['super_admin', 'admin_akademik', 'admin_keuangan'];
export const ACADEMIC_ADMIN_ROLES = ['super_admin', 'admin_akademik'];
export const PORTAL_ROLES = ['dosen', 'tendik'];

/**
 * Resolve canonical role name from backend user object (prefers string `role`,
 * falls back cleanly to legacy numeric `role_id`).
 */
export function resolveUserRole(user) {
  if (!user) return null;
  if (typeof user.role === 'string' && user.role.trim() !== '') {
    return user.role.trim();
  }
  if (user.role && typeof user.role === 'object' && user.role.name) {
    return String(user.role.name).trim();
  }

  const roleId = parseInt(user.role_id, 10);
  // Canonical database IDs (DatabaseSeeder):
  // 1 = super_admin, 2 = dosen, 3 = tendik, 4 = admin_akademik, 5 = admin_keuangan
  if (roleId === 1) return 'super_admin';
  if (roleId === 2) return 'dosen';
  if (roleId === 3) return 'tendik';
  if (roleId === 4) return 'admin_akademik';
  if (roleId === 5) return 'admin_keuangan';

  // Profile-based fallbacks if role relation was omitted
  if (user.staff_profile || user.staffProfile) return 'tendik';
  if (user.lecturer) return 'dosen';

  return null;
}

export function isAdminRole(user) {
  const role = resolveUserRole(user);
  return ADMIN_ROLES.includes(role);
}

export function isAcademicAdmin(user) {
  const role = resolveUserRole(user);
  return ACADEMIC_ADMIN_ROLES.includes(role);
}

export function isPortalRole(user) {
  const role = resolveUserRole(user);
  return PORTAL_ROLES.includes(role);
}

/**
 * Check whether `user` is permitted for any role listed in `allowedRoles`.
 * Notice `tendik` accounts may also enter portal routes alongside `dosen`.
 */
export function hasRoleAccess(user, allowedRoles = []) {
  const role = resolveUserRole(user);
  if (!role) return false;

  if (allowedRoles.includes(role)) {
    return true;
  }

  // Legacy support: portal routes declared with ['dosen'] also allow tendik
  if (allowedRoles.includes('dosen') && role === 'tendik') {
    return true;
  }

  return false;
}

/**
 * Default landing route after login or unauthorized sub-route redirect.
 */
export function getDefaultRouteForUser(user) {
  if (isAdminRole(user)) return '/admin';
  if (isPortalRole(user)) return '/lecturer';
  return '/login';
}

/**
 * Human-readable Indonesian role label for headers, badges, and profiles.
 */
export function getRoleDisplayLabel(user) {
  const role = resolveUserRole(user);
  const hasLecturer = Boolean(user?.lecturer);
  const hasStaff = Boolean(user?.staff_profile);

  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin_akademik') return 'Admin Akademik';
  if (role === 'admin_keuangan') return 'Admin Keuangan';
  if (hasLecturer && hasStaff) return 'Dosen & Tendik';
  if (role === 'tendik' || (hasStaff && !hasLecturer)) return 'Tenaga Kependidikan';
  if (role === 'dosen' || hasLecturer) return 'Dosen Tetap';
  return 'Pengguna';
}

