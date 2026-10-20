import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLogoEmpresa } from '../utils/logos';
import { estiloBadgeEstado } from '../utils/estados';

function LogisticaDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [empresaActiva, setEmpresaActiva] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [eqRes, empRes] = await Promise.all([getEquipos(), getEmpresas()]);
      if (eqRes?.data)  setEquipos(eqRes.data);
      if (empRes?.data) { setEmpresas(empRes.data); if (empRes.data.length > 0) setEmpresaActiva(empRes.data[0].id); }
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const lista = empresaActiva
    ? equipos.filter(e => e.empresa_id === empresaActiva || e.prestado_a_empresa_id === empresaActiva)
    : equipos;

  const total       = lista.length;
  const asignados   = lista.filter(e => e.estado === 'Asignado').length;
  const disponibles = lista.filter(e => e.estado === 'Disponible').length;
  const prestamos   = lista.filter(e => e.estado === 'Préstamo').length;
  const manten      = lista.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado)).length;
  const baja        = lista.filter(e => ['Baja', 'Canibalizar'].includes(e.estado)).length;

  const segmentos = [
    { label: 'Asignados',     count: asignados,   color: '#3b82f6' },
    { label: 'Disponibles',   count: disponibles, color: '#10b981' },
    { label: 'En Préstamo',   count: prestamos,   color: '#eab308' },
    { label: 'Mantenimiento', count: manten,      color: '#f59e0b' },
    { label: 'Baja',          count: baja,        color: '#94a3b8' },
  ].filter(s => s.count > 0);

  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const estadoStyle = estiloBadgeEstado;

  if (cargando) return <div className="ld-loading">Cargando panel...</div>;

  return (
    <div className="ld-wrap">
      <div className="ld-hero">
        <div>
          <h1 className="ld-hero-title">Panel de Logística</h1>
          <p className="ld-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="ld-btn-outline" onClick={() => navigate('/auditoria')}>Auditoría</button>
          <button className="ld-btn-white" onClick={() => navigate('/equipos')}>Inventario</button>
        </div>
      </div>

      {empresas.length > 1 && (
        <div className="ld-selector-scroll">
          {empresas.map(emp => {
            const logo = getLogoEmpresa(emp.nombre);
            const activa = empresaActiva === emp.id;
            return (
              <button key={emp.id} className={`ld-sel-card ${activa ? 'ld-sel-card-active' : ''}`} onClick={() => setEmpresaActiva(emp.id)}>
                <div className="ld-sel-avatar">
                  {logo ? <img src={logo} alt={emp.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                        : <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{emp.nombre.charAt(0)}</span>}
                </div>
                <p className="ld-sel-name">{emp.nombre}</p>
                <p className="ld-sel-count">{equipos.filter(e => e.empresa_id === emp.id).length} eq.</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="ld-kpi-grid">
        {[
          { label: 'Total Equipos', value: total, cls: 'ld-kpi-blue', icon: <rect x="2" y="3" width="20" height="14" rx="2"/> },
          { label: 'Disponibles',   value: disponibles, pct: total ? Math.round(disponibles/total*100) : 0, cls: 'ld-kpi-green',  icon: <path d="M20 6L9 17l-5-5"/> },
          { label: 'Asignados',     value: asignados,   pct: total ? Math.round(asignados/total*100) : 0,   cls: 'ld-kpi-indigo', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></> },
          { label: 'En Préstamo',   value: prestamos,   pct: total ? Math.round(prestamos/total*100) : 0,   cls: 'ld-kpi-yellow', icon: <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/> },
          { label: 'Mantenimiento', value: manten,      pct: total ? Math.round(manten/total*100) : 0,      cls: 'ld-kpi-orange', icon: <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/> },
        ].map(k => (
          <div key={k.label} className={`ld-kpi ${k.cls}`}>
            <div className="ld-kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.icon}</svg>
            </div>
            <div>
              <p className="ld-kpi-label">{k.label}</p>
              <p className="ld-kpi-value">{k.value}</p>
              {k.pct !== undefined && <p className="ld-kpi-pct">{k.pct}% del total</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="ld-row">
        {total > 0 && (
          <div className="ld-card">
            <h2 className="ld-card-title">Distribución del inventario</h2>
            <div className="ld-bar-track">
              {segmentos.map(s => (
                <div key={s.label} title={`${s.label}: ${s.count}`}
                  style={{ flex: s.count, backgroundColor: s.color }} className="ld-bar-fill" />
              ))}
            </div>
            <div className="ld-legend">
              {segmentos.map(s => (
                <div key={s.label} className="ld-legend-item">
                  <span className="ld-legend-dot" style={{ backgroundColor: s.color }} />
                  <span className="ld-legend-label">{s.label}</span>
                  <span className="ld-legend-count">{s.count} ({Math.round(s.count / total * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ld-card">
          <h2 className="ld-card-title">Acciones de Logística</h2>
          <div className="ld-quick-list">
            <button className="ld-quick-item" onClick={() => navigate('/equipos')}>
              <span className="ld-quick-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>+</span>
              <div><p className="ld-quick-name">Agregar Equipo</p><p className="ld-quick-desc">Registrar nuevo dispositivo</p></div>
            </button>
            <button className="ld-quick-item" onClick={() => navigate('/equipos')}>
              <span className="ld-quick-icon" style={{ background: '#ecfdf5', color: '#059669' }}>↑</span>
              <div><p className="ld-quick-name">Importar Excel</p><p className="ld-quick-desc">Carga masiva de equipos</p></div>
            </button>
            <button className="ld-quick-item" onClick={() => navigate('/equipos')}>
              <span className="ld-quick-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>≡</span>
              <div><p className="ld-quick-name">Ver Inventario</p><p className="ld-quick-desc">Lista completa y filtros</p></div>
            </button>
            <button className="ld-quick-item" onClick={() => navigate('/auditoria')}>
              <span className="ld-quick-icon" style={{ background: '#fefce8', color: '#d97706' }}>📋</span>
              <div><p className="ld-quick-name">Ver Auditoría</p><p className="ld-quick-desc">Registro de movimientos</p></div>
            </button>
          </div>
        </div>
      </div>

      <div className="ld-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="ld-card-title" style={{ margin: 0 }}>Equipos del inventario</h2>
          <button className="ld-link-btn" onClick={() => navigate('/equipos')}>Ver todos →</button>
        </div>
        <div className="ld-table-wrap">
          <table className="ld-table">
            <thead>
              <tr>
                <th>Equipo</th><th>Tipo</th><th>Serial</th><th>Estado</th><th>Asignado a</th><th>Proceso</th>
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, 10).length === 0 ? (
                <tr><td colSpan="6" className="ld-empty">Sin equipos registrados</td></tr>
              ) : (
                lista.slice(0, 10).map(eq => (
                  <tr key={eq.id}>
                    <td style={{ fontWeight: 500 }}>{eq.nombre_equipo || '-'}</td>
                    <td className="ld-muted">{eq.tipo_nombre || '-'}</td>
                    <td className="ld-muted">{eq.serial || '-'}</td>
                    <td><span className="ld-badge" style={estadoStyle(eq.estado)}>{eq.estado || '-'}</span></td>
                    <td>{eq.asignado_a || '-'}</td>
                    <td className="ld-muted">{eq.proceso_nombre || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LogisticaDashboard;

const ldStyles = document.createElement('style');
ldStyles.textContent = `
  .ld-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  .ld-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(6,78,59,0.3); flex-wrap: wrap; gap: 16px;
  }
  .ld-hero-title { font-size: 26px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .ld-hero-sub { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; }
  .ld-btn-white { padding: 10px 20px; background: white; color: #065f46; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s; }
  .ld-btn-white:hover { transform: translateY(-1px); }
  .ld-btn-outline { padding: 10px 20px; background: rgba(255,255,255,0.12); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; }
  .ld-btn-outline:hover { background: rgba(255,255,255,0.22); }

  .ld-selector-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 24px; }
  .ld-sel-card { flex-shrink: 0; width: 120px; background: white; border-radius: 14px; padding: 14px 10px; border: 2px solid transparent; cursor: pointer; text-align: center; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.08); display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ld-sel-card:hover { border-color: #6ee7b7; }
  .ld-sel-card-active { border-color: #059669 !important; background: #ecfdf5 !important; }
  .ld-sel-avatar { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #065f46, #059669); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .ld-sel-name { font-size: 11px; font-weight: 600; color: #0f172a; margin: 0; line-height: 1.3; }
  .ld-sel-count { font-size: 10px; color: #94a3b8; margin: 0; }

  .ld-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
  .ld-kpi { background: white; border-radius: 14px; padding: 18px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent; transition: transform 0.15s; }
  .ld-kpi:hover { transform: translateY(-2px); }
  .ld-kpi-blue   { border-color: #3b82f6; }
  .ld-kpi-green  { border-color: #10b981; }
  .ld-kpi-indigo { border-color: #6366f1; }
  .ld-kpi-yellow { border-color: #eab308; }
  .ld-kpi-orange { border-color: #f59e0b; }
  .ld-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ld-kpi-icon svg { width: 18px; height: 18px; }
  .ld-kpi-blue   .ld-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .ld-kpi-green  .ld-kpi-icon { background: #f0fdf4; color: #10b981; }
  .ld-kpi-indigo .ld-kpi-icon { background: #eef2ff; color: #6366f1; }
  .ld-kpi-yellow .ld-kpi-icon { background: #fefce8; color: #ca8a04; }
  .ld-kpi-orange .ld-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .ld-kpi-label { font-size: 10px; font-weight: 500; color: #64748b; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .ld-kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }
  .ld-kpi-pct   { font-size: 10px; color: #94a3b8; margin: 2px 0 0; }

  .ld-row { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
  .ld-card { flex: 1; min-width: 280px; background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 20px; }
  .ld-card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 18px 0; }

  .ld-bar-track { display: flex; height: 12px; border-radius: 10px; overflow: hidden; background: #f1f5f9; margin-bottom: 16px; gap: 2px; }
  .ld-bar-fill { border-radius: 4px; }
  .ld-legend { display: flex; flex-direction: column; gap: 8px; }
  .ld-legend-item { display: flex; align-items: center; gap: 8px; }
  .ld-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .ld-legend-label { font-size: 13px; color: #334155; flex: 1; }
  .ld-legend-count { font-size: 12px; color: #64748b; font-weight: 500; }

  .ld-quick-list { display: flex; flex-direction: column; gap: 8px; }
  .ld-quick-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 10px; border: 1px solid #f1f5f9; background: transparent; cursor: pointer; text-align: left; width: 100%; transition: background 0.15s; }
  .ld-quick-item:hover { background: #f8fafc; }
  .ld-quick-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; font-weight: 700; }
  .ld-quick-name { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
  .ld-quick-desc { font-size: 11px; color: #94a3b8; margin: 0; }

  .ld-table-wrap { overflow-x: auto; }
  .ld-table { width: 100%; border-collapse: collapse; }
  .ld-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .ld-table td { padding: 11px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .ld-table tbody tr:hover { background: #f8fafc; }
  .ld-table tbody tr:last-child td { border-bottom: none; }
  .ld-muted { color: #64748b; font-size: 12px; }
  .ld-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .ld-empty { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; }
  .ld-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }
  .ld-link-btn { background: none; border: none; color: #3b82f6; font-size: 13px; font-weight: 500; cursor: pointer; }

  @media (max-width: 1200px) { .ld-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) {
    .ld-wrap { padding: 16px; }
    .ld-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;
document.head.appendChild(ldStyles);
