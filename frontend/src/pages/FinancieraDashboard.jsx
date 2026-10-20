import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { estiloBadgeEstado } from '../utils/estados';

function FinancieraDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await getEquipos();
      if (res?.data) setEquipos(res.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const total        = equipos.length;
  const asignados    = equipos.filter(e => e.estado === 'Asignado').length;
  const disponibles  = equipos.filter(e => e.estado === 'Disponible').length;
  const prestamos    = equipos.filter(e => e.estado === 'Préstamo').length;
  const mantenimiento = equipos.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado)).length;
  const baja         = equipos.filter(e => ['Baja', 'Canibalizar'].includes(e.estado)).length;

  const equiposFiltrados = equipos.filter(e => {
    if (!filtro) return true;
    const q = filtro.toUpperCase();
    return e.nombre_equipo?.toUpperCase().includes(q) ||
           e.codigo?.toUpperCase().includes(q) ||
           e.asignado_a?.toUpperCase().includes(q) ||
           e.proceso_nombre?.toUpperCase().includes(q) ||
           e.empresa_nombre?.toUpperCase().includes(q);
  });

  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const estadoStyle = estiloBadgeEstado;

  const segmentos = [
    { label: 'Asignados',     count: asignados,    color: '#3b82f6' },
    { label: 'Disponibles',   count: disponibles,  color: '#10b981' },
    { label: 'En Préstamo',   count: prestamos,    color: '#eab308' },
    { label: 'Mantenimiento', count: mantenimiento,color: '#f59e0b' },
    { label: 'Baja',          count: baja,         color: '#94a3b8' },
  ].filter(s => s.count > 0);

  if (cargando) return <div className="fin-loading">Cargando panel...</div>;

  return (
    <div className="fin-wrap">
      <div className="fin-hero">
        <div>
          <h1 className="fin-hero-title">Panel Financiero</h1>
          <p className="fin-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <button className="fin-btn" onClick={() => navigate('/equipos')}>Ver Inventario Completo</button>
      </div>

      <div className="fin-kpi-grid">
        {[
          { label: 'Total Equipos',     value: total,         pct: null,                                    cls: 'fin-kpi-blue',   icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></> },
          { label: 'Asignados',         value: asignados,     pct: total ? Math.round(asignados/total*100):0,    cls: 'fin-kpi-indigo', icon: <path d="M20 6L9 17l-5-5"/> },
          { label: 'Disponibles',       value: disponibles,   pct: total ? Math.round(disponibles/total*100):0,  cls: 'fin-kpi-green',  icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></> },
          { label: 'En Préstamo',       value: prestamos,     pct: total ? Math.round(prestamos/total*100):0,    cls: 'fin-kpi-yellow', icon: <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/> },
          { label: 'Mantenimiento',     value: mantenimiento, pct: total ? Math.round(mantenimiento/total*100):0,cls: 'fin-kpi-orange', icon: <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/> },
        ].map(k => (
          <div key={k.label} className={`fin-kpi ${k.cls}`}>
            <div className="fin-kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.icon}</svg>
            </div>
            <div>
              <p className="fin-kpi-label">{k.label}</p>
              <p className="fin-kpi-value">{k.value}</p>
              {k.pct !== null && <p className="fin-kpi-pct">{k.pct}% del total</p>}
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="fin-card">
          <h2 className="fin-card-title">Distribución por Estado</h2>
          <div className="fin-bar-track">
            {segmentos.map(s => (
              <div key={s.label} title={`${s.label}: ${s.count}`}
                style={{ flex: s.count, backgroundColor: s.color }} className="fin-bar-fill" />
            ))}
          </div>
          <div className="fin-legend">
            {segmentos.map(s => (
              <div key={s.label} className="fin-legend-item">
                <span className="fin-legend-dot" style={{ backgroundColor: s.color }} />
                <span className="fin-legend-label">{s.label}</span>
                <span className="fin-legend-count">{s.count} ({Math.round(s.count / total * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fin-card">
        <div className="fin-card-header">
          <h2 className="fin-card-title" style={{ margin: 0 }}>Listado de Equipos</h2>
          <input className="fin-search" placeholder="Buscar por nombre, código, empresa..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Empresa</th><th>Código</th><th>Equipo</th><th>Tipo</th><th>Estado</th><th>Asignado a</th><th>Proceso</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr><td colSpan="7" className="fin-empty">No hay equipos para mostrar</td></tr>
              ) : (
                equiposFiltrados.map(eq => (
                  <tr key={eq.id}>
                    <td className="fin-muted">{eq.empresa_nombre || '-'}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{eq.codigo || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{eq.nombre_equipo || '-'}</td>
                    <td className="fin-muted">{eq.tipo_nombre || '-'}</td>
                    <td><span className="fin-badge" style={estadoStyle(eq.estado)}>{eq.estado || '-'}</span></td>
                    <td>{eq.asignado_a || '-'}</td>
                    <td className="fin-muted">{eq.proceso_nombre || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {equiposFiltrados.length > 0 && (
          <p className="fin-count">{equiposFiltrados.length} equipo{equiposFiltrados.length !== 1 ? 's' : ''} encontrado{equiposFiltrados.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}

export default FinancieraDashboard;

const finStyles = document.createElement('style');
finStyles.textContent = `
  .fin-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  .fin-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #134e4a 0%, #0d9488 60%, #06b6d4 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(13,78,74,0.3); flex-wrap: wrap; gap: 16px;
  }
  .fin-hero-title { font-size: 26px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .fin-hero-sub { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; }
  .fin-btn { padding: 10px 20px; background: white; color: #0d9488; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s; white-space: nowrap; }
  .fin-btn:hover { transform: translateY(-1px); }

  .fin-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
  .fin-kpi { background: white; border-radius: 14px; padding: 18px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent; transition: transform 0.15s; }
  .fin-kpi:hover { transform: translateY(-2px); }
  .fin-kpi-blue   { border-color: #3b82f6; }
  .fin-kpi-indigo { border-color: #6366f1; }
  .fin-kpi-green  { border-color: #10b981; }
  .fin-kpi-yellow { border-color: #eab308; }
  .fin-kpi-orange { border-color: #f59e0b; }
  .fin-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .fin-kpi-icon svg { width: 18px; height: 18px; }
  .fin-kpi-blue   .fin-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .fin-kpi-indigo .fin-kpi-icon { background: #eef2ff; color: #6366f1; }
  .fin-kpi-green  .fin-kpi-icon { background: #f0fdf4; color: #10b981; }
  .fin-kpi-yellow .fin-kpi-icon { background: #fefce8; color: #ca8a04; }
  .fin-kpi-orange .fin-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .fin-kpi-label { font-size: 10px; font-weight: 500; color: #64748b; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .fin-kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }
  .fin-kpi-pct   { font-size: 10px; color: #94a3b8; margin: 2px 0 0; }

  .fin-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 24px; }
  .fin-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .fin-card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 18px 0; }

  .fin-bar-track { display: flex; height: 12px; border-radius: 10px; overflow: hidden; background: #f1f5f9; margin-bottom: 16px; gap: 2px; }
  .fin-bar-fill { border-radius: 4px; }
  .fin-legend { display: flex; flex-wrap: wrap; gap: 16px; }
  .fin-legend-item { display: flex; align-items: center; gap: 8px; }
  .fin-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .fin-legend-label { font-size: 13px; color: #334155; }
  .fin-legend-count { font-size: 12px; color: #64748b; font-weight: 500; }

  .fin-search { padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; min-width: 260px; }
  .fin-search:focus { border-color: #0d9488; box-shadow: 0 0 0 2px rgba(13,148,136,0.1); }

  .fin-table-wrap { overflow-x: auto; }
  .fin-table { width: 100%; border-collapse: collapse; min-width: 760px; }
  .fin-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .fin-table td { padding: 11px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .fin-table tbody tr:hover { background: #f8fafc; }
  .fin-table tbody tr:last-child td { border-bottom: none; }
  .fin-muted { color: #64748b; font-size: 12px; }
  .fin-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .fin-empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }
  .fin-count { font-size: 12px; color: #94a3b8; margin: 12px 0 0; text-align: right; }
  .fin-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }

  @media (max-width: 1200px) { .fin-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) {
    .fin-wrap { padding: 16px; }
    .fin-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .fin-search { min-width: 100%; }
  }
`;
document.head.appendChild(finStyles);
