import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { getUsuarios } from '../services/usuariosService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLogoEmpresa } from '../utils/logos';

function AdministradorDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [empresaActiva, setEmpresaActiva] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [eqRes, empRes, usrRes] = await Promise.all([getEquipos(), getEmpresas(), getUsuarios()]);
      if (eqRes?.data)  setEquipos(eqRes.data);
      if (empRes?.data) { setEmpresas(empRes.data); if (empRes.data.length > 0) setEmpresaActiva(empRes.data[0].id); }
      if (usrRes?.data) setUsuarios(usrRes.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const lista = empresaActiva
    ? equipos.filter(e => e.empresa_id === empresaActiva || e.prestado_a_empresa_id === empresaActiva)
    : equipos;

  const total        = lista.length;
  const asignados    = lista.filter(e => e.estado === 'Asignado').length;
  const disponibles  = lista.filter(e => e.estado === 'Disponible').length;
  const prestamos    = lista.filter(e => e.estado === 'Préstamo').length;
  const mantenimiento = lista.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado)).length;
  const totalUsuarios = usuarios.length;

  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const estadoStyle = (estado) => {
    const map = {
      'Disponible':    { background: '#f0fdf4', color: '#15803d' },
      'Asignado':      { background: '#eff6ff', color: '#1d4ed8' },
      'Préstamo':      { background: '#fefce8', color: '#b45309' },
      'Mantenimiento': { background: '#fff7ed', color: '#c2410c' },
      'Dañado':        { background: '#fef2f2', color: '#dc2626' },
      'Baja':          { background: '#f1f5f9', color: '#475569' },
      'Canibalizar':   { background: '#fdf4ff', color: '#7c3aed' },
    };
    return map[estado] || { background: '#f1f5f9', color: '#475569' };
  };

  if (cargando) return <div className="ad-loading">Cargando panel...</div>;

  return (
    <div className="ad-wrap">
      <div className="ad-hero">
        <div className="ad-hero-left">
          <h1 className="ad-hero-title">Panel de Administración</h1>
          <p className="ad-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <div className="ad-hero-right">
          <button className="ad-btn-outline" onClick={() => navigate('/usuarios')}>Usuarios</button>
          <button className="ad-btn-white" onClick={() => navigate('/equipos')}>Inventario</button>
        </div>
      </div>

      {empresas.length > 1 && (
        <div className="ad-selector-scroll">
          {empresas.map(emp => {
            const logo = getLogoEmpresa(emp.nombre);
            const activa = empresaActiva === emp.id;
            return (
              <button key={emp.id} className={`ad-sel-card ${activa ? 'ad-sel-card-active' : ''}`} onClick={() => setEmpresaActiva(emp.id)}>
                <div className="ad-sel-avatar">
                  {logo ? <img src={logo} alt={emp.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                        : <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{emp.nombre.charAt(0)}</span>}
                </div>
                <p className="ad-sel-name">{emp.nombre}</p>
                <p className="ad-sel-count">{equipos.filter(e => e.empresa_id === emp.id).length} eq.</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="ad-kpi-grid">
        <div className="ad-kpi ad-kpi-indigo">
          <div className="ad-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div><p className="ad-kpi-label">Total Equipos</p><p className="ad-kpi-value">{total}</p></div>
        </div>
        <div className="ad-kpi ad-kpi-blue">
          <div className="ad-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div><p className="ad-kpi-label">Usuarios</p><p className="ad-kpi-value">{totalUsuarios}</p></div>
        </div>
        <div className="ad-kpi ad-kpi-green">
          <div className="ad-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="ad-kpi-label">Asignados</p>
            <p className="ad-kpi-value">{asignados}</p>
            <p className="ad-kpi-pct">{total ? Math.round(asignados / total * 100) : 0}%</p>
          </div>
        </div>
        <div className="ad-kpi ad-kpi-teal">
          <div className="ad-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div>
            <p className="ad-kpi-label">Disponibles</p>
            <p className="ad-kpi-value">{disponibles}</p>
            <p className="ad-kpi-pct">{total ? Math.round(disponibles / total * 100) : 0}%</p>
          </div>
        </div>
        <div className="ad-kpi ad-kpi-yellow">
          <div className="ad-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>
          </div>
          <div>
            <p className="ad-kpi-label">En Préstamo</p>
            <p className="ad-kpi-value">{prestamos}</p>
            <p className="ad-kpi-pct">{total ? Math.round(prestamos / total * 100) : 0}%</p>
          </div>
        </div>
        <div className="ad-kpi ad-kpi-orange">
          <div className="ad-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <p className="ad-kpi-label">Mantenimiento</p>
            <p className="ad-kpi-value">{mantenimiento}</p>
            <p className="ad-kpi-pct">{total ? Math.round(mantenimiento / total * 100) : 0}%</p>
          </div>
        </div>
      </div>

      <div className="ad-row">
        <div className="ad-card">
          <h2 className="ad-card-title">Accesos Rápidos</h2>
          <div className="ad-quick-list">
            <button className="ad-quick-item" onClick={() => navigate('/equipos')}>
              <span className="ad-quick-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>+</span>
              <div><p className="ad-quick-name">Agregar Equipo</p><p className="ad-quick-desc">Registrar nuevo dispositivo</p></div>
            </button>
            <button className="ad-quick-item" onClick={() => navigate('/equipos')}>
              <span className="ad-quick-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>≡</span>
              <div><p className="ad-quick-name">Ver Inventario</p><p className="ad-quick-desc">Lista completa de equipos</p></div>
            </button>
            <button className="ad-quick-item" onClick={() => navigate('/usuarios')}>
              <span className="ad-quick-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>👤</span>
              <div><p className="ad-quick-name">Gestionar Usuarios</p><p className="ad-quick-desc">Crear y editar accesos</p></div>
            </button>
            <button className="ad-quick-item" onClick={() => navigate('/historial')}>
              <span className="ad-quick-icon" style={{ background: '#fefce8', color: '#d97706' }}>📋</span>
              <div><p className="ad-quick-name">Historial</p><p className="ad-quick-desc">Registro de cambios</p></div>
            </button>
          </div>
        </div>

        <div className="ad-card" style={{ flex: 2 }}>
          <h2 className="ad-card-title">Equipos Recientes</h2>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Asignado a</th>
                  <th>Proceso</th>
                </tr>
              </thead>
              <tbody>
                {lista.slice(0, 8).length === 0 ? (
                  <tr><td colSpan="5" className="ad-empty">Sin equipos registrados</td></tr>
                ) : (
                  lista.slice(0, 8).map(eq => (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 500 }}>{eq.nombre_equipo || '-'}</td>
                      <td className="ad-muted">{eq.tipo_nombre || '-'}</td>
                      <td><span className="ad-badge" style={estadoStyle(eq.estado)}>{eq.estado || '-'}</span></td>
                      <td>{eq.asignado_a || '-'}</td>
                      <td className="ad-muted">{eq.proceso_nombre || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdministradorDashboard;

const adStyles = document.createElement('style');
adStyles.textContent = `
  .ad-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  .ad-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #6366f1 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(55,48,163,0.3); flex-wrap: wrap; gap: 16px;
  }
  .ad-hero-title { font-size: 26px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .ad-hero-sub { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; }
  .ad-hero-right { display: flex; gap: 10px; flex-wrap: wrap; }
  .ad-btn-white {
    padding: 10px 20px; background: white; color: #3730a3; border: none;
    border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s;
  }
  .ad-btn-white:hover { transform: translateY(-1px); }
  .ad-btn-outline {
    padding: 10px 20px; background: rgba(255,255,255,0.12); color: white;
    border: 1px solid rgba(255,255,255,0.3); border-radius: 10px;
    font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;
  }
  .ad-btn-outline:hover { background: rgba(255,255,255,0.22); }

  .ad-selector-scroll {
    display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 24px;
  }
  .ad-sel-card {
    flex-shrink: 0; width: 120px; background: white; border-radius: 14px;
    padding: 14px 10px; border: 2px solid transparent; cursor: pointer;
    text-align: center; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .ad-sel-card:hover { border-color: #c7d2fe; }
  .ad-sel-card-active { border-color: #6366f1 !important; background: #eef2ff !important; }
  .ad-sel-avatar {
    width: 52px; height: 52px; border-radius: 12px;
    background: linear-gradient(135deg, #3730a3, #6366f1);
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .ad-sel-name { font-size: 11px; font-weight: 600; color: #0f172a; margin: 0; line-height: 1.3; }
  .ad-sel-count { font-size: 10px; color: #94a3b8; margin: 0; }

  .ad-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  .ad-kpi {
    background: white; border-radius: 14px; padding: 20px;
    display: flex; align-items: center; gap: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .ad-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
  .ad-kpi-indigo { border-color: #6366f1; }
  .ad-kpi-blue   { border-color: #3b82f6; }
  .ad-kpi-green  { border-color: #10b981; }
  .ad-kpi-teal   { border-color: #06b6d4; }
  .ad-kpi-yellow { border-color: #eab308; }
  .ad-kpi-orange { border-color: #f59e0b; }
  .ad-kpi-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ad-kpi-icon svg { width: 20px; height: 20px; }
  .ad-kpi-indigo .ad-kpi-icon { background: #eef2ff; color: #6366f1; }
  .ad-kpi-blue   .ad-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .ad-kpi-green  .ad-kpi-icon { background: #f0fdf4; color: #10b981; }
  .ad-kpi-teal   .ad-kpi-icon { background: #ecfeff; color: #06b6d4; }
  .ad-kpi-yellow .ad-kpi-icon { background: #fefce8; color: #ca8a04; }
  .ad-kpi-orange .ad-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .ad-kpi-label { font-size: 11px; font-weight: 500; color: #64748b; margin: 0 0 3px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .ad-kpi-value { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }
  .ad-kpi-pct   { font-size: 11px; color: #94a3b8; margin: 2px 0 0; }

  .ad-row { display: flex; gap: 20px; flex-wrap: wrap; }
  .ad-card {
    flex: 1; min-width: 280px; background: white; border-radius: 16px; padding: 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .ad-card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 18px 0; }

  .ad-quick-list { display: flex; flex-direction: column; gap: 8px; }
  .ad-quick-item {
    display: flex; align-items: center; gap: 12px; padding: 10px;
    border-radius: 10px; border: 1px solid #f1f5f9; background: transparent;
    cursor: pointer; text-align: left; width: 100%; transition: background 0.15s;
  }
  .ad-quick-item:hover { background: #f8fafc; }
  .ad-quick-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .ad-quick-name { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
  .ad-quick-desc { font-size: 11px; color: #94a3b8; margin: 0; }

  .ad-table-wrap { overflow-x: auto; }
  .ad-table { width: 100%; border-collapse: collapse; }
  .ad-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .ad-table td { padding: 11px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .ad-table tbody tr:hover { background: #f8fafc; }
  .ad-table tbody tr:last-child td { border-bottom: none; }
  .ad-muted { color: #64748b; font-size: 12px; }
  .ad-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .ad-empty { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; }
  .ad-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }

  @media (max-width: 1100px) { .ad-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) {
    .ad-wrap { padding: 16px; }
    .ad-hero { padding: 24px 20px; }
    .ad-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  }
`;
document.head.appendChild(adStyles);
