import api from './api';

export const getPlacas      = ()        => api.get('/placas');
export const crearPlaca     = (data)    => api.post('/placas', data);
export const actualizarPlaca = (id, data) => api.put(`/placas/${id}`, data);
export const eliminarPlaca  = (id)      => api.delete(`/placas/${id}`);
