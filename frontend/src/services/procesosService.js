import api from './api';

export const getProcesos = (empresa_id) =>
  api.get('/procesos', { params: empresa_id ? { empresa_id } : {} });

export const crearProceso = (data) =>
  api.post('/procesos', data);

export const actualizarProceso = (id, data) =>
  api.put(`/procesos/${id}`, data);

export const eliminarProceso = (id) =>
  api.delete(`/procesos/${id}`);
