import api from './api';

export const featureService = {
  getLeaves: async () => {
    const res = await api.get('/leaves');
    return res.data;
  },
  submitLeave: async (data) => {
    const res = await api.post('/leaves', data);
    return res.data;
  },
  downloadLeaveDocument: async (id) => {
    return api.get(`/leaves/${id}/document`, { responseType: 'blob' });
  },
  isUploadedDocument: (item) => {
    if (!item) return false;
    if (item.has_uploaded_document) return true;
    const raw = typeof item.document_path === 'string' ? item.document_path.trim() : '';
    return raw !== '' && !/^https?:\/\//i.test(raw) && raw.startsWith('leave-documents/');
  },
  openLeaveDocument: async (item) => {
    const res = await api.get(`/leaves/${item.id}/document`, { responseType: 'blob' });
    const mimeType = res.headers?.['content-type'] || res.data?.type || 'application/octet-stream';
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);
    const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = item.document_path?.split('/').pop() || `dokumen-izin-${item.id}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  },
  getAnnouncements: async () => {
    const res = await api.get('/announcements');
    return res.data;
  },
  getSchedules: async () => {
    const res = await api.get('/schedules');
    return res.data;
  }
};
