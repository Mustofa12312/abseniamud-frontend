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
  getAnnouncements: async () => {
    const res = await api.get('/announcements');
    return res.data;
  },
  getSchedules: async () => {
    const res = await api.get('/schedules');
    return res.data;
  }
};
