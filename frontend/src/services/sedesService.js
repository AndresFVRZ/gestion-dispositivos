import api from './api';

export const getSedes      = ()        => api.get('/sedes');
export const crearSede     = (data)    => api.post('/sedes', data);
export const actualizarSede = (id, data) => api.put(`/sedes/${id}`, data);
export const eliminarSede  = (id)      => api.delete(`/sedes/${id}`);
