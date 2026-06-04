import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPlacas, crearPlaca, actualizarPlaca, eliminarPlaca } from '../services/placasService';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/Common/ConfirmModal';

const ESTADOS = ['activa', 'inactiva', 'perdida'];

function Placas() {
  const { usuario } = useAuth();
  const [placas, setPlacas]     = useState([]);
  const [equipos, setEquipos]   = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro]     = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('');

  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirm, setConfirm]   = useState(null);

  const [formData, setFormData] = useState({
    numero: '', empresa_id: '', equipo_id: '', fecha_asignacion: '', estado: 'activa', notas: ''
  });

  const esSuperAdmin = usuario?.rol === 'super_admin';
  const puedeEditar  = usuario?.rol === 'super_admin' || usuario?.rol === 'gestion';

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [placasRes, equiposRes, empRes] = await Promise.all([
        getPlacas(), getEquipos(), getEmpresas()
      ]);
      if (placasRes.success)  setPlacas(placasRes.data);
      if (equiposRes.success) setEquipos(equiposRes.data);
      if (empRes.success)     setEmpresas(empRes.data);
    } catch { toast.error('Error al cargar datos'); }
    finally  { setCargando(false); }
  };

  // Al seleccionar equipo, auto-rellenar empresa
  const handleEquipoChange = (equipoId) => {
    const eq = equipos.find(e => String(e.id) === String(equipoId));
    setFormData(prev => ({
      ...prev,
      equipo_id: equipoId,
      empresa_id: eq ? String(eq.empresa_id) : prev.empresa_id
    }));
  };

  const abrirCrear = () => {
    setEditando(null);
    setFormData({ numero: '', empresa_id: empresas[0]?.id || '', equipo_id: '', fecha_asignacion: '', estado: 'activa', notas: '' });
    setModal(true);
  };

  const abrirEditar = (placa) => {
    setEditando(placa);
    setFormData({
      numero:           placa.numero || '',
      empresa_id:       String(placa.empresa_id || ''),
      equipo_id:        String(placa.equipo_id || ''),
      fecha_asignacion: placa.fecha_asignacion ? placa.fecha_asignacion.split('T')[0] : '',
      estado:           placa.estado || 'activa',
      notas:            placa.notas || ''
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.numero.trim() || !formData.empresa_id)
      return toast.error('Número y empresa son requeridos');

    setGuardando(true);
    try {
      const payload = {
        ...formData,
        equipo_id:        formData.equipo_id        || null,
        fecha_asignacion: formData.fecha_asignacion || null,
        empresa_id:       Number(formData.empresa_id),
        equipo_id:        formData.equipo_id ? Number(formData.equipo_id) : null,
      };

      const res = editando
        ? await actualizarPlaca(editando.id, payload)
        : await crearPlaca(payload);

      if (res.success) {
        toast.success(editando ? 'Placa actualizada' : 'Placa creada');
        setModal(false);
        cargarDatos();
      } else {
        toast.error(res.message || 'Error al guardar');
      }
    } catch (err) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (placa) => {
    setConfirm({
      titulo: 'Eliminar placa',
      mensaje: `¿Eliminar la placa "${placa.numero}"?`,
      variante: 'danger',
      textConfirmar: 'Eliminar',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await eliminarPlaca(placa.id);
          if (res.success) { toast.success('Placa eliminada'); cargarDatos(); }
          else toast.error(res.message || 'Error al eliminar');
        } catch { toast.error('Error de conexión'); }
      },
    });
  };

  const placasFiltradas = placas.filter(p => {
    const texto = `${p.numero} ${p.equipo_codigo || ''} ${p.nombre_equipo || ''} ${p.empresa_nombre || ''}`.toLowerCase();
    const okTexto   = !filtro        || texto.includes(filtro.toLowerCase());
    const okEmpresa = !filtroEmpresa || String(p.empresa_id) === filtroEmpresa;
    const okEstado  = !filtroEstado  || p.estado === filtroEstado;
    return okTexto && okEmpresa && okEstado;
  });

  const badgeEstado = (estado) => {
    if (estado === 'activa')   return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    if (estado === 'inactiva') return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }; // perdida
  };

  // Equipos filtrados por empresa seleccionada en el form
  const equiposForm = formData.empresa_id
    ? equipos.filter(eq => String(eq.empresa_id) === String(formData.empresa_id))
    : equipos;

  if (cargando) return <div className="pl-loading">Cargando placas...</div>;

  return (
    <div className="pl-container">
      <ConfirmModal
        open={confirm !== null}
        titulo={confirm?.titulo}
        mensaje={confirm?.mensaje}
        variante={confirm?.variante}
        textConfirmar={confirm?.textConfirmar}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* Header */}
      <div className="pl-header">
        <div>
          <h1 className="pl-title">Placas</h1>
          <p className="pl-subtitle">Gestión de activos fijos / asset tags</p>
        </div>
        {puedeEditar && (
          <button className="pl-btn-primary" onClick={abrirCrear}>+ Agregar placa</button>
        )}
      </div>

      {/* Filtros */}
      <div className="pl-filters">
        <input
          className="pl-filter-input"
          placeholder="Buscar por número, equipo..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
        {esSuperAdmin && (
          <select className="pl-filter-select" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
            <option value="">Todas las empresas</option>
            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        )}
        <select className="pl-filter-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        {(filtro || filtroEmpresa || filtroEstado) && (
          <button className="pl-filter-clear" onClick={() => { setFiltro(''); setFiltroEmpresa(''); setFiltroEstado(''); }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="pl-table-wrapper">
        <table className="pl-table">
          <thead>
            <tr>
              <th>N° Placa</th>
              {esSuperAdmin && <th>Empresa</th>}
              <th>Equipo asignado</th>
              <th>Fecha asignación</th>
              <th>Estado</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {placasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={esSuperAdmin ? 7 : 6} className="pl-empty">
                  No hay placas registradas
                </td>
              </tr>
            ) : (
              placasFiltradas.map(placa => {
                const b = badgeEstado(placa.estado);
                return (
                  <tr key={placa.id}>
                    <td className="pl-numero">{placa.numero}</td>
                    {esSuperAdmin && <td className="pl-empresa">{placa.empresa_nombre}</td>}
                    <td className="pl-equipo">
                      {placa.equipo_id ? (
                        <span>
                          <span className="pl-eq-codigo">{placa.equipo_codigo}</span>
                          {placa.nombre_equipo}
                        </span>
                      ) : (
                        <span className="pl-sin-equipo">Sin asignar</span>
                      )}
                    </td>
                    <td className="pl-fecha">
                      {placa.fecha_asignacion
                        ? new Date(placa.fecha_asignacion).toLocaleDateString('es-CO')
                        : <span className="pl-vacio">—</span>}
                    </td>
                    <td>
                      <span className="pl-badge" style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
                        {placa.estado}
                      </span>
                    </td>
                    <td className="pl-notas">{placa.notas || <span className="pl-vacio">—</span>}</td>
                    <td className="pl-acciones">
                      {puedeEditar && (
                        <button className="pl-btn-edit" onClick={() => abrirEditar(placa)}>Editar</button>
                      )}
                      {puedeEditar && (
                        <button className="pl-btn-delete" onClick={() => handleEliminar(placa)}>Eliminar</button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="pl-count">{placasFiltradas.length} placa(s) encontrada(s)</p>

      {/* Modal */}
      {modal && (
        <div className="pl-modal-overlay" onClick={() => setModal(false)}>
          <div className="pl-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header">
              <h2>{editando ? 'Editar placa' : 'Nueva placa'}</h2>
              <button className="pl-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pl-modal-body">
                <div className="pl-form-row">
                  <div className="pl-form-group">
                    <label>N° de placa *</label>
                    <input
                      type="text"
                      placeholder="Ej: EMTRA-001234"
                      value={formData.numero}
                      onChange={e => setFormData({ ...formData, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div className="pl-form-group">
                    <label>Estado</label>
                    <select
                      value={formData.estado}
                      onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    >
                      {ESTADOS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {esSuperAdmin && (
                  <div className="pl-form-group">
                    <label>Empresa *</label>
                    <select
                      value={formData.empresa_id}
                      onChange={e => setFormData({ ...formData, empresa_id: e.target.value, equipo_id: '' })}
                      required
                    >
                      <option value="">Seleccionar empresa</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                )}

                <div className="pl-form-group">
                  <label>Equipo asignado</label>
                  <select
                    value={formData.equipo_id}
                    onChange={e => handleEquipoChange(e.target.value)}
                  >
                    <option value="">Sin equipo asignado</option>
                    {equiposForm.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.codigo} — {eq.nombre_equipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pl-form-group">
                  <label>Fecha de asignación</label>
                  <input
                    type="date"
                    value={formData.fecha_asignacion}
                    onChange={e => setFormData({ ...formData, fecha_asignacion: e.target.value })}
                  />
                </div>

                <div className="pl-form-group">
                  <label>Notas</label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones opcionales..."
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  />
                </div>
              </div>
              <div className="pl-modal-footer">
                <button type="button" className="pl-btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="pl-btn-save" disabled={guardando}>
                  {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear placa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Placas;

// ─── Estilos ─────────────────────────────────────────────────────────────────
const s = document.createElement('style');
s.textContent = `
  .pl-container  { padding: 20px; max-width: 100%; }
  .pl-header     { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
  .pl-title      { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .pl-subtitle   { font-size: 12px; color: #64748b; margin: 2px 0 0; }
  .pl-filters    { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .pl-count      { font-size: 11px; color: #94a3b8; margin-top: 8px; text-align: right; }
  .pl-loading    { text-align: center; padding: 40px; color: #64748b; }

  .pl-filter-input  { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 12px; min-width: 200px; flex: 1; max-width: 280px; outline: none; background: white; }
  .pl-filter-input:focus { border-color: #2563eb; }
  .pl-filter-select { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 12px; background: white; outline: none; color: #334155; }
  .pl-filter-clear  { padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 7px; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; }

  .pl-btn-primary { background: #1a3a5c; color: white; padding: 8px 16px; border-radius: 7px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
  .pl-btn-primary:hover { background: #0f2b5c; }

  .pl-table-wrapper { background: white; border-radius: 10px; border: 1px solid #e2e8f0; overflow-x: auto; }
  .pl-table      { width: 100%; border-collapse: collapse; min-width: 680px; }
  .pl-table th   { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .pl-table td   { padding: 10px 14px; font-size: 12px; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
  .pl-table tbody tr:hover { background: #f8fafc; }

  .pl-numero      { font-weight: 700; color: #1a3a5c; font-size: 13px; }
  .pl-empresa     { color: #64748b; font-size: 11px; }
  .pl-equipo      { }
  .pl-eq-codigo   { font-size: 10px; color: #94a3b8; display: block; }
  .pl-sin-equipo  { color: #cbd5e1; font-style: italic; }
  .pl-fecha       { color: #475569; }
  .pl-notas       { color: #64748b; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pl-vacio       { color: #cbd5e1; }
  .pl-acciones    { white-space: nowrap; }
  .pl-empty       { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }

  .pl-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }

  .pl-btn-edit, .pl-btn-delete { padding: 4px 10px; border-radius: 5px; border: none; cursor: pointer; font-size: 11px; font-weight: 500; margin-right: 4px; }
  .pl-btn-edit   { background: #e0e7ff; color: #4338ca; }
  .pl-btn-delete { background: #fee2e2; color: #dc2626; }

  .pl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .pl-modal         { background: white; border-radius: 12px; width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
  .pl-modal-header  { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1; }
  .pl-modal-header h2 { font-size: 15px; font-weight: 600; margin: 0; color: #0f172a; }
  .pl-modal-close   { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
  .pl-modal-body    { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .pl-modal-footer  { padding: 12px 18px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; }

  .pl-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pl-form-group { display: flex; flex-direction: column; gap: 4px; }
  .pl-form-group label    { font-size: 12px; font-weight: 600; color: #334155; }
  .pl-form-group input,
  .pl-form-group select,
  .pl-form-group textarea { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 13px; outline: none; font-family: inherit; resize: vertical; }
  .pl-form-group input:focus,
  .pl-form-group select:focus,
  .pl-form-group textarea:focus { border-color: #2563eb; }

  .pl-btn-cancel { padding: 7px 16px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 13px; }
  .pl-btn-save   { padding: 7px 18px; border-radius: 7px; border: none; background: #1a3a5c; color: white; cursor: pointer; font-size: 13px; font-weight: 500; }
  .pl-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 600px) { .pl-form-row { grid-template-columns: 1fr; } }
`;
document.head.appendChild(s);
