import api from './api';

export const scheduleService = {
  // Schedules
  getSchedules: async () => {
    const response = await api.get('/admin/schedules');
    return response.data;
  },
  createSchedule: async (data) => {
    const response = await api.post('/admin/schedules', data);
    return response.data;
  },
  updateSchedule: async (id, data) => {
    const response = await api.put(`/admin/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id) => {
    const response = await api.delete(`/admin/schedules/${id}`);
    return response.data;
  },
  exportSchedules: async (academicYearId = null) => {
    const url = academicYearId ? `/admin/schedules/export?academic_year_id=${academicYearId}` : '/admin/schedules/export';
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },
  importSchedules: async (formData) => {
    const response = await api.post('/admin/schedules/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  downloadScheduleTemplate: async () => {
    const response = await api.get('/admin/schedules/template', { responseType: 'blob' });
    return response.data;
  },

  // Positions
  getPositions: async () => {
    const response = await api.get('/admin/positions');
    return response.data;
  },
  createPosition: async (data) => {
    const response = await api.post('/admin/positions', data);
    return response.data;
  },
  updatePosition: async (id, data) => {
    const response = await api.put(`/admin/positions/${id}`, data);
    return response.data;
  },
  deletePosition: async (id) => {
    const response = await api.delete(`/admin/positions/${id}`);
    return response.data;
  },

  // Assignments
  getAssignments: async (lecturerId = null) => {
    const url = lecturerId ? `/admin/assignments?lecturer_id=${lecturerId}` : '/admin/assignments';
    const response = await api.get(url);
    return response.data;
  },
  createAssignment: async (data) => {
    const response = await api.post('/admin/assignments', data);
    return response.data;
  },
  updateAssignment: async (id, data) => {
    const response = await api.put(`/admin/assignments/${id}`, data);
    return response.data;
  },
  deleteAssignment: async (id) => {
    const response = await api.delete(`/admin/assignments/${id}`);
    return response.data;
  }
};
