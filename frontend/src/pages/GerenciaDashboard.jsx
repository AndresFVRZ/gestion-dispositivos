import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calcularGarantia } from '../utils/garantia';
import { getLogoEmpresa } from '../utils/logos';

function GerenciaDashboard() {
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
    ? equipos.filter(e => e.empresa_id === empresaActiva)
    : equipos;

  const total       = lista.length;
  const enBaja      = lista.filter(e => e.estado === 'Baja');
  const canibalizar = lista.filter(e => e.estado === 'Canibalizar');
  const activos     = lista.filter(e => !['Baja', 'Canibalizar'].includes(e.estado)).length;

  const garantiasAlerta = lista.filter(eq => {
    if (!eq.garantia || !eq.fecha_garantia) return false;
    const g = calcularGarantia(eq.fecha_garantia, eq.garantia);
    return g.tiene && (g.estado === 'critica' || g.estado === 'proxima');
  }).sort((a, b) => {
    const ga = calcularGarantia(a.fecha_garantia, a.garantia);
    const gb = calcularGarantia(b.fecha_garantia, b.garantia);
    return ga.diasTotales - gb.diasTotales;
  }).slice(0, 5);

  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (cargando) return <div className="ger-loading">Cargando panel...</div>;

  return (
    <div className="ger-wrap">
      <div className="ger-hero">
        <div>
          <h1 className="ger-hero-title">Panel de Gerencia</h1>
          <p className="ger-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="ger-btn-outline" onClick={() => navigate('/auditoria')}>Auditoría</button>
          <button className="ger-btn-white" onClick={() => navigate('/equipos')}>Inventario</button>
        </div>
      </div>

      {empresas.length > 1 && (
        <div className="ger-selector-scroll">
          <button className={`ger-sel-pill ${empresaActiva === null ? 'active' : ''}`} onClick={() => setEmpresaActiva(null)}>
            Todas
          </button>
          {empresas.map(emp => {
            const logo = getLogoEmpresa(emp.nombre);
            return (
              <button key={emp.id} className={`ger-sel-pill ${empresaActiva === emp.id ? 'active' : ''}`} onClick={() => setEmpresaActiva(emp.id)}>
                {logo && <img src={logo} alt="" style={{ height: '14px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />}
                {emp.nombre}
              </button>
            );
          })}
        </div>
      )}

      <div className="ger-kpi-grid">
        <div className="ger-kpi ger-kpi-slate">
          <div className="ger-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div><p className="ger-kpi-label">Total Equipos</p><p className="ger-kpi-value">{total}</p></div>
        </div>
        <div className="ger-kpi ger-kpi-green">
          <div className="ger-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="ger-kpi-label">Equipos Activos</p>
            <p className="ger-kpi-value">{activos}</p>
            <p className="ger-kpi-pct">{total ? Math.round(activos / total * 100) : 0}%</p>
          </div>
        </div>
        <div className="ger-kpi ger-kpi-red">
          <div className="ger-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </div>
          <div>
            <p className="ger-kpi-label">En Baja</p>
            <p className="ger-kpi-value">{enBaja.length}</p>
          </div>
        </div>
        <div className="ger-kpi ger-kpi-purple">
          <div className="ger-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <p className="ger-kpi-label">Canibalizar</p>
            <p className="ger-kpi-value">{canibalizar.length}</p>
          </div>
        </div>
        <div className="ger-kpi ger-kpi-yellow">
          <div className="ger-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </div>
          <div>
            <p className="ger-kpi-label">Garantías por Vencer</p>
            <p className="ger-kpi-value">{garantiasAlerta.length}</p>
          </div>
        </div>
      </div>

      <div className="ger-row">
        {/* Equipos en Baja */}
        <div className="ger-card" style={{ flex: 3 }}>
          <h2 className="ger-card-title">Equipos dados de Baja / Canibalizar</h2>
          {[...enBaja, ...canibalizar].length === 0 ? (
            <div className="ger-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M20 6L9 17l-5-5"/></svg>
              <p>Sin equipos dados de baja</p>
            </div>
          ) : (
            <div className="ger-table-wrap">
              <table className="ger-table">
                <thead>
                  <tr><th>Equipo</th><th>Serial</th><th>Estado</th><th>Observaciones</th></tr>
                </thead>
                <tbody>
                  {[...enBaja, ...canibalizar].slice(0, 10).map(eq => (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 500 }}>{eq.nombre_equipo || '-'}</td>
                      <td className="ger-muted">{eq.serial || '-'}</td>
                      <td>
                        <span className="ger-badge" style={
                          eq.estado === 'Baja'
                            ? { background: '#f1f5f9', color: '#475569' }
                            : { background: '#fdf4ff', color: '#7c3aed' }
                        }>{eq.estado}</span>
                      </td>
                      <td className="ger-muted" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {eq.observaciones || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Garantías por vencer */}
        <div className="ger-card" style={{ flex: 2 }}>
          <h2 className="ger-card-title">Garantías próximas a vencer</h2>
          {garantiasAlerta.length === 0 ? (
            <div className="ger-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path d="M20 6L9 17l-5-5"/></svg>
              <p style={{ color: '#10b981' }}>Sin alertas de garantía</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {garantiasAlerta.map(eq => {
                const g = calcularGarantia(eq.fecha_garantia, eq.garantia);
                const critica = g.estado === 'critica';
                return (
                  <div key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: critica ? '#fef2f2' : '#fffbeb', borderRadius: '8px', border: `1px solid ${critica ? '#fecaca' : '#fde68a'}` }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{eq.nombre_equipo}</p>
                      {eq.serial && <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{eq.serial}</p>}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: critica ? '#dc2626' : '#b45309', whiteSpace: 'nowrap' }}>
                      {critica ? `${g.diasTotales}d` : `~${g.diasTotales}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Acciones de Gerencia</p>
            <button className="ger-action-btn" onClick={() => navigate('/equipos')}>
              Gestionar Bajas y Canibalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GerenciaDashboard;

const gerStyles = document.createElement('style');
gerStyles.textContent = `
  .ger-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  .ger-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(15,23,42,0.4); flex-wrap: wrap; gap: 16px;
  }
  .ger-hero-title { font-size: 26px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .ger-hero-sub { color: rgba(255,255,255,0.65); font-size: 14px; margin: 0; }
  .ger-btn-white { padding: 10px 20px; background: white; color: #1e293b; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: transform 0.15s; }
  .ger-btn-white:hover { transform: translateY(-1px); }
  .ger-btn-outline { padding: 10px 20px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; }
  .ger-btn-outline:hover { background: rgba(255,255,255,0.18); }

  .ger-selector-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 24px; flex-wrap: wrap; }
  .ger-sel-pill { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; color: #334155; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .ger-sel-pill:hover { border-color: #cbd5e1; background: #f8fafc; }
  .ger-sel-pill.active { background: #1e293b; color: white; border-color: #1e293b; }

  .ger-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
  .ger-kpi { background: white; border-radius: 14px; padding: 18px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent; transition: transform 0.15s; }
  .ger-kpi:hover { transform: translateY(-2px); }
  .ger-kpi-slate  { border-color: #64748b; }
  .ger-kpi-green  { border-color: #10b981; }
  .ger-kpi-red    { border-color: #ef4444; }
  .ger-kpi-purple { border-color: #8b5cf6; }
  .ger-kpi-yellow { border-color: #eab308; }
  .ger-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ger-kpi-icon svg { width: 18px; height: 18px; }
  .ger-kpi-slate  .ger-kpi-icon { background: #f1f5f9; color: #64748b; }
  .ger-kpi-green  .ger-kpi-icon { background: #f0fdf4; color: #10b981; }
  .ger-kpi-red    .ger-kpi-icon { background: #fef2f2; color: #ef4444; }
  .ger-kpi-purple .ger-kpi-icon { background: #fdf4ff; color: #8b5cf6; }
  .ger-kpi-yellow .ger-kpi-icon { background: #fefce8; color: #ca8a04; }
  .ger-kpi-label { font-size: 10px; font-weight: 500; color: #64748b; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .ger-kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }
  .ger-kpi-pct   { font-size: 10px; color: #94a3b8; margin: 2px 0 0; }

  .ger-row { display: flex; gap: 20px; flex-wrap: wrap; }
  .ger-card { flex: 1; min-width: 280px; background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .ger-card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0; }

  .ger-table-wrap { overflow-x: auto; }
  .ger-table { width: 100%; border-collapse: collapse; }
  .ger-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .ger-table td { padding: 11px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .ger-table tbody tr:hover { background: #f8fafc; }
  .ger-table tbody tr:last-child td { border-bottom: none; }
  .ger-muted { color: #64748b; font-size: 12px; }
  .ger-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .ger-empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #94a3b8; text-align: center; }
  .ger-empty-state svg { color: #e2e8f0; }
  .ger-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }
  .ger-action-btn {
    width: 100%; padding: 10px; background: #1e293b; color: white; border: none;
    border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.15s;
  }
  .ger-action-btn:hover { background: #334155; }

  @media (max-width: 1200px) { .ger-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) {
    .ger-wrap { padding: 16px; }
    .ger-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .ger-row { flex-direction: column; }
  }
`;
document.head.appendChild(gerStyles);
