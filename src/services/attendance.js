import api from './api';

export const attendanceService = {
  getTodayStatus: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },
  
  checkIn: async (coords) => {
    const response = await api.post('/attendance/check-in', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy
    });
    return response.data;
  },
  
  checkOut: async (coords) => {
    const response = await api.post('/attendance/check-out', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy
    });
    return response.data;
  },
  
  getHistory: async (month, year) => {
    const response = await api.get('/attendance/history', {
      params: { month, year }
    });
    return response.data;
  },

  submitCorrection: async (data) => {
    const response = await api.post('/attendance/corrections', data);
    return response.data;
  },

  getCorrections: async () => {
    const response = await api.get('/attendance/corrections');
    return response.data;
  }
};
