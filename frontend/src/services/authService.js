import api from './api';

export const login = async (email, password) => {
  return await api.post('/auth/login', { email, password });
};

export const verifyToken = async () => {
  return await api.get('/auth/verify');
};

export const getUsuarios = async () => {
  return await api.get('/auth/usuarios');
};

export const getUsuarioById = async (id) => {
  return await api.get(`/auth/usuarios/${id}`);
};

export const crearUsuario = async (usuario) => {
  return await api.post('/auth/usuarios', usuario);
};

export const actualizarUsuario = async (id, usuario) => {
  return await api.put(`/auth/usuarios/${id}`, usuario);
};

export const eliminarUsuario = async (id) => {
  return await api.delete(`/auth/usuarios/${id}`);
};

export const forgotPassword = async (email) => {
  return await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token, password) => {
  return await api.post('/auth/reset-password', { token, password });
};

export const cambiarPassword = async (id, currentPassword, newPassword) => {
  return await api.put(`/auth/password/${id}`, { 
    currentPassword, 
    newPassword 
  });
};