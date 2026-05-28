import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ModalCambiarPassword from '../Perfil/ModalCambiarPassword';

const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar sidebar en móvil al cambiar de página
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = usuario?.rol === 'super_admin' ? [
    { path: '/super-admin', nombre: 'Dashboard' },
    { path: '/equipos', nombre: 'Equipos' },
    { path: '/usuarios', nombre: 'Usuarios' },
    { path: '/papelera', nombre: 'Papelera' },
    { path: '/historial', nombre: 'Historial' },
  ] : [
    { path: '/equipos', nombre: 'Equipos' },
    { path: '/historial', nombre: 'Historial' },
  ];

  if (!usuario) return null;

  const getRolTexto = () => {
    switch (usuario.rol) {
      case 'super_admin': return 'Super Administrador';
      case 'gestion': return 'Gestión';
      case 'visualizador': return 'Visualizador';
      default: return 'Usuario';
    }
  };

  return (
    <>
      {/* Botón toggle para móvil */}
      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay para móvil */}
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Gestión de Equipos</h2>
          <p className="sidebar-user-name">{usuario?.nombre}</p>
          <p className="sidebar-user-role">{getRolTexto()}</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sidebar-nav-item ${
                location.pathname === item.path ? 'sidebar-nav-item--active' : ''
              }`}
            >
              {item.nombre}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="sidebar-footer-btn"
          >
            Cambiar Contraseña
          </button>
          <button
            onClick={logout}
            className="sidebar-footer-btn sidebar-footer-btn--danger"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <ModalCambiarPassword 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </>
  );
};

export default Sidebar;