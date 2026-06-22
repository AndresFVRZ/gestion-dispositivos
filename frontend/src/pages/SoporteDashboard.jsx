import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { getMantenimientos } from '../services/mantenimientosService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SoporteDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [eqRes, mantRes] = await Promise.all([getEquipos(), getMantenimientos()]);
      if (eqRes?.data)   setEquipos(eqRes.data);
      if (mantRes?.data) setMantenimientos(mantRes.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const pendientes   = mantenimientos.filter(m => m.estado === 'pendiente' || m.estado === 'en_proceso');
  const completados  = mantenimientos.filter(m => m.estado === 'completado').length;
  const sinAsignar   = equipos.filter(e => !e.asignado_a && e.estado === 'Disponible');
  const sinProceso   = equipos.filter(e => !e.proceso_id && e.estado !== 'Baja' && e.estado !== 'Canibalizar');
  const enManten     = equipos.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado));

  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const estadoMantStyle = (estado) => {
    const map = {
      'pendiente':   { background: '#fef3c7', color: '#b45309' },
      'en_proceso':  { background: '#dbeafe', color: '#1d4ed8' },
      'completado':  { background: '#d1fae5', color: '#065f46' },
      'rechazado':   { background: '#fee2e2', color: '#dc2626' },
    };
    return map[estado] || { background: '#f1f5f9', color: '#475569' };
  };

  const estadoMantTexto = (estado) => ({
    pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado', rechazado: 'Rechazado',
  }[estado] || estado);

  if (cargando) return <div className="sd-loading">Cargando panel...</div>;

  return (
    <div className="sd-wrap">
      <div className="sd-hero">
        <div>
          <h1 className="sd-hero-title">Panel de Soporte</h1>
          <p className="sd-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="sd-btn-outline" onClick={() => navigate('/historial')}>Historial</button>
          <button className="sd-btn-white" onClick={() => navigate('/mantenimientos')}>Mantenimientos</button>
        </div>
      </div>

      <div className="sd-kpi-grid">
        <div className="sd-kpi sd-kpi-orange">
          <div className="sd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <p className="sd-kpi-label">Mantenimientos Pendientes</p>
            <p className="sd-kpi-value">{pendientes.length}</p>
          </div>
        </div>
        <div className="sd-kpi sd-kpi-green">
          <div className="sd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="sd-kpi-label">Mantenimientos Completados</p>
            <p className="sd-kpi-value">{completados}</p>
          </div>
        </div>
        <div className="sd-kpi sd-kpi-blue">
          <div className="sd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div>
            <p className="sd-kpi-label">Equipos en Mantenimiento</p>
            <p className="sd-kpi-value">{enManten.length}</p>
          </div>
        </div>
        <div className="sd-kpi sd-kpi-yellow">
          <div className="sd-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div>
            <p className="sd-kpi-label">Sin Proceso Asignado</p>
            <p className="sd-kpi-value">{sinProceso.length}</p>
          </div>
        </div>
      </div>

      <div className="sd-row">
        {/* Mantenimientos pendientes */}
        <div className="sd-card" style={{ flex: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="sd-card-title" style={{ margin: 0 }}>Mantenimientos activos</h2>
            <button className="sd-link-btn" onClick={() => navigate('/mantenimientos')}>Ver todos →</button>
          </div>
          {pendientes.length === 0 ? (
            <div className="sd-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M20 6L9 17l-5-5"/></svg>
              <p>Sin mantenimientos pendientes</p>
            </div>
          ) : (
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead>
                  <tr><th>Equipo</th><th>Tipo</th><th>Descripción</th><th>Estado</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {pendientes.slice(0, 8).map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.equipo_nombre || m.nombre_equipo || '-'}</td>
                      <td className="sd-muted">{m.tipo || '-'}</td>
                      <td className="sd-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion || '-'}</td>
                      <td><span className="sd-badge" style={estadoMantStyle(m.estado)}>{estadoMantTexto(m.estado)}</span></td>
                      <td className="sd-muted">{m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString('es-CO') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Equipos sin proceso */}
        <div className="sd-card" style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="sd-card-title" style={{ margin: 0 }}>Sin proceso asignado</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{sinProceso.length}</span>
          </div>
          {sinProceso.length === 0 ? (
            <div className="sd-empty-state">
              <p style={{ color: '#10b981', fontWeight: 600 }}>Todos los equipos tienen proceso</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sinProceso.slice(0, 6).map(eq => (
                <div key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{eq.nombre_equipo}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{eq.serial || 'Sin serial'}</p>
                  </div>
                  <button className="sd-link-btn" onClick={() => navigate('/equipos')}>Asignar →</button>
                </div>
              ))}
              {sinProceso.length > 6 && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                  +{sinProceso.length - 6} más
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SoporteDashboard;

const sdStyles = document.createElement('style');
sdStyles.textContent = `
  .sd-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  .sd-hero {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #7c2d12 0%, #c2410c 60%, #f97316 100%);
    border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(124,45,18,0.3); flex-wrap: wrap; gap: 16px;
  }
  .sd-hero-title { font-size: 26px; font-weight: 700; color: white; margin: 0 0 6px 0; }
  .sd-hero-sub { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; }
  .sd-btn-white { padding: 10px 20px; background: white; color: #c2410c; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s; }
  .sd-btn-white:hover { transform: translateY(-1px); }
  .sd-btn-outline { padding: 10px 20px; background: rgba(255,255,255,0.12); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; }
  .sd-btn-outline:hover { background: rgba(255,255,255,0.22); }

  .sd-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .sd-kpi { background: white; border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid transparent; transition: transform 0.15s; }
  .sd-kpi:hover { transform: translateY(-2px); }
  .sd-kpi-orange { border-color: #f59e0b; }
  .sd-kpi-green  { border-color: #10b981; }
  .sd-kpi-blue   { border-color: #3b82f6; }
  .sd-kpi-yellow { border-color: #eab308; }
  .sd-kpi-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sd-kpi-icon svg { width: 20px; height: 20px; }
  .sd-kpi-orange .sd-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .sd-kpi-green  .sd-kpi-icon { background: #f0fdf4; color: #10b981; }
  .sd-kpi-blue   .sd-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .sd-kpi-yellow .sd-kpi-icon { background: #fefce8; color: #ca8a04; }
  .sd-kpi-label { font-size: 11px; font-weight: 500; color: #64748b; margin: 0 0 3px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .sd-kpi-value { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }

  .sd-row { display: flex; gap: 20px; flex-wrap: wrap; }
  .sd-card { flex: 1; min-width: 280px; background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .sd-card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0; }

  .sd-table-wrap { overflow-x: auto; }
  .sd-table { width: 100%; border-collapse: collapse; }
  .sd-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .sd-table td { padding: 11px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .sd-table tbody tr:hover { background: #f8fafc; }
  .sd-table tbody tr:last-child td { border-bottom: none; }
  .sd-muted { color: #64748b; font-size: 12px; }
  .sd-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .sd-empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #94a3b8; text-align: center; }
  .sd-empty-state svg { color: #e2e8f0; }
  .sd-loading { text-align: center; padding: 80px; color: #64748b; font-size: 14px; }
  .sd-link-btn { background: none; border: none; color: #3b82f6; font-size: 13px; font-weight: 500; cursor: pointer; }

  @media (max-width: 900px) {
    .sd-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .sd-row { flex-direction: column; }
  }
  @media (max-width: 640px) { .sd-wrap { padding: 16px; } }
`;
document.head.appendChild(sdStyles);
