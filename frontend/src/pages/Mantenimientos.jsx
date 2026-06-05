import React, { useState, useEffect } from 'react';
import { getMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento } from '../services/mantenimientosService';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TIPOS = ['Preventivo', 'Correctivo', 'Actualización', 'Limpieza', 'Diagnóstico', 'Otro'];
const TIPO_COLOR = {
  Preventivo:    { bg: '#f0fdf4', color: '#15803d' },
  Correctivo:    { bg: '#fef2f2', color: '#dc2626' },
  'Actualización': { bg: '#eff6ff', color: '#1d4ed8' },
  Limpieza:      { bg: '#f0fdfa', color: '#0f766e' },
  Diagnóstico:   { bg: '#fefce8', color: '#b45309' },
  Otro:          { bg: '#f8fafc', color: '#475569' },
};

const VACIO = { equipo_id: '', fecha_mantenimiento: new Date().toISOString().slice(0,10), tipo: 'Preventivo', descripcion: '', tecnico: '', costo: '' };

function Mantenimientos() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === 'super_admin';

  const [registros, setRegistros]   = useState([]);
  const [equipos, setEquipos]       = useState([]);
  const [empresas, setEmpresas]     = useState([]);
  const [cargando, setCargando]     = useState(true);

  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEquipo, setFiltroEquipo]   = useState('');
  const [filtroTipo, setFiltroTipo]       = useState('');
  const [busqueda, setBusqueda]           = useState('');

  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [form, setForm]             = useState(VACIO);
  const [errorForm, setErrorForm]   = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [mRes, eqRes, empRes] = await Promise.all([
        getMantenimientos(),
        getEquipos(),
        getEmpresas(),
      ]);
      if (mRes.success)   setRegistros(mRes.data);
      if (eqRes.success)  setEquipos(eqRes.data);
      if (empRes.success) setEmpresas(empRes.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setCargando(false); }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...VACIO });
    setErrorForm('');
    setModal(true);
  };

  const abrirEditar = (r) => {
    setEditando(r);
    setForm({
      equipo_id:          r.equipo_id,
      fecha_mantenimiento: r.fecha_mantenimiento?.slice(0, 10) || '',
      tipo:               r.tipo,
      descripcion:        r.descripcion || '',
      tecnico:            r.tecnico || '',
      costo:              r.costo || '',
    });
    setErrorForm('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      const r = editando
        ? await actualizarMantenimiento(editando.id, form)
        : await crearMantenimiento(form);
      if (r.success) {
        toast.success(editando ? 'Mantenimiento actualizado' : 'Mantenimiento registrado');
        setModal(false);
        cargarDatos();
      } else {
        setErrorForm(r.message || 'Error al guardar');
      }
    } catch { setErrorForm('Error de conexión'); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async () => {
    try {
      const r = await eliminarMantenimiento(confirmEliminar.id);
      if (r.success) { toast.success('Mantenimiento eliminado'); cargarDatos(); }
      else toast.error(r.message);
    } catch { toast.error('Error al eliminar'); }
    finally { setConfirmEliminar(null); }
  };

  // Equipos filtrados por empresa activa (para el dropdown del modal)
  const equiposDelForm = filtroEmpresa
    ? equipos.filter(eq => String(eq.empresa_id) === String(filtroEmpresa))
    : equipos;

  const listaFiltrada = registros.filter(r => {
    if (filtroEmpresa && String(r.empresa_id) !== String(filtroEmpresa)) return false;
    if (filtroEquipo  && String(r.equipo_id)  !== String(filtroEquipo))  return false;
    if (filtroTipo    && r.tipo !== filtroTipo)                           return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!r.nombre_equipo?.toLowerCase().includes(q) &&
          !r.tecnico?.toLowerCase().includes(q) &&
          !r.descripcion?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalCosto = listaFiltrada.reduce((s, r) => s + (parseFloat(r.costo) || 0), 0);

  const fmtFecha = (f) => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtCosto = (c) => c ? `$${parseFloat(c).toLocaleString('es-CO')}` : '—';

  return (
    <div className="mant-page">
      <style>{CSS}</style>

      <div className="mant-header">
        <div>
          <h1>Mantenimientos</h1>
          <p>{registros.length} registro{registros.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Registrar mantenimiento</button>
      </div>

      {/* Filtros */}
      <div className="mant-filters">
        <input className="filter-input" placeholder="Buscar equipo, técnico, descripción..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        {esSuperAdmin && (
          <select className="filter-select" value={filtroEmpresa} onChange={e => { setFiltroEmpresa(e.target.value); setFiltroEquipo(''); }}>
            <option value="">Todas las empresas</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
          </select>
        )}
        <select className="filter-select" value={filtroEquipo} onChange={e => setFiltroEquipo(e.target.value)}>
          <option value="">Todos los equipos</option>
          {(filtroEmpresa ? equipos.filter(eq => String(eq.empresa_id) === String(filtroEmpresa)) : equipos)
            .map(eq => <option key={eq.id} value={eq.id}>{eq.nombre_equipo}{eq.serial ? ` — ${eq.serial}` : ''}</option>)}
        </select>
        <select className="filter-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Resumen */}
      {listaFiltrada.length > 0 && (
        <div className="mant-resumen">
          <span>{listaFiltrada.length} registro{listaFiltrada.length !== 1 ? 's' : ''}</span>
          {totalCosto > 0 && <span>Costo total: <strong>{fmtCosto(totalCosto)}</strong></span>}
        </div>
      )}

      {/* Tabla */}
      {cargando ? (
        <div className="mant-loading"><div className="spinner-sm" />Cargando...</div>
      ) : listaFiltrada.length === 0 ? (
        <div className="mant-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
          <p>No hay mantenimientos registrados</p>
          <button className="btn-primary" onClick={abrirCrear}>Registrar el primero</button>
        </div>
      ) : (
        <div className="mant-table-wrap">
          <table className="mant-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Técnico</th>
                <th>Costo</th>
                <th>Descripción</th>
                <th style={{textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map(r => {
                const tc = TIPO_COLOR[r.tipo] || TIPO_COLOR['Otro'];
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="equipo-nombre">{r.nombre_equipo}</div>
                      {r.serial && <div className="equipo-serial">{r.serial}</div>}
                      {esSuperAdmin && <div className="equipo-empresa">{r.empresa_nombre}</div>}
                    </td>
                    <td>
                      <span className="tipo-badge" style={{background: tc.bg, color: tc.color}}>{r.tipo}</span>
                    </td>
                    <td className="cell-fecha">{fmtFecha(r.fecha_mantenimiento)}</td>
                    <td className="cell-muted">{r.tecnico || '—'}</td>
                    <td className="cell-costo">{fmtCosto(r.costo)}</td>
                    <td className="cell-desc">{r.descripcion || <span className="text-muted">—</span>}</td>
                    <td style={{textAlign:'right'}}>
                      <div className="acciones">
                        <button className="btn-icon edit" title="Editar" onClick={() => abrirEditar(r)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon delete" title="Eliminar" onClick={() => setConfirmEliminar(r)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" style={{maxWidth:'480px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar mantenimiento' : 'Registrar mantenimiento'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {errorForm && <div className="modal-error">{errorForm}</div>}
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid-2">
                <div className="form-group req" style={{gridColumn:'1/-1'}}>
                  <label>Equipo</label>
                  <select required value={form.equipo_id} onChange={e => setForm({...form, equipo_id: e.target.value})}>
                    <option value="">Seleccionar equipo...</option>
                    {equiposDelForm.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nombre_equipo}{eq.serial ? ` — ${eq.serial}` : ''}{esSuperAdmin ? ` (${eq.empresa_nombre})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group req">
                  <label>Tipo</label>
                  <select required value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group req">
                  <label>Fecha</label>
                  <input type="date" required value={form.fecha_mantenimiento}
                    onChange={e => setForm({...form, fecha_mantenimiento: e.target.value})} />
                </div>
                <div className="form-group opc">
                  <label>Técnico</label>
                  <input type="text" value={form.tecnico} placeholder="Nombre del técnico"
                    onChange={e => setForm({...form, tecnico: e.target.value})} />
                </div>
                <div className="form-group opc">
                  <label>Costo</label>
                  <input type="number" min="0" step="0.01" value={form.costo} placeholder="0.00"
                    onChange={e => setForm({...form, costo: e.target.value})} />
                </div>
                <div className="form-group opc" style={{gridColumn:'1/-1'}}>
                  <label>Descripción</label>
                  <textarea rows={3} value={form.descripcion} placeholder="Detalle del mantenimiento realizado..."
                    onChange={e => setForm({...form, descripcion: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmEliminar(null)}>
          <div className="modal-content" style={{maxWidth:'380px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar mantenimiento</h2>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:'14px',color:'#475569'}}>
                ¿Seguro que quieres eliminar el mantenimiento de <strong>{confirmEliminar.nombre_equipo}</strong> del {fmtFecha(confirmEliminar.fecha_mantenimiento)}?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setConfirmEliminar(null)}>Cancelar</button>
              <button className="btn-delete" onClick={handleEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mantenimientos;

const CSS = `
  .mant-page { max-width: 1200px; margin: 0 auto; }
  .mant-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .mant-header h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
  .mant-header p  { font-size: 13px; color: #64748b; margin: 0; }
  .mant-filters { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
  .filter-input  { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; }
  .filter-input:focus { border-color: #3b82f6; }
  .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: white; }
  .mant-resumen { display: flex; gap: 16px; font-size: 12px; color: #64748b; margin-bottom: 10px; padding: 6px 2px; }
  .mant-resumen strong { color: #1e293b; }
  .mant-loading { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #64748b; }
  .spinner-sm { width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .mant-empty { text-align: center; padding: 60px 20px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .mant-empty p { font-size: 14px; margin: 0; }
  .mant-table-wrap { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow-x: auto; }
  .mant-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px; }
  .mant-table thead tr { background: #f8fafc; }
  .mant-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  .mant-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .mant-table tbody tr:last-child td { border-bottom: none; }
  .mant-table tbody tr:hover td { background: #f8fafc; }
  .equipo-nombre { font-weight: 600; color: #1e293b; }
  .equipo-serial  { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .equipo-empresa { font-size: 11px; color: #64748b; margin-top: 1px; }
  .tipo-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .cell-fecha { white-space: nowrap; color: #475569; }
  .cell-muted { color: #64748b; }
  .cell-costo { font-weight: 600; color: #1e293b; white-space: nowrap; }
  .cell-desc  { color: #475569; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .text-muted { color: #cbd5e1; }
  .acciones { display: flex; gap: 6px; justify-content: flex-end; }
  .btn-icon { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .btn-icon.edit   { background: #eff6ff; color: #2563eb; }
  .btn-icon.edit:hover   { background: #dbeafe; }
  .btn-icon.delete { background: #fef2f2; color: #dc2626; }
  .btn-icon.delete:hover { background: #fee2e2; }
  .btn-primary { padding: 9px 18px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .btn-primary:hover { background: #1d4ed8; }
  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-content { background: white; border-radius: 14px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
  .modal-header h2 { font-size: 16px; font-weight: 700; margin: 0; color: #1e293b; }
  .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; padding: 0; }
  .modal-body { padding: 20px; }
  .modal-footer { padding: 14px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
  .modal-error { background: #fef2f2; color: #dc2626; padding: 8px 16px; font-size: 12px; border-bottom: 1px solid #fecaca; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group label { font-size: 12px; font-weight: 600; color: #374151; }
  .form-group.req label::after { content: " *"; color: #ef4444; }
  .form-group.opc label::after { content: " (opc)"; color: #9ca3af; font-size: 9px; }
  .form-group input, .form-group select, .form-group textarea { padding: 8px 10px; border: 1px solid #d1dce6; border-radius: 6px; font-size: 13px; outline: none; font-family: inherit; }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #3b82f6; }
  .form-group textarea { resize: vertical; }
  .btn-cancel { padding: 8px 16px; background: #f1f5f9; color: #475569; border: none; border-radius: 7px; font-size: 13px; cursor: pointer; }
  .btn-save   { padding: 8px 18px; background: #2563eb; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-delete { padding: 8px 18px; background: #dc2626; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
`;
