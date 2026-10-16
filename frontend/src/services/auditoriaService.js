import api from './api';

export const getAuditoria = async (params = {}) => {
  return await api.get('/auditoria', { params });
};