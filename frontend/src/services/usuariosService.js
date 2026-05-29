import api from './api';

export const getUsuarios = async () => {
  try {
    const response = await api.get('/usuarios');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { success: false, data: [] };
  }
};

export const getUsuarioById = async (id) => {
  try {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

export const crearUsuario = async (usuario) => {
  try {
    const response = await api.post('/usuarios', usuario);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, message: error.response?.data?.message || 'Error al crear usuario' };
  }
};

export const actualizarUsuario = async (id, usuario) => {
  try {
    const response = await api.put(`/usuarios/${id}`, usuario);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { success: false, message: error.response?.data?.message || 'Error al actualizar usuario' };
  }
};

export const eliminarUsuario = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, message: error.response?.data?.message || 'Error al eliminar usuario' };
  }
};