import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  getAttendance: async (date = '') => {
    const url = date ? `/admin/attendance?date=${date}` : '/admin/attendance';
    const response = await api.get(url);
    return response.data;
  },

  getAttendanceDetails: async (lecturerId, month, year) => {
    let url = `/admin/attendance/${lecturerId}`;
    if (month && year) {
        url += `?month=${month}&year=${year}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  
  getReports: async (month, year) => {
    let url = '/admin/reports';
    if (month && year) {
        url += `?month=${month}&year=${year}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  exportReports: async (month, year) => {
    let url = '/admin/reports/export';
    if (month && year) {
        url += `?month=${month}&year=${year}`;
    }
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.post('/admin/settings', data);
    return response.data;
  },
  
  getCorrections: async () => {
    const response = await api.get('/admin/corrections');
    return response.data;
  },
  
  approveCorrection: async (id) => {
    const response = await api.post(`/admin/corrections/${id}/approve`);
    return response.data;
  },
  
  rejectCorrection: async (id) => {
    const response = await api.post(`/admin/corrections/${id}/reject`);
    return response.data;
  },
  
  getAuditLogs: async () => {
    const response = await api.get('/admin/audit-logs');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },


};
