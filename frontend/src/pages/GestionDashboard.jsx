import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function GestionDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaActiva, setEmpresaActiva] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [equiposRes, empresasRes] = await Promise.all([getEquipos(), getEmpresas()]);
      if (equiposRes?.data) setEquipos(equiposRes.data);
      if (empresasRes?.data) {
        setEmpresas(empresasRes.data);
        if (empresasRes.data.length > 0) setEmpresaActiva(empresasRes.data[0].id);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const lista = empresaActiva ? equipos.filter(e => e.empresa_id === empresaActiva) : equipos;
  const total = lista.length;
  const asignados = lista.filter(e => e.estado === 'Asignado').length;
  const disponibles = lista.filter(e => e.estado === 'Disponible').length;
  const mantenimiento = lista.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado)).length;
  const baja = lista.filter(e => e.estado === 'Baja').length;
  const otros = total - asignados - disponibles - mantenimiento - baja;

  const ultimos = [...lista].slice(0, 6);

  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const segmentos = [
    { label: 'Asignados', count: asignados, color: '#3b82f6' },
    { label: 'Disponibles', count: disponibles, color: '#10b981' },
    { label: 'Mantenimiento', count: mantenimiento, color: '#f59e0b' },
    { label: 'Baja', count: baja, color: '#94a3b8' },
    { label: 'Otros', count: otros, color: '#e2e8f0' },
  ].filter(s => s.count > 0);

  const estadoStyle = (estado) => {
    const map = {
      'Disponible':    { background: '#f0fdf4', color: '#15803d' },
      'Asignado':      { background: '#eff6ff', color: '#1d4ed8' },
      'Préstamo':      { background: '#fefce8', color: '#b45309' },
      'Mantenimiento': { background: '#fff7ed', color: '#c2410c' },
      'Dañado':        { background: '#fef2f2', color: '#dc2626' },
      'Baja':          { background: '#f1f5f9', color: '#475569' },
    };
    return map[estado] || { background: '#f1f5f9', color: '#475569' };
  };

  if (cargando) return <div className="gd-loading">Cargando dashboard...</div>;

  return (
    <div className="gd-wrap">
      {/* HEADER */}
      <div className="gd-hero">
        <div className="gd-hero-left">
          <h1 className="gd-hero-title">Panel de Control</h1>
          <p className="gd-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <div className="gd-hero-right">
          {empresas.length > 1 && (
            <select
              className="gd-empresa-select"
              value={empresaActiva}
              onChange={e => setEmpresaActiva(parseInt(e.target.value))}
            >
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          )}
          <button className="gd-btn-primary" onClick={() => navigate('/equipos')}>
            Gestionar Equipos
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="gd-kpi-grid">
        <div className="gd-kpi gd-kpi-blue">
          <div className="gd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div>
            <p className="gd-kpi-label">Total Equipos</p>
            <p className="gd-kpi-value">{total}</p>
          </div>
        </div>
        <div className="gd-kpi gd-kpi-green">
          <div className="gd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="gd-kpi-label">Asignados</p>
            <p className="gd-kpi-value">{asignados}</p>
            <p className="gd-kpi-pct">{total ? Math.round(asignados / total * 100) : 0}% del total</p>
          </div>
        </div>
        <div className="gd-kpi gd-kpi-purple">
          <div className="gd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div>
            <p className="gd-kpi-label">Disponibles</p>
            <p className="gd-kpi-value">{disponibles}</p>
            <p className="gd-kpi-pct">{total ? Math.round(disponibles / total * 100) : 0}% del total</p>
          </div>
        </div>
        <div className="gd-kpi gd-kpi-orange">
          <div className="gd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <p className="gd-kpi-label">En Mantenimiento</p>
            <p className="gd-kpi-value">{mantenimiento}</p>
            <p className="gd-kpi-pct">{total ? Math.round(mantenimiento / total * 100) : 0}% del total</p>
          </div>
        </div>
      </div>

      <div className="gd-row">
        {/* DISTRIBUCIÓN */}
        {total > 0 && (
          <div className="gd-card gd-card-dist">
            <h2 className="gd-card-title">Distribución por Estado</h2>
            <div className="gd-bar-track">
              {segmentos.map(s => (
                <div
                  key={s.label}
                  title={`${s.label}: ${s.count}`}
                  style={{ flex: s.count, backgroundColor: s.color }}
                  className="gd-bar-fill"
                />
              ))}
            </div>
            <div className="gd-legend">
              {segmentos.map(s => (
                <div key={s.label} className="gd-legend-item">
                  <span className="gd-legend-dot" style={{ backgroundColor: s.color }} />
                  <span className="gd-legend-label">{s.label}</span>
                  <span className="gd-legend-count">{s.count} ({Math.round(s.count / total * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACCESOS RÁPIDOS */}
        <div className="gd-card gd-card-quick">
          <h2 className="gd-card-title">Accesos Rápidos</h2>
          <div className="gd-quick-list">
            <button className="gd-quick-item" onClick={() => navigate('/equipos')}>
              <span className="gd-quick-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>+</span>
              <div>
                <p className="gd-quick-name">Agregar Equipo</p>
                <p className="gd-quick-desc">Registrar nuevo dispositivo</p>
              </div>
            </button>
            <button className="gd-quick-item" onClick={() => navigate('/equipos')}>
              <span className="gd-quick-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>≡</span>
              <div>
                <p className="gd-quick-name">Ver Inventario</p>
                <p className="gd-quick-desc">Lista completa de equipos</p>
              </div>
            </button>
            <button className="gd-quick-item" onClick={() => navigate('/historial')}>
              <span className="gd-quick-icon" style={{ background: '#fefce8', color: '#d97706' }}>📋</span>
              <div>
                <p className="gd-quick-name">Historial</p>
                <p className="gd-quick-desc">Registro de cambios</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* TABLA RECIENTE */}
      <div className="gd-card">
        <div className="gd-card-header">
          <h2 className="gd-card-title">Equipos Recientes</h2>
          <button className="gd-link-btn" onClick={() => navigate('/equipos')}>Ver todos →</button>
        </div>
        <div className="gd-table-wrap">
          <table className="gd-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Asignado a</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {ultimos.length === 0 ? (
                <tr><td colSpan="6" className="gd-empty">No hay equipos registrados</td></tr>
              ) : (
                ultimos.map(eq => {
                  const s = estadoStyle(eq.estado);
                  return (
                    <tr key={eq.id}>
                      <td className="gd-code">{eq.codigo || '-'}</td>
                      <td>{eq.nombre_equipo || '-'}</td>
                      <td className="gd-muted">{eq.tipo || '-'}</td>
                      <td>
                        <span className="gd-badge" style={s}>{eq.estado || '-'}</span>
                      </td>
                      <td>{eq.asignado_a || '-'}</td>
                      <td className="gd-muted">{eq.ubicacion || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionDashboard;

const gdStyles = document.createElement('style');
gdStyles.textContent = `
  .gd-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  /* HERO */
  .gd-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #0f2b5c 0%, #1a3d7c 60%, #2563eb 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(15,43,92,0.25); flex-wrap: wrap; gap: 16px;
  }
  .gd-hero-title { font-size: 28px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .gd-hero-sub { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; }
  .gd-hero-right { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .gd-empresa-select {
    padding: 9px 14px; border-radius: 10px; border: none; font-size: 13px;
    background: rgba(255,255,255,0.15); color: white; cursor: pointer; outline: none;
  }
  .gd-empresa-select option { background: #1a3d7c; }
  .gd-btn-primary {
    padding: 10px 20px; background: white; color: #1a3d7c; border: none;
    border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s;
  }
  .gd-btn-primary:hover { transform: translateY(-1px); }

  /* KPI GRID */
  .gd-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; }
  .gd-kpi {
    background: white; border-radius: 16px; padding: 24px 20px;
    display: flex; align-items: center; gap: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .gd-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
  .gd-kpi-blue  { border-color: #3b82f6; }
  .gd-kpi-green { border-color: #10b981; }
  .gd-kpi-purple{ border-color: #8b5cf6; }
  .gd-kpi-orange{ border-color: #f59e0b; }
  .gd-kpi-icon {
    width: 48px; height: 48px; border-radius: 12px; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .gd-kpi-icon svg { width: 22px; height: 22px; }
  .gd-kpi-blue  .gd-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .gd-kpi-green .gd-kpi-icon { background: #f0fdf4; color: #10b981; }
  .gd-kpi-purple.gd-kpi-icon { background: #f5f3ff; color: #8b5cf6; }
  .gd-kpi-orange .gd-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .gd-kpi-purple .gd-kpi-icon { background: #f5f3ff; color: #8b5cf6; }
  .gd-kpi-label { font-size: 12px; font-weight: 500; color: #64748b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .gd-kpi-value { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; line-height: 1; }
  .gd-kpi-pct   { font-size: 11px; color: #94a3b8; margin: 0; }

  /* ROW */
  .gd-row { display: grid; grid-template-columns: 1fr 280px; gap: 20px; margin-bottom: 28px; }

  /* CARDS */
  .gd-card {
    background: white; border-radius: 16px; padding: 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 28px;
  }
  .gd-card:last-child { margin-bottom: 0; }
  .gd-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .gd-card-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 20px 0; }
  .gd-card-header .gd-card-title { margin: 0; }

  /* BAR */
  .gd-bar-track {
    display: flex; height: 14px; border-radius: 10px; overflow: hidden;
    background: #f1f5f9; margin-bottom: 20px; gap: 2px;
  }
  .gd-bar-fill { border-radius: 4px; transition: flex 0.3s; }
  .gd-legend { display: flex; flex-direction: column; gap: 10px; }
  .gd-legend-item { display: flex; align-items: center; gap: 10px; }
  .gd-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .gd-legend-label { font-size: 13px; color: #334155; flex: 1; }
  .gd-legend-count { font-size: 12px; color: #64748b; font-weight: 500; }

  /* QUICK ACCESS */
  .gd-quick-list { display: flex; flex-direction: column; gap: 8px; }
  .gd-quick-item {
    display: flex; align-items: center; gap: 12px; padding: 12px;
    border-radius: 10px; border: 1px solid #f1f5f9; background: transparent;
    cursor: pointer; text-align: left; width: 100%; transition: background 0.15s;
  }
  .gd-quick-item:hover { background: #f8fafc; }
  .gd-quick-icon {
    width: 36px; height: 36px; border-radius: 8px; display: flex;
    align-items: center; justify-content: center; font-size: 16px;
    font-weight: 700; flex-shrink: 0;
  }
  .gd-quick-name { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 2px 0; }
  .gd-quick-desc { font-size: 11px; color: #94a3b8; margin: 0; }

  /* TABLE */
  .gd-table-wrap { overflow-x: auto; }
  .gd-table { width: 100%; border-collapse: collapse; }
  .gd-table th {
    padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
    color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .gd-table td { padding: 12px 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .gd-table tbody tr:hover { background: #f8fafc; }
  .gd-code { font-weight: 600; color: #0f172a; font-size: 13px; }
  .gd-muted { color: #64748b; }
  .gd-badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500; white-space: nowrap;
  }
  .gd-empty { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
  .gd-link-btn {
    background: none; border: none; color: #3b82f6; font-size: 13px;
    font-weight: 500; cursor: pointer; padding: 0;
  }
  .gd-link-btn:hover { color: #1d4ed8; }
  .gd-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }

  @media (max-width: 1100px) {
    .gd-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .gd-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .gd-wrap { padding: 16px; }
    .gd-hero { padding: 24px 20px; }
    .gd-hero-title { font-size: 22px; }
    .gd-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .gd-kpi-value { font-size: 24px; }
  }
`;
document.head.appendChild(gdStyles);
