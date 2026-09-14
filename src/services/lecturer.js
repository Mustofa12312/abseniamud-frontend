import api from './api';

export const lecturerService = {
  getLecturers: async () => {
    const response = await api.get('/admin/lecturers');
    return response.data;
  },
  
  createLecturer: async (data) => {
    const response = await api.post('/admin/lecturers', data);
    return response.data;
  },
  
  updateLecturer: async (id, data) => {
    const response = await api.put(`/admin/lecturers/${id}`, data);
    return response.data;
  },
  
  deleteLecturer: async (id) => {
    const response = await api.delete(`/admin/lecturers/${id}`);
    return response.data;
  }
};
