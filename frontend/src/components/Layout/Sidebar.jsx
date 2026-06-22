import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ModalCambiarPassword from '../Perfil/ModalCambiarPassword';

const ICONS = {
  Inicio:          'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  Dashboard:       'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  Equipos:         'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  Usuarios:        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  Empresas:        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  Historial:       'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  Sedes:           'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  Mantenimientos:  'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
};

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sb-collapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Comunica el ancho al resto del layout via CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '72px' : '260px');
    localStorage.setItem('sb-collapsed', collapsed);
  }, [collapsed]);

  // Cierra el drawer móvil al cambiar de ruta
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Cierra el drawer si se agranda la ventana
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Bloquea scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const allMenus = {
    super_admin: [
      { path: '/super-admin',    nombre: 'Inicio'          },
      { path: '/equipos',        nombre: 'Equipos'         },
      { path: '/mantenimientos', nombre: 'Mantenimientos'  },
      { path: '/usuarios',       nombre: 'Usuarios'        },
      { path: '/empresas',       nombre: 'Empresas'        },
      { path: '/historial',      nombre: 'Historial'       },
    ],
    administrador: [
      { path: '/dashboard', nombre: 'Inicio'    },
      { path: '/equipos',   nombre: 'Equipos'   },
      { path: '/usuarios',  nombre: 'Usuarios'  },
      { path: '/historial', nombre: 'Historial' },
    ],
    logistica: [
      { path: '/dashboard', nombre: 'Inicio'    },
      { path: '/equipos',   nombre: 'Equipos'   },
      { path: '/historial', nombre: 'Historial' },
    ],
    soporte: [
      { path: '/dashboard',      nombre: 'Inicio'         },
      { path: '/equipos',        nombre: 'Equipos'        },
      { path: '/mantenimientos', nombre: 'Mantenimientos' },
      { path: '/historial',      nombre: 'Historial'      },
    ],
    gerencia: [
      { path: '/dashboard', nombre: 'Inicio'    },
      { path: '/equipos',   nombre: 'Equipos'   },
      { path: '/historial', nombre: 'Historial' },
    ],
    financiera: [
      { path: '/dashboard', nombre: 'Inicio'   },
      { path: '/equipos',   nombre: 'Equipos'  },
    ],
  };

  const menuItems = allMenus[usuario?.rol] || allMenus.financiera;

  const getRolTexto = () => ({
    super_admin:   'Super Administrador',
    administrador: 'Administrador',
    logistica:     'Logística',
    soporte:       'Soporte',
    gerencia:      'Gerencia',
    financiera:    'Financiera',
  }[usuario?.rol] || 'Usuario');

  if (!usuario) return null;

  return (
    <>
      {/* Overlay móvil */}
      {mobileOpen && (
        <div className="sb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Botón hamburguesa (solo móvil) */}
      <button className="sb-ham" onClick={() => setMobileOpen(v => !v)} aria-label="Menú">
        <span /><span /><span />
      </button>

      {/* Botón toggle — flota en el borde derecho del sidebar, siempre visible */}
      <button
        className="sb-toggle"
        onClick={() => setCollapsed(v => !v)}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {collapsed
            ? <path d="M9 18l6-6-6-6" />
            : <path d="M15 18l-6-6 6-6" />}
        </svg>
      </button>

      <aside className={`sidebar ${collapsed ? 'sb-closed' : ''} ${mobileOpen ? 'sb-mobile-open' : ''}`}>

        {/* Encabezado */}
        <div className="sb-brand">
          <div className="sb-logo">GE</div>
          {!collapsed && (
            <div className="sb-logo-text">
              <h2>Gestión de Equipos</h2>
              <p>Sistema Corporativo</p>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="sb-profile">
          <div className="sb-avatar">{usuario?.nombre?.charAt(0) || 'U'}</div>
          {!collapsed && (
            <div className="sb-profile-info">
              <p className="sb-name">{usuario?.nombre}</p>
              <p className="sb-role">{getRolTexto()}</p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="sb-nav">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sb-item ${location.pathname === item.path ? 'sb-active' : ''}`}
              title={collapsed ? item.nombre : ''}
            >
              <Icon d={ICONS[item.nombre] || ICONS.Dashboard} />
              {!collapsed && <span>{item.nombre}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <button className="sb-foot-btn" onClick={() => setShowPasswordModal(true)}
            title={collapsed ? 'Cambiar contraseña' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            {!collapsed && <span>Cambiar contraseña</span>}
          </button>
          <button className="sb-foot-btn sb-logout" onClick={logout}
            title={collapsed ? 'Cerrar sesión' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {!collapsed && <span>Cerrar sesión</span>}
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

// ─── Estilos ────────────────────────────────────────────────────────────────
const css = document.createElement('style');
css.textContent = `
  :root { --sidebar-w: 260px; }

  /* ── Sidebar base ── */
  .sidebar {
    position: fixed; left: 0; top: 0;
    width: var(--sidebar-w);
    height: 100vh;
    background: linear-gradient(180deg, #0f2b5c 0%, #1a3d7c 100%);
    color: #e2e8f0;
    display: flex; flex-direction: column;
    z-index: 200;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
    transition: width 0.25s ease;
    overflow: hidden;
  }

  /* ── Desktop colapso ── */
  .sidebar.sb-closed { width: 72px; }

  /* ── Encabezado ── */
  .sb-brand {
    padding: 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; gap: 10px;
    min-height: 72px;
  }
  .sb-logo {
    width: 40px; height: 40px; flex-shrink: 0;
    background: linear-gradient(135deg, #4299e1, #3182ce);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px; color: white;
  }
  .sb-logo-text { flex: 1; overflow: hidden; }
  .sb-logo-text h2 { font-size: 14px; font-weight: 600; color: white; margin: 0; white-space: nowrap; }
  .sb-logo-text p  { font-size: 10px; color: rgba(255,255,255,0.55); margin: 3px 0 0; white-space: nowrap; }

  /* Botón toggle — flota en el borde derecho del sidebar */
  .sb-toggle {
    position: fixed;
    left: calc(var(--sidebar-w) - 14px);
    top: 68px;
    z-index: 201;
    width: 28px; height: 28px;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #1a3a5c;
    transition: left 0.25s ease, box-shadow 0.2s;
  }
  .sb-toggle:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    background: #f0f7ff;
  }

  /* ── Perfil ── */
  .sb-profile {
    padding: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; gap: 10px;
    min-height: 72px;
  }
  .sb-avatar {
    width: 40px; height: 40px; flex-shrink: 0;
    background: linear-gradient(135deg, #4299e1, #3182ce);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px; color: white;
  }
  .sb-profile-info { overflow: hidden; }
  .sb-name { font-size: 13px; font-weight: 600; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-role { font-size: 10px; color: rgba(255,255,255,0.55); margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }

  /* ── Navegación ── */
  .sb-nav {
    flex: 1; padding: 12px 10px;
    display: flex; flex-direction: column; gap: 2px;
    overflow-y: auto; overflow-x: hidden;
  }
  .sb-item {
    width: 100%; padding: 10px 12px;
    background: transparent; border: none; border-radius: 10px;
    cursor: pointer; transition: all 0.18s;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.7);
    display: flex; align-items: center; gap: 12px;
    text-align: left; white-space: nowrap;
  }
  .sb-item:hover  { background: rgba(255,255,255,0.08); color: white; }
  .sb-item.sb-active {
    background: rgba(59,130,246,0.25);
    color: white;
    border-left: 3px solid #3b82f6;
    padding-left: 9px;
  }
  .sidebar.sb-closed .sb-item { justify-content: center; padding: 10px 0; border-left: none; }
  .sidebar.sb-closed .sb-item.sb-active { border-left: none; border-bottom: 2px solid #3b82f6; border-radius: 8px; }

  /* ── Footer ── */
  .sb-footer {
    padding: 12px 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex; flex-direction: column; gap: 4px;
  }
  .sb-foot-btn {
    width: 100%; padding: 9px 12px;
    background: transparent; border: none; border-radius: 8px;
    cursor: pointer; transition: all 0.18s;
    font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.65);
    display: flex; align-items: center; gap: 10px;
    text-align: left; white-space: nowrap;
  }
  .sb-foot-btn:hover { background: rgba(255,255,255,0.08); color: white; }
  .sb-logout { color: #fca5a5; }
  .sb-logout:hover { background: rgba(248,113,113,0.15); color: #fecaca; }
  .sidebar.sb-closed .sb-foot-btn { justify-content: center; padding: 9px 0; }

  /* ── Overlay móvil ── */
  .sb-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 190;
    backdrop-filter: blur(2px);
  }

  /* ── Hamburguesa (solo móvil) ── */
  .sb-ham {
    display: none;
    position: fixed; top: 12px; left: 12px;
    z-index: 300;
    background: #0f2b5c;
    border: none; border-radius: 8px;
    width: 40px; height: 40px;
    cursor: pointer;
    flex-direction: column;
    align-items: center; justify-content: center; gap: 5px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .sb-ham span {
    display: block; width: 20px; height: 2px;
    background: white; border-radius: 2px;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .sidebar {
      width: 260px !important;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
    }
    .sidebar.sb-mobile-open { transform: translateX(0); }
    .sb-toggle  { display: none !important; }
    .sb-ham     { display: flex; }
    .sb-closed .sb-item span,
    .sb-closed .sb-name,
    .sb-closed .sb-role,
    .sb-closed .sb-logo-text { display: initial !important; }
  }
`;
document.head.appendChild(css);
