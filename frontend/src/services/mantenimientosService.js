import api from './api';

export const getMantenimientos = (params = {}) => api.get('/mantenimientos', { params });
export const crearMantenimiento = (data)          => api.post('/mantenimientos', data);
export const actualizarMantenimiento = (id, data) => api.put(`/mantenimientos/${id}`, data);
export const eliminarMantenimiento = (id)         => api.delete(`/mantenimientos/${id}`);
export const completarMantenimiento = (id, data)  => api.post(`/mantenimientos/${id}/completar`, data);
export const aprobarMantenimiento = (id, data)    => api.post(`/mantenimientos/${id}/aprobar`, data);
export const rechazarMantenimiento = (id, data)   => api.post(`/mantenimientos/${id}/rechazar`, data);
