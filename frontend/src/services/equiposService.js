import api from './api';

// filtros opcionales: { tipo_id, estado, empresa_id, sede_id, proceso_id, garantia,
//                      ram, procesador_familia, procesador, q } — los de lista aceptan arrays
export const getEquipos = async (filtros = {}) => {
  const params = Object.fromEntries(
    Object.entries(filtros)
      .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
  );
  return await api.get('/equipos', { params });
};

// Catálogos para formularios y filtros: garantías, estados, tipos, RAM y procesadores
export const getOpcionesEquipos = async () => {
  return await api.get('/equipos/opciones');
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

export const reasignarPerifericos = async (equipoId, destinoEquipoId, perifericosIds) => {
  return await api.post(`/equipos/${equipoId}/reasignar-perifericos`, {
    destino_equipo_id: destinoEquipoId,
    perifericos_ids: perifericosIds
  });
};

export const getAuditoria = async (params = {}) => {
  return await api.get('/auditoria', { params });
};