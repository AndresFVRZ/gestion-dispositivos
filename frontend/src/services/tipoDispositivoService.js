import api from './api';

export const getTiposEquipo = async () => {
  return await api.get('/tipo-dispositivo?categoria=equipo');
};

export const getTiposPeriferico = async () => {
  return await api.get('/tipo-dispositivo?categoria=periferico');
};

export const getTipos = async (categoria) => {
  const params = categoria ? `?categoria=${categoria}` : '';
  return await api.get(`/tipo-dispositivo${params}`);
};
