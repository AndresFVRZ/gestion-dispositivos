import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function VisualizadorDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await getEquipos();
      if (res?.data) setEquipos(res.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const total        = equipos.length;
  const asignados    = equipos.filter(e => e.estado === 'Asignado').length;
  const disponibles  = equipos.filter(e => e.estado === 'Disponible').length;
  const prestamos    = equipos.filter(e => e.estado === 'Préstamo').length;
  const mantenimiento = equipos.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado)).length;

  const segmentos = [
    { label: 'Asignados',     count: asignados,     color: '#3b82f6' },
    { label: 'Disponibles',   count: disponibles,   color: '#10b981' },
    { label: 'En Préstamo',   count: prestamos,     color: '#eab308' },
    { label: 'Mantenimiento', count: mantenimiento, color: '#f59e0b' },
    { label: 'Otros', count: total - asignados - disponibles - prestamos - mantenimiento, color: '#e2e8f0' },
  ].filter(s => s.count > 0);

  const equiposFiltrados = equipos.filter(e => {
    if (!filtro) return true;
    const q = filtro.toUpperCase();
    return e.nombre_equipo?.toUpperCase().includes(q) ||
           e.codigo?.toUpperCase().includes(q) ||
           e.asignado_a?.toUpperCase().includes(q) ||
           e.proceso_nombre?.toUpperCase().includes(q);
  });

  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

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

  if (cargando) return <div className="vd-loading">Cargando dashboard...</div>;

  return (
    <div className="vd-wrap">
      {/* HEADER */}
      <div className="vd-hero">
        <div>
          <h1 className="vd-hero-title">Panel de Visualización</h1>
          <p className="vd-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <button className="vd-btn" onClick={() => navigate('/equipos')}>
          Ver Inventario Completo
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="vd-kpi-grid">
        <div className="vd-kpi vd-kpi-blue">
          <div className="vd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div>
            <p className="vd-kpi-label">Total Equipos</p>
            <p className="vd-kpi-value">{total}</p>
          </div>
        </div>
        <div className="vd-kpi vd-kpi-green">
          <div className="vd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="vd-kpi-label">Asignados</p>
            <p className="vd-kpi-value">{asignados}</p>
            <p className="vd-kpi-pct">{total ? Math.round(asignados / total * 100) : 0}% del total</p>
          </div>
        </div>
        <div className="vd-kpi vd-kpi-purple">
          <div className="vd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
          </div>
          <div>
            <p className="vd-kpi-label">Disponibles</p>
            <p className="vd-kpi-value">{disponibles}</p>
            <p className="vd-kpi-pct">{total ? Math.round(disponibles / total * 100) : 0}% del total</p>
          </div>
        </div>
        <div className="vd-kpi vd-kpi-yellow">
          <div className="vd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>
          </div>
          <div>
            <p className="vd-kpi-label">En Préstamo</p>
            <p className="vd-kpi-value">{prestamos}</p>
            <p className="vd-kpi-pct">{total ? Math.round(prestamos / total * 100) : 0}% del total</p>
          </div>
        </div>
        <div className="vd-kpi vd-kpi-orange">
          <div className="vd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </div>
          <div>
            <p className="vd-kpi-label">En Mantenimiento</p>
            <p className="vd-kpi-value">{mantenimiento}</p>
            <p className="vd-kpi-pct">{total ? Math.round(mantenimiento / total * 100) : 0}% del total</p>
          </div>
        </div>
      </div>

      {/* DISTRIBUCIÓN */}
      {total > 0 && (
        <div className="vd-card">
          <h2 className="vd-card-title">Distribución por Estado</h2>
          <div className="vd-bar-track">
            {segmentos.map(s => (
              <div
                key={s.label}
                title={`${s.label}: ${s.count}`}
                style={{ flex: s.count, backgroundColor: s.color }}
                className="vd-bar-fill"
              />
            ))}
          </div>
          <div className="vd-legend">
            {segmentos.map(s => (
              <div key={s.label} className="vd-legend-item">
                <span className="vd-legend-dot" style={{ backgroundColor: s.color }} />
                <span className="vd-legend-label">{s.label}</span>
                <span className="vd-legend-count">{s.count} ({Math.round(s.count / total * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLA EQUIPOS */}
      <div className="vd-card">
        <div className="vd-card-header">
          <h2 className="vd-card-title">Listado de Equipos</h2>
          <input
            className="vd-search"
            placeholder="Buscar por nombre, código o asignado..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
        <div className="vd-table-wrap">
          <table className="vd-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Estado</th>
                <th>Asignado a</th>
                <th>Área</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr><td colSpan="7" className="vd-empty">No hay equipos para mostrar</td></tr>
              ) : (
                equiposFiltrados.map(eq => {
                  const s = estadoStyle(eq.estado);
                  return (
                    <tr key={eq.id}>
                      <td className="vd-code">{eq.codigo || '-'}</td>
                      <td className="vd-name">{eq.nombre_equipo || '-'}</td>
                      <td className="vd-muted">{eq.tipo || '-'}</td>
                      <td className="vd-muted">{[eq.marca, eq.modelo].filter(Boolean).join(' ') || '-'}</td>
                      <td>
                        <span className="vd-badge" style={s}>{eq.estado || '-'}</span>
                      </td>
                      <td>{eq.asignado_a || '-'}</td>
                      <td className="vd-muted">{eq.ubicacion || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {equiposFiltrados.length > 0 && (
          <p className="vd-count">{equiposFiltrados.length} equipo{equiposFiltrados.length !== 1 ? 's' : ''} encontrado{equiposFiltrados.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}

export default VisualizadorDashboard;

const vdStyles = document.createElement('style');
vdStyles.textContent = `
  .vd-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  /* HERO */
  .vd-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #1e3a5f 0%, #1a4e8a 60%, #0ea5e9 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(14,58,94,0.25); flex-wrap: wrap; gap: 16px;
  }
  .vd-hero-title { font-size: 28px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .vd-hero-sub { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; }
  .vd-btn {
    padding: 10px 20px; background: white; color: #1a4e8a; border: none;
    border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s;
    white-space: nowrap;
  }
  .vd-btn:hover { transform: translateY(-1px); }

  /* KPI GRID */
  .vd-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; }
  .vd-kpi {
    background: white; border-radius: 16px; padding: 24px 20px;
    display: flex; align-items: center; gap: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .vd-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
  .vd-kpi-blue   { border-color: #3b82f6; }
  .vd-kpi-green  { border-color: #10b981; }
  .vd-kpi-purple { border-color: #8b5cf6; }
  .vd-kpi-yellow { border-color: #eab308; }
  .vd-kpi-orange { border-color: #f59e0b; }
  .vd-kpi-icon {
    width: 48px; height: 48px; border-radius: 12px; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .vd-kpi-icon svg { width: 22px; height: 22px; }
  .vd-kpi-blue   .vd-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .vd-kpi-green  .vd-kpi-icon { background: #f0fdf4; color: #10b981; }
  .vd-kpi-purple .vd-kpi-icon { background: #f5f3ff; color: #8b5cf6; }
  .vd-kpi-yellow .vd-kpi-icon { background: #fefce8; color: #ca8a04; }
  .vd-kpi-orange .vd-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .vd-kpi-label { font-size: 12px; font-weight: 500; color: #64748b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .vd-kpi-value { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; line-height: 1; }
  .vd-kpi-pct   { font-size: 11px; color: #94a3b8; margin: 0; }

  /* CARDS */
  .vd-card {
    background: white; border-radius: 16px; padding: 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 28px;
  }
  .vd-card-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  }
  .vd-card-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 20px 0; }
  .vd-card-header .vd-card-title { margin: 0; }

  /* SEARCH */
  .vd-search {
    padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
    font-size: 13px; outline: none; min-width: 280px;
  }
  .vd-search:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

  /* BAR */
  .vd-bar-track {
    display: flex; height: 14px; border-radius: 10px; overflow: hidden;
    background: #f1f5f9; margin-bottom: 20px; gap: 2px;
  }
  .vd-bar-fill { border-radius: 4px; }
  .vd-legend { display: flex; flex-wrap: wrap; gap: 16px; }
  .vd-legend-item { display: flex; align-items: center; gap: 8px; }
  .vd-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .vd-legend-label { font-size: 13px; color: #334155; }
  .vd-legend-count { font-size: 12px; color: #64748b; font-weight: 500; }

  /* TABLE */
  .vd-table-wrap { overflow-x: auto; }
  .vd-table { width: 100%; border-collapse: collapse; min-width: 720px; }
  .vd-table th {
    padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
    color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .vd-table td { padding: 12px 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .vd-table tbody tr:hover { background: #f8fafc; }
  .vd-code { font-weight: 600; color: #0f172a; }
  .vd-name { font-weight: 500; }
  .vd-muted { color: #64748b; font-size: 12px; }
  .vd-badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500; white-space: nowrap;
  }
  .vd-empty { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
  .vd-count { font-size: 12px; color: #94a3b8; margin: 12px 0 0 0; text-align: right; }
  .vd-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }

  @media (max-width: 1100px) {
    .vd-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .vd-wrap { padding: 16px; }
    .vd-hero { padding: 24px 20px; }
    .vd-hero-title { font-size: 22px; }
    .vd-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .vd-kpi-value { font-size: 24px; }
    .vd-search { min-width: 100%; }
    .vd-legend { flex-direction: column; gap: 10px; }
  }
`;
document.head.appendChild(vdStyles);
