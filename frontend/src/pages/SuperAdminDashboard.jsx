import React, { useState, useEffect } from 'react';
import { getEmpresas } from '../services/empresasService';
import { getEquiposByEmpresa, getEquipos } from '../services/equiposService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLogoEmpresa } from '../utils/logos';
import { calcularGarantia } from '../utils/garantia';

function SuperAdminDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [equiposPorEmpresa, setEquiposPorEmpresa] = useState({});
  const [todosEquipos, setTodosEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [empresaAbierta, setEmpresaAbierta] = useState(null);
  const [empresaActiva, setEmpresaActiva] = useState(null); // null = todas

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [empresasData, todosData] = await Promise.all([
        getEmpresas(),
        getEquipos()
      ]);

      if (empresasData.success) {
        setEmpresas(empresasData.data);
        if (empresasData.data.length > 0) setEmpresaAbierta(empresasData.data[0].id);

        const mapa = {};
        await Promise.all(
          empresasData.data.map(async (emp) => {
            const eq = await getEquiposByEmpresa(emp.id);
            if (eq.success) mapa[emp.id] = eq.data;
          })
        );
        setEquiposPorEmpresa(mapa);
      }
      if (todosData.success) setTodosEquipos(todosData.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  // Equipos filtrados según empresa activa
  const equiposFiltrados = empresaActiva
    ? (equiposPorEmpresa[empresaActiva] || [])
    : todosEquipos;

  const total       = equiposFiltrados.length;
  const asignados   = equiposFiltrados.filter(e => e.estado === 'Asignado').length;
  const disponibles = equiposFiltrados.filter(e => e.estado === 'Disponible').length;
  const manten      = equiposFiltrados.filter(e => ['Mantenimiento', 'Dañado'].includes(e.estado)).length;

  const garantiasAlerta = equiposFiltrados.filter(eq => {
    if (!eq.garantia) return false;
    const g = calcularGarantia(eq.fecha_asignacion || eq.created_at, eq.garantia);
    return g.tiene && (g.estado === 'critica' || g.estado === 'proxima');
  }).sort((a, b) => {
    const ga = calcularGarantia(a.fecha_asignacion || a.created_at, a.garantia);
    const gb = calcularGarantia(b.fecha_asignacion || b.created_at, b.garantia);
    return ga.diasTotales - gb.diasTotales;
  }).slice(0, 6);

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

  if (cargando) return <div className="sa-loading">Cargando panel de administración...</div>;

  return (
    <div className="sa-wrap">
      {/* HERO + SELECTOR INTEGRADO */}
      <div className="sa-hero">
        <div className="sa-hero-top">
          <div>
            <h1 className="sa-hero-title">Panel de Administración</h1>
            <p className="sa-hero-sub">Bienvenido, <strong>{usuario?.nombre}</strong> &mdash; {fecha}</p>
          </div>
          <div className="sa-hero-actions">
            <button className="sa-btn-outline" onClick={() => navigate('/usuarios')}>Usuarios</button>
            <button className="sa-btn-white" onClick={() => navigate('/equipos')}>Inventario</button>
          </div>
        </div>

        {/* Selector empresa dentro del hero */}
        <div className="sa-hero-selector">
          <button
            className={`sa-hero-sel ${empresaActiva === null ? 'sa-hero-sel-active' : ''}`}
            onClick={() => setEmpresaActiva(null)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            Todas
          </button>
          {empresas.map(emp => {
            const logo = getLogoEmpresa(emp.nombre);
            return (
              <button
                key={emp.id}
                className={`sa-hero-sel ${empresaActiva === emp.id ? 'sa-hero-sel-active' : ''}`}
                onClick={() => setEmpresaActiva(emp.id)}
              >
                {logo && <img src={logo} alt="" style={{ height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />}
                {emp.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="sa-kpi-grid">
        <div className="sa-kpi sa-kpi-blue">
          <div className="sa-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <p className="sa-kpi-label">Empresas</p>
            <p className="sa-kpi-value">{empresas.length}</p>
          </div>
        </div>
        <div className="sa-kpi sa-kpi-indigo">
          <div className="sa-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div>
            <p className="sa-kpi-label">Total Equipos</p>
            <p className="sa-kpi-value">{total}</p>
          </div>
        </div>
        <div className="sa-kpi sa-kpi-green">
          <div className="sa-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="sa-kpi-label">Asignados</p>
            <p className="sa-kpi-value">{asignados}</p>
            <p className="sa-kpi-pct">{total ? Math.round(asignados/total*100) : 0}%</p>
          </div>
        </div>
        <div className="sa-kpi sa-kpi-teal">
          <div className="sa-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div>
            <p className="sa-kpi-label">Disponibles</p>
            <p className="sa-kpi-value">{disponibles}</p>
            <p className="sa-kpi-pct">{total ? Math.round(disponibles/total*100) : 0}%</p>
          </div>
        </div>
        <div className="sa-kpi sa-kpi-orange">
          <div className="sa-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <p className="sa-kpi-label">Mantenimiento</p>
            <p className="sa-kpi-value">{manten}</p>
            <p className="sa-kpi-pct">{total ? Math.round(manten/total*100) : 0}%</p>
          </div>
        </div>
      </div>


      {/* ALERTAS DE GARANTÍA */}
      {garantiasAlerta.length > 0 && (
        <div className="sa-empresa-card" style={{borderLeft:'4px solid #f59e0b',marginBottom:'20px'}}>
          <div className="sa-tabla-header" style={{paddingBottom:'12px'}}>
            <h2 className="sa-section-title" style={{margin:0}}>⚠ Garantías próximas a vencer</h2>
            <span style={{fontSize:'12px',color:'#64748b'}}>{garantiasAlerta.length} equipo{garantiasAlerta.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px',padding:'0 20px 16px'}}>
            {garantiasAlerta.map(eq => {
              const g = calcularGarantia(eq.fecha_asignacion || eq.created_at, eq.garantia);
              const critica = g.estado === 'critica';
              return (
                <div key={eq.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background: critica ? '#fef2f2' : '#fffbeb',borderRadius:'8px',border:`1px solid ${critica ? '#fecaca' : '#fde68a'}`}}>
                  <div>
                    <span style={{fontWeight:'600',fontSize:'13px',color:'#1e293b'}}>{eq.nombre_equipo}</span>
                    {eq.serial && <span style={{fontSize:'11px',color:'#94a3b8',marginLeft:'8px'}}>{eq.serial}</span>}
                    {eq.empresa_nombre && <span style={{fontSize:'11px',color:'#64748b',marginLeft:'8px'}}>· {eq.empresa_nombre}</span>}
                  </div>
                  <span style={{fontSize:'12px',fontWeight:'600',color: critica ? '#dc2626' : '#b45309',whiteSpace:'nowrap'}}>
                    {critica ? `Vence en ${g.diasTotales} día${g.diasTotales !== 1 ? 's' : ''}` : `~${g.dias + g.meses * 30 + g.años * 365} días restantes`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLA DE DISPOSITIVOS */}
      <div className="sa-empresa-card">
        <div className="sa-tabla-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {empresaActiva && getLogoEmpresa(empresas.find(e => e.id === empresaActiva)?.nombre) && (
              <img
                src={getLogoEmpresa(empresas.find(e => e.id === empresaActiva)?.nombre)}
                alt="" style={{ height: '32px', objectFit: 'contain' }}
              />
            )}
            <h2 className="sa-section-title" style={{ margin: 0 }}>
              {empresaActiva
                ? empresas.find(e => e.id === empresaActiva)?.nombre
                : 'Todos los equipos'}
            </h2>
          </div>
          <span className="sa-section-sub">{total} equipo{total !== 1 ? 's' : ''}</span>
        </div>

        {total === 0 ? (
          <p className="sa-empty">No hay equipos registrados</p>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Asignado a</th>
                  <th>Área</th>
                  {!empresaActiva && <th>Empresa</th>}
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.slice(0, 50).map(eq => {
                  const s = estadoStyle(eq.estado);
                  return (
                    <tr key={eq.id}>
                      <td className="sa-code">{eq.codigo || '-'}</td>
                      <td className="sa-name">{eq.nombre_equipo || '-'}</td>
                      <td className="sa-muted">{eq.tipo || '-'}</td>
                      <td><span className="sa-badge" style={s}>{eq.estado || '-'}</span></td>
                      <td>{eq.asignado_a || '-'}</td>
                      <td className="sa-muted">{eq.ubicacion || '-'}</td>
                      {!empresaActiva && <td className="sa-muted">{eq.empresa_nombre || '-'}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {total > 50 && (
              <p style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                Mostrando 50 de {total} — <button className="sa-link-btn" onClick={() => navigate('/equipos')}>Ver todos →</button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;

const saStyles = document.createElement('style');
saStyles.textContent = `
  .sa-wrap { padding: 28px; background: #f1f5f9; min-height: 100vh; }

  /* HERO */
  .sa-hero {
    background: linear-gradient(135deg, #0a1f44 0%, #0f2b5c 40%, #1a3d7c 80%, #2563eb 100%);
    border-radius: 20px; padding: 24px 28px; margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(10,31,68,0.3);
  }
  .sa-hero-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .sa-hero-title { font-size: 22px; font-weight: 700; color: white; margin: 0 0 4px 0; }
  .sa-hero-sub { color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; }
  .sa-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .sa-hero-selector {
    display: flex; gap: 8px; overflow-x: auto; flex-wrap: wrap;
    scrollbar-width: none;
  }
  .sa-hero-sel {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.1); color: white; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .sa-hero-sel:hover { background: rgba(255,255,255,0.2); }
  .sa-hero-sel-active { background: white !important; color: #0f2b5c !important; border-color: white !important; font-weight: 600; }
  .sa-btn-white {
    padding: 10px 20px; background: white; color: #0f2b5c;
    border: none; border-radius: 10px; font-weight: 600; font-size: 14px;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s;
  }
  .sa-btn-white:hover { transform: translateY(-1px); }
  .sa-btn-outline {
    padding: 10px 20px; background: rgba(255,255,255,0.12); color: white;
    border: 1px solid rgba(255,255,255,0.3); border-radius: 10px;
    font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;
  }
  .sa-btn-outline:hover { background: rgba(255,255,255,0.2); }

  /* KPI */
  .sa-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
  .sa-kpi {
    background: white; border-radius: 12px; padding: 14px 12px;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07); border-left: 3px solid transparent;
  }
  .sa-kpi-blue   { border-color: #3b82f6; }
  .sa-kpi-indigo { border-color: #6366f1; }
  .sa-kpi-green  { border-color: #10b981; }
  .sa-kpi-teal   { border-color: #06b6d4; }
  .sa-kpi-orange { border-color: #f59e0b; }
  .sa-kpi-icon {
    width: 36px; height: 36px; border-radius: 9px; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sa-kpi-icon svg { width: 16px; height: 16px; }
  .sa-kpi-blue   .sa-kpi-icon { background: #eff6ff; color: #3b82f6; }
  .sa-kpi-indigo .sa-kpi-icon { background: #eef2ff; color: #6366f1; }
  .sa-kpi-green  .sa-kpi-icon { background: #f0fdf4; color: #10b981; }
  .sa-kpi-teal   .sa-kpi-icon { background: #ecfeff; color: #06b6d4; }
  .sa-kpi-orange .sa-kpi-icon { background: #fff7ed; color: #f59e0b; }
  .sa-kpi-label { font-size: 10px; font-weight: 500; color: #64748b; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .sa-kpi-value { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }
  .sa-kpi-pct   { font-size: 10px; color: #94a3b8; margin: 1px 0 0 0; }

  .sa-tabla-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
  }
  .sa-link-btn { background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; }

  /* SECTION TITLE */
  .sa-section-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }
  .sa-section-sub { font-size: 13px; color: #94a3b8; }

  /* EMPRESA CARD */
  .sa-empresa-card {
    background: white; border-radius: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden;
  }

  /* TABLE */
  .sa-table-wrap { overflow-x: auto; }
  .sa-table { width: 100%; border-collapse: collapse; }
  .sa-table th {
    padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600;
    color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .sa-table td { padding: 12px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f8fafc; }
  .sa-table tbody tr:last-child td { border-bottom: none; }
  .sa-table tbody tr:hover { background: #f8fafc; }
  .sa-code { font-weight: 600; color: #0f172a; }
  .sa-name { font-weight: 500; }
  .sa-muted { color: #64748b; font-size: 12px; }
  .sa-badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500; white-space: nowrap;
  }
  .sa-empty { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; margin: 0; }
  .sa-loading { display: flex; align-items: center; justify-content: center; height: 60vh; font-size: 15px; color: #64748b; }

  @media (max-width: 1200px) {
    .sa-kpi-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .sa-wrap { padding: 16px; }
    .sa-hero { padding: 24px 20px; }
    .sa-hero-title { font-size: 22px; }
    .sa-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  }
`;
document.head.appendChild(saStyles);
