import api from './api';

// filtros opcionales: { sede_id, empresa_id, categoria, q, bajo_minimo }
export const getStock = async (filtros = {}) => {
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
  );
  return await api.get('/stock', { params });
};

export const crearParte = async (parte) => {
  return await api.post('/stock', parte);
};

export const actualizarParte = async (id, parte) => {
  return await api.put(`/stock/${id}`, parte);
};

// cantidad positiva suma, negativa resta
export const ajustarStock = async (id, cantidad) => {
  return await api.patch(`/stock/${id}/ajustar`, { cantidad });
};

export const eliminarParte = async (id) => {
  return await api.delete(`/stock/${id}`);
};
