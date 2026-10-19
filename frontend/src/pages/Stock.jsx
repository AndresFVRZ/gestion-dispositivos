import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getStock, crearParte, actualizarParte, ajustarStock, eliminarParte } from '../services/stockService';
import { getSedes } from '../services/sedesService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/Common/ConfirmModal';

const ROLES_MODIFICAN = ['super_admin', 'administrador', 'logistica', 'soporte'];
const CATEGORIAS = ['RAM', 'Disco', 'Fuente de poder', 'Batería', 'Cargador', 'Teclado', 'Mouse', 'Pantalla', 'Cable', 'Otro'];
const FORM_VACIO = { sede_id: '', nombre: '', categoria: '', marca: '', modelo: '', descripcion: '', cantidad: 0, stock_minimo: 0 };

function Stock() {
  const { usuario } = useAuth();
  const [partes, setPartes]       = useState([]);
  const [sedes, setSedes]         = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [filtroSede, setFiltroSede]           = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTexto, setFiltroTexto]         = useState('');
  const [soloBajoMinimo, setSoloBajoMinimo]   = useState(false);

  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData]   = useState(FORM_VACIO);
  const [confirm, setConfirm]     = useState(null);
  const [ajustando, setAjustando] = useState(null); // id de la parte que se está ajustando
  const [ajusteManual, setAjusteManual] = useState(null); // { parte, cantidad, operacion }

  const puedeModificar = ROLES_MODIFICAN.includes(usuario?.rol);

  useEffect(() => {
    getSedes()
      .then(r => { if (r.success) setSedes(r.data); })
      .catch(() => toast.error('Error al cargar sedes'));
  }, []);

  // Consulta al API cada vez que cambian los filtros (la búsqueda con un pequeño retraso)
  useEffect(() => {
    let cancelado = false;
    const t = setTimeout(async () => {
      try {
        const r = await getStock({ sede_id: filtroSede, categoria: filtroCategoria, q: filtroTexto.trim(), bajo_minimo: soloBajoMinimo ? 1 : '' });
        if (!cancelado && r.success) setPartes(r.data);
      } catch (error) {
        if (!cancelado) toast.error(error.message || 'Error al cargar el stock');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, filtroTexto ? 300 : 0);
    return () => { cancelado = true; clearTimeout(t); };
  }, [filtroSede, filtroCategoria, filtroTexto, soloBajoMinimo]);

  // Reemplaza una fila con la versión que devuelve el API (sin recargar toda la tabla)
  const actualizarFila = (parte) => setPartes(prev => prev.map(p => (p.id === parte.id ? parte : p)));

  const recargar = async () => {
    const r = await getStock({ sede_id: filtroSede, categoria: filtroCategoria, q: filtroTexto.trim(), bajo_minimo: soloBajoMinimo ? 1 : '' });
    if (r.success) setPartes(r.data);
  };

  const ajustar = async (parte, cantidad) => {
    setAjustando(parte.id);
    try {
      const r = await ajustarStock(parte.id, cantidad);
      if (r.success) {
        actualizarFila(r.data);
        if (r.data.bajo_minimo && !parte.bajo_minimo) toast(`${parte.nombre}: quedó en el stock mínimo o por debajo`, { icon: '⚠️' });
      } else toast.error(r.message || 'No se pudo ajustar');
    } catch (error) {
      toast.error(error.message || 'No se pudo ajustar');
    } finally {
      setAjustando(null);
    }
  };

  const confirmarAjusteManual = async () => {
    const n = parseInt(ajusteManual.cantidad, 10);
    if (!n || n <= 0) { toast.error('Ingresa una cantidad mayor a 0'); return; }
    await ajustar(ajusteManual.parte, ajusteManual.operacion === 'restar' ? -n : n);
    setAjusteManual(null);
  };

  const abrirCrear = () => {
    setEditando(null);
    setFormData({ ...FORM_VACIO, sede_id: filtroSede || (sedes.length === 1 ? String(sedes[0].id) : '') });
    setModal(true);
  };

  const abrirEditar = (parte) => {
    setEditando(parte);
    setFormData({
      sede_id: String(parte.sede_id), nombre: parte.nombre, categoria: parte.categoria || '',
      marca: parte.marca || '', modelo: parte.modelo || '', descripcion: parte.descripcion || '',
      cantidad: parte.cantidad, stock_minimo: parte.stock_minimo,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = { ...formData, cantidad: Number(formData.cantidad), stock_minimo: Number(formData.stock_minimo) };
      const r = editando ? await actualizarParte(editando.id, payload) : await crearParte(payload);
      if (r.success) {
        toast.success(editando ? 'Parte actualizada' : 'Parte agregada al stock');
        setModal(false);
        await recargar();
      } else toast.error(r.message || 'Error al guardar');
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (parte) => {
    setConfirm({
      titulo: 'Eliminar parte',
      mensaje: `¿Eliminar "${parte.nombre}" del stock de ${parte.sede_nombre}? Esta acción no se puede deshacer.`,
      variante: 'danger',
      textConfirmar: 'Eliminar',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const r = await eliminarParte(parte.id);
          if (r.success) { toast.success('Parte eliminada'); setPartes(prev => prev.filter(p => p.id !== parte.id)); }
          else toast.error(r.message || 'Error al eliminar');
        } catch (error) { toast.error(error.message || 'Error al eliminar'); }
      },
    });
  };

  const variasEmpresas = new Set(sedes.map(s => s.empresa_id)).size > 1;
  const nombreSede = (s) => `${s.nombre}${variasEmpresas ? ` (${s.empresa_nombre})` : ''}`;
  const totalUnidades = partes.reduce((acc, p) => acc + p.cantidad, 0);
  const totalBajoMinimo = partes.filter(p => p.bajo_minimo).length;
  const hayFiltros = filtroSede || filtroCategoria || filtroTexto || soloBajoMinimo;

  if (cargando) return <div className="st-loading">Cargando stock...</div>;

  return (
    <div className="st-container">
      <ConfirmModal
        open={confirm !== null}
        titulo={confirm?.titulo}
        mensaje={confirm?.mensaje}
        variante={confirm?.variante}
        textConfirmar={confirm?.textConfirmar}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

      <div className="st-header">
        <div>
          <h1 className="st-title">Stock de partes</h1>
          <p className="st-subtitle">Repuestos disponibles por sede</p>
        </div>
        {puedeModificar && <button className="st-btn-primary" onClick={abrirCrear}>+ Agregar parte</button>}
      </div>

      <div className="st-resumen">
        <div className="st-kpi"><span className="st-kpi-valor">{partes.length}</span><span className="st-kpi-label">Partes</span></div>
        <div className="st-kpi"><span className="st-kpi-valor">{totalUnidades}</span><span className="st-kpi-label">Unidades</span></div>
        <div className={`st-kpi ${totalBajoMinimo ? 'st-kpi-alerta' : ''}`}>
          <span className="st-kpi-valor">{totalBajoMinimo}</span><span className="st-kpi-label">En stock mínimo</span>
        </div>
      </div>

      <div className="st-filters">
        <input className="st-filter-input" placeholder="Buscar por nombre, marca o modelo..."
          value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
        <select className="st-filter-select" value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{nombreSede(s)}</option>)}
        </select>
        <select className="st-filter-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="st-check">
          <input type="checkbox" checked={soloBajoMinimo} onChange={e => setSoloBajoMinimo(e.target.checked)} />
          Solo en stock mínimo
        </label>
        {hayFiltros && (
          <button className="st-filter-clear" onClick={() => { setFiltroSede(''); setFiltroCategoria(''); setFiltroTexto(''); setSoloBajoMinimo(false); }}>
            Limpiar
          </button>
        )}
      </div>

      <div className="st-table-wrapper">
        <table className="st-table">
          <thead>
            <tr>
              <th>Parte</th>
              <th>Categoría</th>
              <th>Sede</th>
              <th className="st-num">Cantidad</th>
              <th className="st-num">Mínimo</th>
              {puedeModificar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {partes.length === 0 ? (
              <tr>
                <td colSpan={puedeModificar ? 6 : 5} className="st-empty">
                  {hayFiltros ? 'No hay partes que coincidan con los filtros' : 'Aún no hay partes registradas'}
                </td>
              </tr>
            ) : partes.map(p => (
              <tr key={p.id} className={p.bajo_minimo ? 'st-row-alerta' : ''}>
                <td>
                  <span className="st-nombre">{p.nombre}</span>
                  {(p.marca || p.modelo) && <span className="st-detalle">{[p.marca, p.modelo].filter(Boolean).join(' · ')}</span>}
                </td>
                <td>{p.categoria || <span className="st-vacio">—</span>}</td>
                <td>{p.sede_nombre}{variasEmpresas && <span className="st-detalle">{p.empresa_nombre}</span>}</td>
                <td className="st-num">
                  {puedeModificar ? (
                    <div className="st-ajuste">
                      <button className="st-btn-ajuste" disabled={ajustando === p.id || p.cantidad === 0}
                        onClick={() => ajustar(p, -1)} aria-label={`Restar una unidad de ${p.nombre}`}>−</button>
                      <span className={`st-cantidad ${p.bajo_minimo ? 'st-cantidad-alerta' : ''}`}>{p.cantidad}</span>
                      <button className="st-btn-ajuste" disabled={ajustando === p.id}
                        onClick={() => ajustar(p, 1)} aria-label={`Sumar una unidad de ${p.nombre}`}>+</button>
                    </div>
                  ) : (
                    <span className={`st-cantidad ${p.bajo_minimo ? 'st-cantidad-alerta' : ''}`}>{p.cantidad}</span>
                  )}
                </td>
                <td className="st-num">
                  {p.stock_minimo}
                  {p.bajo_minimo && <span className="st-badge-alerta">Reponer</span>}
                </td>
                {puedeModificar && (
                  <td className="st-acciones">
                    <button className="st-btn-edit" onClick={() => setAjusteManual({ parte: p, cantidad: '', operacion: 'sumar' })}>Ajustar</button>
                    <button className="st-btn-edit" onClick={() => abrirEditar(p)}>Editar</button>
                    <button className="st-btn-delete" onClick={() => handleEliminar(p)}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ajuste por cantidad (entradas o salidas de varias unidades) */}
      {ajusteManual && (
        <div className="st-modal-overlay" onClick={() => setAjusteManual(null)}>
          <div className="st-modal st-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="st-modal-header">
              <h2>Ajustar cantidad</h2>
              <button className="st-modal-close" onClick={() => setAjusteManual(null)}>✕</button>
            </div>
            <div className="st-modal-body">
              <p className="st-ajuste-info"><strong>{ajusteManual.parte.nombre}</strong> — {ajusteManual.parte.sede_nombre}<br />Disponible: {ajusteManual.parte.cantidad}</p>
              <div className="st-toggle">
                {[['sumar', 'Entrada (+)'], ['restar', 'Salida (−)']].map(([op, label]) => (
                  <button key={op} type="button"
                    className={`st-toggle-btn ${ajusteManual.operacion === op ? 'st-toggle-activo' : ''}`}
                    onClick={() => setAjusteManual(prev => ({ ...prev, operacion: op }))}>{label}</button>
                ))}
              </div>
              <div className="st-form-group">
                <label>Cantidad</label>
                <input type="number" min="1" autoFocus value={ajusteManual.cantidad}
                  onChange={e => setAjusteManual(prev => ({ ...prev, cantidad: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') confirmarAjusteManual(); }} />
              </div>
            </div>
            <div className="st-modal-footer">
              <button className="st-btn-cancel" onClick={() => setAjusteManual(null)}>Cancelar</button>
              <button className="st-btn-save" disabled={ajustando === ajusteManual.parte.id} onClick={confirmarAjusteManual}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Crear / editar parte */}
      {modal && (
        <div className="st-modal-overlay" onClick={() => setModal(false)}>
          <div className="st-modal" onClick={e => e.stopPropagation()}>
            <div className="st-modal-header">
              <h2>{editando ? 'Editar parte' : 'Nueva parte'}</h2>
              <button className="st-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="st-modal-body">
                <div className="st-form-group">
                  <label>Sede *</label>
                  <select required value={formData.sede_id} onChange={e => setFormData({ ...formData, sede_id: e.target.value })}>
                    <option value="">Seleccionar sede</option>
                    {sedes.map(s => <option key={s.id} value={s.id}>{nombreSede(s)}</option>)}
                  </select>
                </div>
                <div className="st-form-row">
                  <div className="st-form-group">
                    <label>Nombre *</label>
                    <input required type="text" placeholder="Ej: Memoria RAM 8GB DDR4"
                      value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                  </div>
                  <div className="st-form-group">
                    <label>Categoría</label>
                    <input type="text" list="st-categorias" placeholder="Escribe o selecciona..."
                      value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} />
                    <datalist id="st-categorias">{CATEGORIAS.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                </div>
                <div className="st-form-row">
                  <div className="st-form-group">
                    <label>Marca</label>
                    <input type="text" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} />
                  </div>
                  <div className="st-form-group">
                    <label>Modelo</label>
                    <input type="text" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} />
                  </div>
                </div>
                <div className="st-form-row">
                  <div className="st-form-group">
                    <label>{editando ? 'Cantidad actual' : 'Cantidad inicial'}</label>
                    <input type="number" min="0" disabled={!!editando}
                      value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} />
                    {editando && <span className="st-hint">Usa “Ajustar” o los botones − / + para cambiarla</span>}
                  </div>
                  <div className="st-form-group">
                    <label>Stock mínimo</label>
                    <input type="number" min="0"
                      value={formData.stock_minimo} onChange={e => setFormData({ ...formData, stock_minimo: e.target.value })} />
                  </div>
                </div>
                <div className="st-form-group">
                  <label>Descripción</label>
                  <textarea rows={2} value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
                </div>
              </div>
              <div className="st-modal-footer">
                <button type="button" className="st-btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="st-btn-save" disabled={guardando}>
                  {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Agregar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;

// ─── Estilos ─────────────────────────────────────────────────────────────────
const s = document.createElement('style');
s.textContent = `
  .st-container  { padding: 20px; max-width: 100%; }
  .st-header     { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
  .st-title      { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .st-subtitle   { font-size: 12px; color: #64748b; margin: 2px 0 0; }
  .st-loading    { text-align: center; padding: 40px; color: #64748b; }

  .st-resumen    { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 14px; }
  .st-kpi        { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; }
  .st-kpi-valor  { font-size: 22px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; }
  .st-kpi-label  { font-size: 11px; color: #64748b; }
  .st-kpi-alerta { border-color: #fecaca; background: #fef2f2; }
  .st-kpi-alerta .st-kpi-valor { color: #dc2626; }

  .st-filters    { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
  .st-filter-input  { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 12px; min-width: 200px; flex: 1; max-width: 280px; outline: none; background: white; }
  .st-filter-input:focus { border-color: #2563eb; }
  .st-filter-select { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 12px; background: white; outline: none; color: #334155; }
  .st-filter-clear  { padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 7px; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; }
  .st-check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #334155; cursor: pointer; }

  .st-btn-primary { background: #1a3a5c; color: white; padding: 8px 16px; border-radius: 7px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
  .st-btn-primary:hover { background: #0f2b5c; }

  .st-table-wrapper { background: white; border-radius: 10px; border: 1px solid #e2e8f0; overflow-x: auto; }
  .st-table      { width: 100%; border-collapse: collapse; min-width: 680px; }
  .st-table th   { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .st-table td   { padding: 10px 14px; font-size: 12px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .st-table tbody tr:hover { background: #f8fafc; }
  .st-table .st-num { text-align: center; }
  .st-row-alerta td:first-child { box-shadow: inset 3px 0 0 #dc2626; }
  .st-nombre     { font-weight: 600; color: #0f172a; display: block; }
  .st-detalle    { display: block; font-size: 10px; color: #94a3b8; }
  .st-vacio      { color: #cbd5e1; }
  .st-empty      { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
  .st-acciones   { white-space: nowrap; }

  .st-ajuste     { display: inline-flex; align-items: center; gap: 8px; }
  .st-btn-ajuste { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; color: #1a3a5c; font-size: 15px; font-weight: 600; cursor: pointer; line-height: 1; }
  .st-btn-ajuste:hover:not(:disabled) { background: #eff6ff; border-color: #93c5fd; }
  .st-btn-ajuste:disabled { opacity: 0.35; cursor: not-allowed; }
  .st-cantidad   { min-width: 28px; display: inline-block; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .st-cantidad-alerta { color: #dc2626; }
  .st-badge-alerta { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; background: #fee2e2; color: #b91c1c; }

  .st-btn-edit, .st-btn-delete { padding: 4px 10px; border-radius: 5px; border: none; cursor: pointer; font-size: 11px; font-weight: 500; margin-right: 4px; }
  .st-btn-edit   { background: #e0e7ff; color: #4338ca; }
  .st-btn-delete { background: #fee2e2; color: #dc2626; }

  .st-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
  .st-modal         { background: white; border-radius: 12px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; }
  .st-modal-sm      { max-width: 380px; }
  .st-modal-header  { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1; }
  .st-modal-header h2 { font-size: 15px; font-weight: 600; margin: 0; color: #0f172a; }
  .st-modal-close   { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
  .st-modal-body    { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .st-modal-footer  { padding: 12px 18px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; }

  .st-ajuste-info { margin: 0; font-size: 13px; color: #334155; line-height: 1.5; }
  .st-toggle      { display: flex; border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; }
  .st-toggle-btn  { flex: 1; padding: 7px 0; border: none; background: white; color: #475569; font-size: 12px; cursor: pointer; }
  .st-toggle-btn + .st-toggle-btn { border-left: 1px solid #cbd5e1; }
  .st-toggle-activo { background: #1a3a5c; color: white; font-weight: 600; }

  .st-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .st-form-group { display: flex; flex-direction: column; gap: 4px; }
  .st-form-group label { font-size: 12px; font-weight: 600; color: #334155; }
  .st-form-group input,
  .st-form-group select,
  .st-form-group textarea { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 13px; outline: none; font-family: inherit; resize: vertical; }
  .st-form-group input:focus,
  .st-form-group select:focus,
  .st-form-group textarea:focus { border-color: #2563eb; }
  .st-form-group input:disabled { background: #f8fafc; color: #64748b; }
  .st-hint { font-size: 10px; color: #94a3b8; }

  .st-btn-cancel { padding: 7px 16px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 13px; }
  .st-btn-save   { padding: 7px 18px; border-radius: 7px; border: none; background: #1a3a5c; color: white; cursor: pointer; font-size: 13px; font-weight: 500; }
  .st-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 600px) { .st-form-row { grid-template-columns: 1fr; } }
`;
document.head.appendChild(s);
