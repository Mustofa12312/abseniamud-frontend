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
  
  getLocations: async () => {
    const response = await api.get('/admin/locations');
    return response.data;
  },
  
  getLecturers: async () => {
    const response = await api.get('/admin/lecturers');
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
  
  getSchedules: async () => {
    const response = await api.get('/admin/schedules');
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
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Koreksi berhasil disetujui." }), 500));
  },
  
  rejectCorrection: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Koreksi berhasil ditolak." }), 500));
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
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Pengguna berhasil ditambahkan", data: { id: Date.now(), ...data } }), 500));
  },

  updateUser: async (id, data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Pengguna berhasil diperbarui", data: { id, ...data } }), 500));
  },

  deleteUser: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Pengguna berhasil dihapus" }), 500));
  },

  // Mock implementations for features without backend endpoints yet
  createLocation: async (data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Lokasi berhasil ditambahkan", data: { id: Date.now(), ...data, status: "Aktif" } }), 500));
  },
  updateLocation: async (id, data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Lokasi berhasil diperbarui", data: { id, ...data } }), 500));
  },
  deleteLocation: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Lokasi berhasil dihapus" }), 500));
  },
  
  createLecturer: async (data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Dosen berhasil ditambahkan", data: { id: Date.now(), ...data, status: "Aktif" } }), 500));
  },
  updateLecturer: async (id, data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Dosen berhasil diperbarui", data: { id, ...data } }), 500));
  },
  deleteLecturer: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Dosen berhasil dihapus" }), 500));
  },
  
  createSchedule: async (data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Jadwal berhasil ditambahkan", data: { id: Date.now(), ...data, status: "Aktif" } }), 500));
  },
  updateSchedule: async (id, data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Jadwal berhasil diperbarui", data: { id, ...data } }), 500));
  },
  deleteSchedule: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Jadwal berhasil dihapus" }), 500));
  },

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
