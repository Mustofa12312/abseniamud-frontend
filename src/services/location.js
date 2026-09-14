import api from './api';

export const locationService = {
  getLocations: async () => {
    const response = await api.get('/admin/locations');
    return response.data;
  },
  
  createLocation: async (data) => {
    const response = await api.post('/admin/locations', data);
    return response.data;
  },
  
  updateLocation: async (id, data) => {
    const response = await api.put(`/admin/locations/${id}`, data);
    return response.data;
  },
  
  deleteLocation: async (id) => {
    const response = await api.delete(`/admin/locations/${id}`);
    return response.data;
  }
};
