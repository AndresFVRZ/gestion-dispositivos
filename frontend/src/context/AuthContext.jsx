import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsuario = localStorage.getItem('usuario');
    
    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
    setCargando(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        setToken(data.token);
        setUsuario(data.usuario);
        return { success: true, usuario: data.usuario };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    window.location.replace('/');
  };

  const tienePermiso = (rolesPermitidos) => {
    if (!usuario) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};