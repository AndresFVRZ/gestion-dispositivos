import api from './api';

export const getEquipos = async () => {
  return await api.get('/equipos');
};

export const getEquiposByEmpresa = async (empresaId) => {
  return await api.get(`/equipos/empresa/${empresaId}`);
};

export const getEquipoById = async (id) => {
  return await api.get(`/equipos/${id}`);
};

export const crearEquipo = async (equipo) => {
  return await api.post('/equipos', equipo);
};

export const actualizarEquipo = async (id, equipo) => {
  return await api.put(`/equipos/${id}`, equipo);
};

export const eliminarEquipo = async (id) => {
  return await api.delete(`/equipos/${id}`);
};

export const restaurarEquipo = async (id) => {
  return await api.post(`/equipos/${id}/restaurar`);
};

export const eliminarPermanente = async (id) => {
  return await api.delete(`/equipos/${id}/permanente`);
};

export const getPapelera = async () => {
  return await api.get('/equipos/papelera');
};

export const reasignarPerifericos = async (equipoId, destinoEquipoId, perifericosIds) => {
  return await api.post(`/equipos/${equipoId}/reasignar-perifericos`, {
    destino_equipo_id: destinoEquipoId,
    perifericos_ids: perifericosIds
  });
};

export const getHistorial = async (params = {}) => {
  return await api.get('/historial', { params });
};