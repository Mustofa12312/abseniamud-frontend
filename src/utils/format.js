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

/**
 * Strip enclosing matching quotes from a CSV cell.
 */
function cleanCsvCell(cell) {
  return String(cell ?? '').trim().replace(/^["']|["']$/g, '');
}

/**
 * Parse raw CSV/TSV text into headers and sample rows for previewing imports.
 * Returns null if the input contains no non-empty rows.
 */
export function parseCsvPreview(text, maxRows = 5) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;

  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semiCount >= commaCount && semiCount > 0 ? ';' : ',';

  const headers = firstLine.split(delimiter).map(cleanCsvCell);
  const dataLines = lines.slice(1);
  const rows = dataLines.slice(0, maxRows).map((line) =>
    line.split(delimiter).map(cleanCsvCell)
  );

  return {
    headers,
    rows,
    totalRows: dataLines.length,
    delimiter,
  };
}

/**
 * Inspect a Blob returned from Axios: if the server actually returned a JSON error payload,
 * extract its `message` field and throw an Error.
 */
export async function assertNotJsonBlob(blob, fallbackMessage = 'Gagal memproses berkas.') {
  if (blob && typeof blob.type === 'string' && blob.type.includes('json') && typeof blob.text === 'function') {
    const rawText = await blob.text();
    let parsedMessage = fallbackMessage;
    try {
      const json = JSON.parse(rawText);
      if (json?.message) parsedMessage = json.message;
    } catch {
      // Ignore invalid JSON payloads and throw fallback message.
    }
    throw new Error(parsedMessage);
  }
}

/**
 * Trigger a browser download for a Blob or string payload.
 */
export function triggerBlobDownload(data, filename, mimeType = 'text/csv;charset=utf-8;', addUtf8Bom = false) {
  const payload = addUtf8Bom && typeof data === 'string' && !data.startsWith('\uFEFF') ? `\uFEFF${data}` : data;
  const blob = payload instanceof Blob ? payload : new Blob([payload], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 500);
}
