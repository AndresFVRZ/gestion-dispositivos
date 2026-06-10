import api from './api';

export const getEmpresas = async () => api.get('/empresas');
export const getEmpresasParaPrestamo = async () => api.get('/empresas/para-prestamo');

export const crearEmpresa = async (data) => api.post('/empresas', data);

export const actualizarEmpresa = async (id, data) => api.put(`/empresas/${id}`, data);

export const eliminarLogo = async (id) => api.delete(`/empresas/${id}/logo`);
