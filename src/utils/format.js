/**
 * Shared formatting and safe URL/document helpers.
 */

const FILE_EXT_REGEX = /\.(pdf|png|jpe?g|webp|gif|docx?|xlsx?|txt)$/i;

/**
 * Resolve API origin without trailing `/api` for serving `/storage/*` files.
 */
export function getStorageBaseUrl(apiUrl) {
  const raw = apiUrl || 'http://localhost:8000/api';
  return raw.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
}

/**
 * Classify a leave `document_path` returned by the API into either:
 * - null (no attachment)
 * - `{ type: 'url', href, label }` (external URL or uploaded file under `/storage/`)
 * - `{ type: 'reference', text }` (plain letter/reference text typed manually)
 */
export function resolveLeaveDocument(documentPath, apiUrl) {
  if (!documentPath || typeof documentPath !== 'string') return null;
  const trimmed = documentPath.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return { type: 'url', href: trimmed, label: 'Buka Tautan Dokumen' };
  }

  if (trimmed.startsWith('/storage/') || trimmed.includes('/') || FILE_EXT_REGEX.test(trimmed)) {
    const base = getStorageBaseUrl(apiUrl);
    const cleanPath = trimmed.replace(/^\/+/, '');
    const href = cleanPath.startsWith('storage/') ? `${base}/${cleanPath}` : `${base}/storage/${cleanPath}`;
    return { type: 'url', href, label: 'Lihat Lampiran' };
  }

  return { type: 'reference', text: trimmed };
}

/**
 * Guard against infinite reload loops if a 401 happens while already on `/login`.
 */
export function shouldRedirectOnUnauthorized(pathname) {
  return Boolean(pathname && pathname !== '/login');
}

/**
 * Format ISO or YYYY-MM-DD date cleanly in Indonesian locale.
 */
export function formatDateId(dateInput, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('id-ID', options);
}
