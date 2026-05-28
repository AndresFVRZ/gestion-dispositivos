import api from './api';

export const getHistorial = async (params = {}) => {
  return await api.get('/historial', { params });
};