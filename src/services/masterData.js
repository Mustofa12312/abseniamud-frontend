import api from './api';

export const masterDataService = {
  // Rooms
  getRooms: async () => {
    const response = await api.get('/admin/rooms');
    return response.data;
  },
  createRoom: async (data) => {
    const response = await api.post('/admin/rooms', data);
    return response.data;
  },
  updateRoom: async (id, data) => {
    const response = await api.put(`/admin/rooms/${id}`, data);
    return response.data;
  },
  deleteRoom: async (id) => {
    const response = await api.delete(`/admin/rooms/${id}`);
    return response.data;
  },

  // Faculties
  getFaculties: async () => {
    const response = await api.get('/admin/faculties');
    return response.data;
  },
  createFaculty: async (data) => {
    const response = await api.post('/admin/faculties', data);
    return response.data;
  },
  updateFaculty: async (id, data) => {
    const response = await api.put(`/admin/faculties/${id}`, data);
    return response.data;
  },
  deleteFaculty: async (id) => {
    const response = await api.delete(`/admin/faculties/${id}`);
    return response.data;
  },

  // Courses
  getCourses: async (facultyId = null, semester = null) => {
    let url = '/admin/courses';
    const params = [];
    if (facultyId) params.push(`faculty_id=${facultyId}`);
    if (semester) params.push(`semester=${semester}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await api.get(url);
    return response.data;
  },
  createCourse: async (data) => {
    const response = await api.post('/admin/courses', data);
    return response.data;
  },
  updateCourse: async (id, data) => {
    const response = await api.put(`/admin/courses/${id}`, data);
    return response.data;
  },
  deleteCourse: async (id) => {
    const response = await api.delete(`/admin/courses/${id}`);
    return response.data;
  },

  // Academic Years
  getAcademicYears: async () => {
    const response = await api.get('/admin/academic-years');
    return response.data;
  },
  getActiveAcademicYear: async () => {
    const response = await api.get('/admin/academic-years/active');
    return response.data;
  },
  createAcademicYear: async (data) => {
    const response = await api.post('/admin/academic-years', data);
    return response.data;
  },
  updateAcademicYear: async (id, data) => {
    const response = await api.put(`/admin/academic-years/${id}`, data);
    return response.data;
  },
  deleteAcademicYear: async (id) => {
    const response = await api.delete(`/admin/academic-years/${id}`);
    return response.data;
  }
};
