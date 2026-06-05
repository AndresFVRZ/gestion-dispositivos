import React, { useState, useEffect } from 'react';
import { getSedes, crearSede, actualizarSede, eliminarSede } from '../services/sedesService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VACIO = { empresa_id: '', nombre: '', ubicacion: '' };

function Sedes() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === 'super_admin';

  const [sedes, setSedes]       = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm]         = useState(VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [confirmEliminar, setConfirmEliminar] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [sedesRes, empRes] = await Promise.all([getSedes(), getEmpresas()]);
      if (sedesRes.success) setSedes(sedesRes.data);
      if (empRes.success)   setEmpresas(empRes.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setCargando(false); }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...VACIO, empresa_id: filtroEmpresa || (empresas[0]?.id ?? '') });
    setErrorForm('');
    setModal(true);
  };

  const abrirEditar = (sede) => {
    setEditando(sede);
    setForm({ empresa_id: sede.empresa_id, nombre: sede.nombre, ubicacion: sede.ubicacion || '' });
    setErrorForm('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      const r = editando
        ? await actualizarSede(editando.id, form)
        : await crearSede(form);
      if (r.success) {
        toast.success(editando ? 'Sede actualizada' : 'Sede creada');
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
      const r = await eliminarSede(confirmEliminar.id);
      if (r.success) { toast.success('Sede eliminada'); cargarDatos(); }
      else toast.error(r.message);
    } catch { toast.error('Error al eliminar'); }
    finally { setConfirmEliminar(null); }
  };

  const sedesFiltradas = sedes.filter(s => {
    if (filtroEmpresa && String(s.empresa_id) !== String(filtroEmpresa)) return false;
    if (busqueda && !s.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !(s.ubicacion || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const equiposPorSede = (sedeNombre, empresaId) =>
    0; // placeholder — no tenemos ese dato aquí sin llamada extra

  return (
    <div className="sedes-page">
      <style>{CSS}</style>

      <div className="sedes-header">
        <div>
          <h1>Sedes</h1>
          <p>{sedes.length} sede{sedes.length !== 1 ? 's' : ''} registrada{sedes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Nueva sede</button>
      </div>

      {/* Filtros */}
      <div className="sedes-filters">
        <input
          className="filter-input"
          placeholder="Buscar por nombre o ubicación..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {esSuperAdmin && (
          <select className="filter-select" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
            <option value="">Todas las empresas</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
          </select>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="sedes-loading"><div className="spinner-sm" />Cargando sedes...</div>
      ) : sedesFiltradas.length === 0 ? (
        <div className="sedes-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <p>No hay sedes{busqueda ? ` que coincidan con "${busqueda}"` : ''}</p>
          <button className="btn-primary" onClick={abrirCrear}>Crear primera sede</button>
        </div>
      ) : (
        <div className="sedes-table-wrap">
          <table className="sedes-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Ubicación</th>
                {esSuperAdmin && <th>Empresa</th>}
                <th style={{textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sedesFiltradas.map(sede => (
                <tr key={sede.id}>
                  <td>
                    <div className="sede-nombre">{sede.nombre}</div>
                  </td>
                  <td className="sede-ubicacion">{sede.ubicacion || <span className="text-muted">—</span>}</td>
                  {esSuperAdmin && <td className="sede-empresa">{sede.empresa_nombre}</td>}
                  <td style={{textAlign:'right'}}>
                    <div className="acciones">
                      <button className="btn-icon edit" title="Editar" onClick={() => abrirEditar(sede)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {esSuperAdmin && (
                        <button className="btn-icon delete" title="Eliminar" onClick={() => setConfirmEliminar(sede)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" style={{maxWidth:'420px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar sede' : 'Nueva sede'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {errorForm && <div className="modal-error">{errorForm}</div>}
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                {esSuperAdmin && (
                  <div className="form-group req">
                    <label>Empresa</label>
                    <select value={form.empresa_id} onChange={e => setForm({...form, empresa_id: e.target.value})} required>
                      <option value="">Seleccionar empresa...</option>
                      {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group req">
                  <label>Nombre de la sede</label>
                  <input type="text" required value={form.nombre}
                    placeholder="Ej: Sede Norte, Oficina Central..."
                    onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
                <div className="form-group opc">
                  <label>Ubicación</label>
                  <input type="text" value={form.ubicacion}
                    placeholder="Ej: Calle 45 #12-34, Bogotá"
                    onChange={e => setForm({...form, ubicacion: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear sede'}
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
              <h2>Eliminar sede</h2>
              <button className="modal-close" onClick={() => setConfirmEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:'14px',color:'#475569'}}>
                ¿Seguro que quieres eliminar <strong>{confirmEliminar.nombre}</strong>?
                Esta acción no se puede deshacer.
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

export default Sedes;

const CSS = `
  .sedes-page { max-width: 1000px; margin: 0 auto; }
  .sedes-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .sedes-header h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
  .sedes-header p  { font-size: 13px; color: #64748b; margin: 0; }
  .sedes-filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .filter-input  { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; }
  .filter-input:focus { border-color: #3b82f6; }
  .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: white; }
  .sedes-loading { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #64748b; }
  .spinner-sm { width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .sedes-empty { text-align: center; padding: 60px 20px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .sedes-empty p { font-size: 14px; margin: 0; }
  .sedes-table-wrap { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
  .sedes-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .sedes-table thead tr { background: #f8fafc; }
  .sedes-table th { padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #e2e8f0; }
  .sedes-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .sedes-table tbody tr:last-child td { border-bottom: none; }
  .sedes-table tbody tr:hover td { background: #f8fafc; }
  .sede-nombre { font-weight: 600; color: #1e293b; }
  .sede-ubicacion { color: #475569; }
  .sede-empresa { color: #475569; font-size: 12px; }
  .text-muted { color: #cbd5e1; }
  .acciones { display: flex; gap: 6px; justify-content: flex-end; }
  .btn-icon { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .btn-icon.edit   { background: #eff6ff; color: #2563eb; }
  .btn-icon.edit:hover   { background: #dbeafe; }
  .btn-icon.delete { background: #fef2f2; color: #dc2626; }
  .btn-icon.delete:hover { background: #fee2e2; }
  .btn-primary { padding: 9px 18px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .btn-primary:hover { background: #1d4ed8; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-content { background: white; border-radius: 14px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
  .modal-header h2 { font-size: 16px; font-weight: 700; margin: 0; color: #1e293b; }
  .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; padding: 0; line-height: 1; }
  .modal-body { padding: 20px; }
  .modal-footer { padding: 14px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
  .modal-error { background: #fef2f2; color: #dc2626; padding: 8px 16px; font-size: 12px; border-bottom: 1px solid #fecaca; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group label { font-size: 12px; font-weight: 600; color: #374151; }
  .form-group.req label::after { content: " *"; color: #ef4444; }
  .form-group.opc label::after { content: " (opc)"; color: #9ca3af; font-size: 9px; }
  .form-group input, .form-group select { padding: 8px 10px; border: 1px solid #d1dce6; border-radius: 6px; font-size: 13px; outline: none; }
  .form-group input:focus, .form-group select:focus { border-color: #3b82f6; }
  .btn-cancel { padding: 8px 16px; background: #f1f5f9; color: #475569; border: none; border-radius: 7px; font-size: 13px; cursor: pointer; }
  .btn-save   { padding: 8px 18px; background: #2563eb; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-delete { padding: 8px 18px; background: #dc2626; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
`;
