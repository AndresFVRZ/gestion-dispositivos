import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ModalCambiarPassword from '../Perfil/ModalCambiarPassword';

const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">GE</div>
          <div className="logo-text">
            <h2>Gestión de Equipos</h2>
            <p>Sistema Corporativo</p>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {usuario?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{usuario?.nombre}</p>
            <p className="profile-role">{getRolTexto()}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.nombre}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="footer-btn"
          >
            Cambiar Contraseña
          </button>
          <button
            onClick={logout}
            className="footer-btn logout-btn"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <ModalCambiarPassword 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </>
  );
};

export default Sidebar;

// ============================================
// ESTILOS PROFESIONALES DEL COMPONENTE
// ============================================
const sidebarStyles = document.createElement('style');
sidebarStyles.textContent = `
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    height: 100vh;
    background: linear-gradient(180deg, #0f2b5c 0%, #1a3d7c 100%);
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    transition: width 0.3s ease;
  }

  .sidebar-brand {
    padding: 28px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #4299e1, #3182ce);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .logo-text h2 {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .logo-text p {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    margin: 4px 0 0 0;
  }

  .sidebar-profile {
    padding: 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .sidebar-profile:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .profile-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #4299e1, #3182ce);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
    color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .profile-info {
    flex: 1;
  }

  .profile-name {
    font-size: 14px;
    font-weight: 600;
    color: white;
    margin: 0 0 4px 0;
  }

  .profile-role {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sidebar-nav {
    flex: 1;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-item {
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    text-align: left;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .nav-item.active {
    background: rgba(59, 130, 246, 0.3);
    color: white;
    border-left: 3px solid #3b82f6;
  }

  .sidebar-footer {
    padding: 20px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .footer-btn {
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    text-align: left;
  }

  .footer-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .logout-btn {
    color: #fca5a5;
  }

  .logout-btn:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #fecaca;
  }

  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
  }
`;
document.head.appendChild(sidebarStyles);