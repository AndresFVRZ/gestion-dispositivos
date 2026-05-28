import api from './api';

export const getEmpresas = async () => {
  return await api.get('/empresas');
};