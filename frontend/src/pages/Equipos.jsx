// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getEquipos, eliminarEquipo, crearEquipo, actualizarEquipo } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/Common/ConfirmModal';
import ImportModal from '../components/Common/ImportModal';
import { calcularGarantia, textoGarantia, colorGarantia } from '../utils/garantia';
import * as XLSX from 'xlsx';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function Equipos() {
  const { usuario } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [equipoDetalle, setEquipoDetalle] = useState(null);
  const [cargandoOperacion, setCargandoOperacion] = useState(false);
  const [mensajeOperacion, setMensajeOperacion] = useState('');
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [camposExtra, setCamposExtra] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [importModal, setImportModal] = useState({ estado: 'idle', progreso: 0, total: 0, importados: 0, errores: [] });

  const esSuperAdmin = usuario?.rol === 'super_admin';
  const puedeEditar = usuario?.rol === 'super_admin' || usuario?.rol === 'gestion';
  const puedeEliminar = usuario?.rol === 'super_admin';

  const [formData, setFormData] = useState({
    codigo: '', nombre_equipo: '', tipo: 'Desktop', marca: '', modelo: '',
    serial: '', estado: 'Disponible', ubicacion: '', asignado_a: '',
    fecha_asignacion: '', procesador: '', ram: '', disco_duro: '',
    sistema_operativo: '', garantia: '', especificaciones: '', empresa_id: ''
  });

  const tipos = ['Desktop', 'Laptop', 'Server'];
  const estados = ['Disponible', 'Asignado', 'Préstamo', 'Mantenimiento', 'Dañado', 'Baja'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [empresasData, equiposData] = await Promise.all([getEmpresas(), getEquipos()]);
      if (empresasData.success) setEmpresas(empresasData.data);
      if (equiposData.success) setEquipos(equiposData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const parsearCamposExtra = (especificaciones) => {
    try {
      const parsed = JSON.parse(especificaciones || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return especificaciones ? [{ valor: especificaciones }] : [];
    }
  };

  const abrirModalCrear = () => {
    setEquipoEditando(null);
    setFormData({
      codigo: '', nombre_equipo: '', tipo: 'Desktop', marca: '', modelo: '',
      serial: '', estado: 'Disponible', ubicacion: '', asignado_a: '',
      fecha_asignacion: '', procesador: '', ram: '', disco_duro: '',
      sistema_operativo: '', garantia: '', especificaciones: '', empresa_id: ''
    });
    setCamposExtra([]);
    setErrorForm('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (equipo) => {
    setEquipoEditando(equipo);
    setFormData({
      codigo: equipo.codigo || '', nombre_equipo: equipo.nombre_equipo || '',
      tipo: equipo.tipo || 'Desktop', marca: equipo.marca || '',
      modelo: equipo.modelo || '', serial: equipo.serial || '',
      estado: equipo.estado || 'Disponible', ubicacion: equipo.ubicacion || '',
      asignado_a: equipo.asignado_a || '', fecha_asignacion: equipo.fecha_asignacion || '',
      procesador: equipo.procesador || '', ram: equipo.ram || '',
      disco_duro: equipo.disco_duro || '', sistema_operativo: equipo.sistema_operativo || '',
      garantia: equipo.garantia || '', especificaciones: equipo.especificaciones || '',
      empresa_id: equipo.empresa_id || ''
    });
    setCamposExtra(parsearCamposExtra(equipo.especificaciones));
    setErrorForm('');
    setMostrarModal(true);
  };

  const verDetalleEquipo = (equipo) => {
    setEquipoDetalle(equipo);
    setMostrarModalDetalle(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoForm(true);
    setErrorForm('');

    try {
      const camposFiltrados = camposExtra.filter(c => c.valor?.trim());
      const dataConExtras = {
        ...formData,
        especificaciones: camposFiltrados.length > 0 ? JSON.stringify(camposFiltrados) : ''
      };

      let result;
      if (equipoEditando) {
        result = await actualizarEquipo(equipoEditando.id, dataConExtras);
      } else {
        result = await crearEquipo(dataConExtras);
      }
      if (result.success) {
        setMostrarModal(false);
        cargarDatos();
      } else {
        setErrorForm(result.message || 'Error al guardar el equipo');
      }
    } catch (error) {
      setErrorForm(error.message || 'Error de conexión');
    } finally {
      setCargandoForm(false);
    }
  };

  const handleEliminar = (equipo) => {
    setConfirm({
      titulo: 'Mover a papelera',
      mensaje: `¿Estás seguro de mover "${equipo.nombre_equipo}" a la papelera?`,
      variante: 'warning',
      textConfirmar: 'Mover a papelera',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const result = await eliminarEquipo(equipo.id);
          if (result.success) { toast.success('Equipo movido a la papelera'); cargarDatos(); }
          else toast.error(result.message || 'Error al eliminar');
        } catch { toast.error('Error de conexión'); }
      },
    });
  };

  const toggleModoSeleccion = () => {
    setModoSeleccion(v => !v);
    setSeleccionados([]);
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === equiposPaginados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(equiposPaginados.map(e => e.id));
    }
  };

  const handleEliminarSeleccionados = () => {
    if (seleccionados.length === 0) return;
    setConfirm({
      titulo: 'Eliminar seleccionados',
      mensaje: `¿Mover ${seleccionados.length} equipo(s) seleccionado(s) a la papelera?`,
      variante: 'danger',
      textConfirmar: `Mover ${seleccionados.length} a papelera`,
      onConfirm: async () => {
        setConfirm(null);
        setCargandoOperacion(true);
        let eliminados = 0;
        for (let i = 0; i < seleccionados.length; i++) {
          setMensajeOperacion(`Eliminando ${i + 1} de ${seleccionados.length}...`);
          try { await eliminarEquipo(seleccionados[i]); eliminados++; } catch (_) {}
        }
        setCargandoOperacion(false);
        setMensajeOperacion('');
        setSeleccionados([]);
        setModoSeleccion(false);
        toast.success(`${eliminados} equipo(s) movidos a la papelera`);
        cargarDatos();
      },
    });
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Palabras clave para detectar la fila de encabezados
        const HEADER_KEYWORDS = ['nombre_equipo', 'nombre equipo', 'tipo', 'marca', 'serial', 'empresa'];

        const normalize = (v) =>
          String(v ?? '').toLowerCase().trim()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/\s+/g, '_');

        let rows = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          // Leer como arrays crudos para detectar la fila de headers
          const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          // Buscar la fila que contiene los encabezados reales
          const headerRowIndex = rawData.findIndex(row =>
            HEADER_KEYWORDS.some(kw =>
              row.some(cell => normalize(cell) === kw || normalize(cell).includes(kw.split('_')[0]))
            )
          );

          if (headerRowIndex === -1) continue;

          // Construir headers normalizados
          const headers = rawData[headerRowIndex].map(h => normalize(h));

          // Construir filas como objetos usando esos headers
          const dataRows = rawData
            .slice(headerRowIndex + 1)
            .filter(row => row.some(cell => String(cell).trim() !== ''))
            .map(row => {
              const obj = {};
              headers.forEach((h, idx) => { obj[h] = row[idx] ?? ''; });
              return obj;
            });

          if (dataRows.length > 0) { rows = dataRows; break; }
        }

        if (rows.length === 0) { toast.error('No se encontraron datos o encabezados válidos en el archivo'); return; }


        setImportModal({ estado: 'procesando', progreso: 0, total: rows.length, importados: 0, errores: [] });

        let importados = 0;
        const errores = [];

        const estadoMap = {
          'DISPONIBLE': 'Disponible', 'ASIGNADO': 'Asignado', 'BAJA': 'Baja',
          'ACTIVO': 'Activo', 'PRESTAMO': 'Préstamo', 'PRÉSTAMO': 'Préstamo',
          'MANTENIMIENTO': 'Mantenimiento', 'DAÑADO': 'Dañado',
        };

        for (let i = 0; i < rows.length; i++) {
          setImportModal(prev => ({ ...prev, progreso: i + 1 }));
          const row = rows[i];
          try {
            // Normalizar claves: minúsculas + sin espacios extras para lectura flexible
            const col = {};
            Object.keys(row).forEach(k => {
              col[k.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')] = row[k];
            });
            const g = (key) => String(col[key] ?? '').trim();

            const nombre_equipo     = g('nombre_equipo');
            const tipo              = g('tipo')              || 'Desktop';
            const marca             = g('marca');
            const modelo            = g('modelo');
            const serial            = g('serial');
            const ubicacion         = g('ubicacion');        // cubre "ubicación" sin acento
            const asignado_a        = g('asignado_a');
            const procesador        = g('procesador');
            const ram               = g('ram');              // cubre "Ram", "RAM"
            const disco_duro        = g('disco_duro');
            const sistema_operativo = g('sistema_operativo');
            const garantia          = g('garantia');
            const empresaNombre     = g('empresa');          // cubre "Empresa", "EMPRESA"

            let estado = String(row['estado'] || 'Disponible').trim();
            estado = estadoMap[estado.toUpperCase()] || estado || 'Disponible';

            // Código: usar serial si existe, si no generar EQ-XXXX
            const codigo = serial || `EQ-${String(i + 1).padStart(4, '0')}`;

            if (!nombre_equipo) {
              errores.push(`Fila ${i + 1}: Falta el nombre del equipo`);
              continue;
            }

            const empresaEncontrada = empresas.find(
              emp => emp.nombre.trim().toLowerCase() === empresaNombre.toLowerCase()
            );
            if (!empresaEncontrada) {
              errores.push(`Fila ${i + 1} (${codigo}): Empresa "${empresaNombre || '(vacía)'}" no encontrada`);
              continue;
            }

            const result = await crearEquipo({
              codigo, nombre_equipo, tipo, marca, modelo, serial,
              estado, ubicacion, asignado_a, procesador, ram,
              disco_duro, sistema_operativo, garantia,
              empresa_id: empresaEncontrada.id,
            });
            if (result.success) importados++;
            else errores.push(`Fila ${i + 1} (${codigo}): ${result.message}`);
          } catch (err) {
            errores.push(`Fila ${i + 1}: ${err.message}`);
          }
        }

        setImportModal({ estado: 'completado', progreso: rows.length, total: rows.length, importados, errores });
        cargarDatos();
      } catch (error) {
        setImportModal({ estado: 'idle', progreso: 0, total: 0, importados: 0, errores: [] });
        toast.error('Error al leer el archivo: ' + error.message);
      }
    };
    reader.onerror = () => toast.error('Error al leer el archivo');
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = async () => {
    setCargandoOperacion(true);
    setMensajeOperacion('Generando archivo Excel...');
    try {
      const dataToExport = equiposFiltrados.map(equipo => ({
        'Código': equipo.codigo || '', 'Equipo': equipo.nombre_equipo || '',
        'Tipo': equipo.tipo || '', 'Marca': equipo.marca || '',
        'Modelo': equipo.modelo || '', 'Serial': equipo.serial || '',
        'Estado': equipo.estado || '', 'Ubicación': equipo.ubicacion || '',
        'Asignado a': equipo.asignado_a || '', 'Procesador': equipo.procesador || '',
        'RAM': equipo.ram || '', 'Disco Duro': equipo.disco_duro || '',
        'Sistema Operativo': equipo.sistema_operativo || '', 'Garantía': equipo.garantia || '',
        'Empresa': empresas.find(e => e.id === equipo.empresa_id)?.nombre || ''
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
      XLSX.writeFile(wb, `equipos_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setCargandoOperacion(false);
      setMensajeOperacion('');
    }
  };

  const equiposFiltrados = equipos.filter(equipo => {
    if (filtroEstado && equipo.estado !== filtroEstado) return false;
    if (!filtroBusqueda) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    return equipo.codigo?.toLowerCase().includes(busqueda) ||
           equipo.nombre_equipo?.toLowerCase().includes(busqueda);
  });

  const totalPaginas = Math.max(1, Math.ceil(equiposFiltrados.length / itemsPorPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indexInicio = (paginaSegura - 1) * itemsPorPagina;
  const equiposPaginados = equiposFiltrados.slice(indexInicio, indexInicio + itemsPorPagina);

  if (cargando) return <div className="equipos-loading">Cargando equipos...</div>;

  return (
    <div className="equipos-container">

      <ConfirmModal
        open={confirm !== null}
        titulo={confirm?.titulo}
        mensaje={confirm?.mensaje}
        variante={confirm?.variante}
        textConfirmar={confirm?.textConfirmar}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
      <ImportModal
        {...importModal}
        onCerrar={() => setImportModal({ estado: 'idle', progreso: 0, total: 0, importados: 0, errores: [] })}
      />
      {cargandoOperacion && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="loading-spinner" />
            <p className="loading-msg">{mensajeOperacion}</p>
          </div>
        </div>
      )}
      <div className="equipos-header">
        <div className="equipos-title-section">
          <h1>Equipos</h1>
          <p>Gestión de equipos tecnológicos</p>
        </div>
        {puedeEditar && (
          <div className="equipos-actions">
            <label className="btn-secondary">Importar Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} style={{display:'none'}} /></label>
            <button className="btn-secondary" onClick={handleExportExcel}>Exportar Excel</button>
            {puedeEliminar && (
              <button
                className={modoSeleccion ? 'btn-seleccion-activa' : 'btn-secondary'}
                onClick={toggleModoSeleccion}
              >
                {modoSeleccion ? 'Cancelar selección' : 'Selección múltiple'}
              </button>
            )}
            <button className="btn-primary" onClick={abrirModalCrear}>Agregar</button>
          </div>
        )}
      </div>

      {modoSeleccion && (
        <div className="barra-seleccion">
          <span className="seleccion-info">
            {seleccionados.length === 0
              ? 'Selecciona los equipos que deseas eliminar'
              : `${seleccionados.length} equipo(s) seleccionado(s)`}
          </span>
          <button
            className="btn-eliminar-masivo"
            onClick={handleEliminarSeleccionados}
            disabled={seleccionados.length === 0}
          >
            Mover a papelera ({seleccionados.length})
          </button>
        </div>
      )}


      <div className="filter-container">
        <input
          className="filter-input"
          placeholder="Buscar por nombre o código..."
          value={filtroBusqueda}
          onChange={e => { setFiltroBusqueda(e.target.value); setPaginaActual(1); }}
        />
        <select
          className="filter-select"
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
        >
          <option value="">Todos los estados</option>
          {estados.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filtroBusqueda || filtroEstado) && (
          <button
            className="filter-clear"
            onClick={() => { setFiltroBusqueda(''); setFiltroEstado(''); setPaginaActual(1); }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {modoSeleccion && (
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={equiposPaginados.length > 0 && seleccionados.length === equiposPaginados.length}
                      onChange={toggleSeleccionarTodos}
                      className="checkbox-tabla"
                    />
                  </th>
                )}
                {esSuperAdmin && <th>Empresa</th>}
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Garantía</th>
                <th>Asignado a</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposPaginados.length === 0 ? (
                <tr>
                  <td colSpan={
                    (modoSeleccion ? 1 : 0) + (esSuperAdmin ? 1 : 0) + 7
                  } className="empty-cell">
                    No hay equipos registrados
                  </td>
                </tr>
              ) : (
                equiposPaginados.map(e => {
                  const empresa = empresas.find(emp => emp.id === e.empresa_id);
                  const seleccionado = seleccionados.includes(e.id);
                  return (
                    <tr
                      key={e.id}
                      className={seleccionado ? 'fila-seleccionada' : ''}
                      onClick={modoSeleccion ? () => toggleSeleccion(e.id) : undefined}
                      style={modoSeleccion ? { cursor: 'pointer' } : {}}
                    >
                      {modoSeleccion && (
                        <td className="td-checkbox" onClick={ev => ev.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleSeleccion(e.id)}
                            className="checkbox-tabla"
                          />
                        </td>
                      )}
                      {esSuperAdmin && <td className="empresa-cell">{empresa?.nombre || '-'}</td>}
                      <td className="equipo-cell">
                        <span className="equipo-codigo">{e.codigo || ''}</span>
                        {e.nombre_equipo || '-'}
                      </td>
                      <td>{e.tipo || '-'}</td>
                      <td>
                        <span className={`badge ${e.estado === 'Activo' ? 'badge-success' : e.estado === 'Asignado' ? 'badge-info' : e.estado === 'Préstamo' ? 'badge-warning' : e.estado === 'Dañado' ? 'badge-danger' : 'badge-neutral'}`}>
                          {e.estado || '-'}
                        </span>
                      </td>
                      <td>{(() => {
                        const g = calcularGarantia(e.fecha_asignacion, e.garantia);
                        if (!g.tiene) return <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>;
                        const c = colorGarantia(g.estado);
                        return (
                          <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                            {g.vencida ? 'Vencida' : textoGarantia(g)}
                          </span>
                        );
                      })()}</td>
                      <td>{e.asignado_a || '-'}</td>
                      <td>{e.ubicacion || '-'}</td>
                      <td className="acciones-cell">
                        <button className="btn-view" onClick={() => verDetalleEquipo(e)}>Ver</button>
                        {puedeEditar && !modoSeleccion && <button className="btn-edit" onClick={() => abrirModalEditar(e)}>Editar</button>}
                        {puedeEliminar && !modoSeleccion && <button className="btn-delete" onClick={() => handleEliminar(e)}>Eliminar</button>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {equiposFiltrados.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Mostrando {equiposFiltrados.length === 0 ? 0 : indexInicio + 1} a {Math.min(indexInicio + itemsPorPagina, equiposFiltrados.length)} de {equiposFiltrados.length}
            </span>
            {totalPaginas > 1 && (
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaSegura === 1}>Anterior</button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const page = totalPaginas <= 5 ? i + 1 : (paginaSegura <= 3 ? i + 1 : (paginaSegura >= totalPaginas - 2 ? totalPaginas - 4 + i : paginaSegura - 2 + i));
                  return <button key={page} className={`pagination-number ${paginaSegura === page ? 'active' : ''}`} onClick={() => setPaginaActual(page)}>{page}</button>;
                })}
                <button className="pagination-btn" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaSegura === totalPaginas}>Siguiente</button>
              </div>
            )}
            <div className="pagination-page-size">
              <span>Mostrar</span>
              <select value={itemsPorPagina} onChange={ev => { setItemsPorPagina(Number(ev.target.value)); setPaginaActual(1); }} className="pagination-select">
                <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
              </select>
              <span>por página</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{equipoEditando ? 'Editar Equipo' : 'Agregar Equipo'}</h2>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>✕</button>
            </div>
            {errorForm && <div className="modal-error">{errorForm}</div>}
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {esSuperAdmin && (
                    <div className="form-group">
                      <label>Empresa</label>
                      <select value={formData.empresa_id} onChange={e => setFormData({...formData, empresa_id: e.target.value})} required>
                        <option value="">Seleccionar</option>
                        {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group"><label>Código *</label><input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} required /></div>
                  <div className="form-group"><label>Nombre del equipo *</label><input type="text" value={formData.nombre_equipo} onChange={e => setFormData({...formData, nombre_equipo: e.target.value})} required /></div>
                  <div className="form-group"><label>Tipo</label><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>{tipos.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="form-group"><label>Estado</label><select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>{estados.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div className="form-group"><label>Marca</label><input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} /></div>
                  <div className="form-group"><label>Modelo</label><input type="text" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} /></div>
                  <div className="form-group"><label>Serial</label><input type="text" value={formData.serial} onChange={e => setFormData({...formData, serial: e.target.value})} /></div>
                  <div className="form-group"><label>Ubicación</label><input type="text" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} /></div>
                  <div className="form-group"><label>Asignado a</label><input type="text" value={formData.asignado_a} onChange={e => setFormData({...formData, asignado_a: e.target.value})} /></div>
                  <div className="form-group"><label>Procesador</label><input type="text" value={formData.procesador} onChange={e => setFormData({...formData, procesador: e.target.value})} /></div>
                  <div className="form-group"><label>RAM</label><input type="text" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} /></div>
                  <div className="form-group"><label>Disco Duro</label><input type="text" value={formData.disco_duro} onChange={e => setFormData({...formData, disco_duro: e.target.value})} /></div>
                  <div className="form-group"><label>Sistema Operativo</label><input type="text" value={formData.sistema_operativo} onChange={e => setFormData({...formData, sistema_operativo: e.target.value})} /></div>
                  <div className="form-group"><label>Garantía (meses)</label><input type="number" value={formData.garantia} onChange={e => setFormData({...formData, garantia: e.target.value})} /></div>
                </div>

                {/* Dispositivos / campos adicionales */}
                <div className="extras-section">
                  <div className="extras-header">
                    <span className="extras-title">Dispositivos adicionales</span>
                    <button
                      type="button"
                      className="btn-agregar-extra"
                      onClick={() => setCamposExtra(prev => [...prev, { valor: '' }])}
                    >
                      + Agregar
                    </button>
                  </div>
                  {camposExtra.length === 0 && (
                    <p className="extras-vacio">Sin dispositivos adicionales. Haz clic en "+ Agregar" para añadir.</p>
                  )}
                  {camposExtra.map((campo, idx) => (
                    <div key={idx} className="extra-row">
                      <input
                        className="extra-input"
                        type="text"
                        placeholder={`Ej: Mouse inalámbrico, Teclado, Audífonos...`}
                        value={campo.valor}
                        onChange={e => {
                          const nuevos = [...camposExtra];
                          nuevos[idx] = { valor: e.target.value };
                          setCamposExtra(nuevos);
                        }}
                      />
                      <button
                        type="button"
                        className="extra-btn-remove"
                        onClick={() => setCamposExtra(prev => prev.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={cargandoForm}>{cargandoForm ? 'Guardando...' : (equipoEditando ? 'Actualizar' : 'Guardar')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {mostrarModalDetalle && equipoDetalle && (
        <div className="modal-overlay" onClick={() => setMostrarModalDetalle(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Detalles del Equipo</h2><button className="modal-close" onClick={() => setMostrarModalDetalle(false)}>✕</button></div>
            <div className="modal-body details-grid">
              <div><strong>Código:</strong> {equipoDetalle.codigo || '-'}</div>
              <div><strong>Equipo:</strong> {equipoDetalle.nombre_equipo || '-'}</div>
              <div><strong>Tipo:</strong> {equipoDetalle.tipo || '-'}</div>
              <div><strong>Estado:</strong> {equipoDetalle.estado || '-'}</div>
              <div><strong>Marca:</strong> {equipoDetalle.marca || '-'}</div>
              <div><strong>Modelo:</strong> {equipoDetalle.modelo || '-'}</div>
              <div><strong>Serial:</strong> {equipoDetalle.serial || '-'}</div>
              <div><strong>Ubicación:</strong> {equipoDetalle.ubicacion || '-'}</div>
              <div><strong>Asignado a:</strong> {equipoDetalle.asignado_a || '-'}</div>
              <div><strong>Procesador:</strong> {equipoDetalle.procesador || '-'}</div>
              <div><strong>RAM:</strong> {equipoDetalle.ram || '-'}</div>
              <div><strong>Disco Duro:</strong> {equipoDetalle.disco_duro || '-'}</div>
              <div><strong>Sistema Operativo:</strong> {equipoDetalle.sistema_operativo || '-'}</div>
              <div><strong>Empresa:</strong> {empresas.find(e => e.id === equipoDetalle.empresa_id)?.nombre || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                {(() => {
                  const g = calcularGarantia(equipoDetalle.fecha_asignacion, equipoDetalle.garantia);
                  if (!g.tiene) return <><strong>Garantía:</strong> <span style={{ color: '#94a3b8' }}>Sin información</span></>;
                  const c = colorGarantia(g.estado);
                  return (
                    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: c.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {g.vencida ? 'Garantía vencida' : 'Garantía vigente'}
                          </p>
                          <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: c.color }}>
                            {g.vencida
                              ? `Venció hace ${textoGarantia(g)}`
                              : textoGarantia(g)}
                          </p>
                          {!g.vencida && (
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                              {g.años > 0 && <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: c.color }}>{g.años}</p>
                                <p style={{ margin: 0, fontSize: '10px', color: c.color, opacity: 0.8 }}>{g.años === 1 ? 'AÑO' : 'AÑOS'}</p>
                              </div>}
                              {g.meses > 0 && <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: c.color }}>{g.meses}</p>
                                <p style={{ margin: 0, fontSize: '10px', color: c.color, opacity: 0.8 }}>{g.meses === 1 ? 'MES' : 'MESES'}</p>
                              </div>}
                              <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: c.color }}>{g.dias}</p>
                                <p style={{ margin: 0, fontSize: '10px', color: c.color, opacity: 0.8 }}>{g.dias === 1 ? 'DÍA' : 'DÍAS'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '11px', color: c.color, opacity: 0.7 }}>Vence el</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: c.color }}>{g.fechaFinTexto}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: c.color, opacity: 0.7 }}>{equipoDetalle.garantia} meses de garantía</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {(() => {
                const extras = parsearCamposExtra(equipoDetalle.especificaciones);
                return extras.length > 0 ? (
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                    <strong>Dispositivos adicionales:</strong>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                      {extras.map((c, i) => <li key={i} style={{ fontSize: '13px', color: '#334155' }}>{c.valor}</li>)}
                    </ul>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="modal-footer"><button className="btn-primary" onClick={() => setMostrarModalDetalle(false)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipos;

// ==========================================
// 3. ESTILOS COMPACTOS
// ==========================================
const equiposStyles = document.createElement('style');
equiposStyles.textContent = `
  .equipos-container { padding: 16px; max-width: 100%; margin: 0; }
  .equipos-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
  .equipos-title-section h1 { font-size: 18px; font-weight: 600; color: #1a2c3e; margin: 0; }
  .equipos-title-section p { font-size: 11px; color: #718096; margin: 0; }
  .equipos-actions { display: flex; gap: 6px; }
  
  .btn-primary { background: #1a3a5c; color: white; padding: 5px 12px; border-radius: 5px; border: none; cursor: pointer; font-size: 11px; }
  .btn-secondary { background: #eef2f5; color: #2c4a6e; padding: 5px 12px; border-radius: 5px; border: 1px solid #dce4ec; cursor: pointer; font-size: 11px; }
  
  .filter-container { background: white; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .filter-input { padding: 5px 8px; border: 1px solid #d1dce6; border-radius: 5px; font-size: 11px; min-width: 180px; flex: 1; max-width: 260px; outline: none; }
  .filter-input:focus { border-color: #1a3a5c; }
  .filter-select { padding: 5px 8px; border: 1px solid #d1dce6; border-radius: 5px; font-size: 11px; background: white; cursor: pointer; outline: none; color: #334155; }
  .filter-select:focus { border-color: #1a3a5c; }
  .filter-clear { padding: 5px 10px; border-radius: 5px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 11px; cursor: pointer; white-space: nowrap; }
  .filter-clear:hover { background: #f1f5f9; color: #334155; }
  
  .table-container { background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; width: 100%; }
  .table-wrapper { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; min-width: 700px; }
  
  .data-table th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .data-table td { padding: 6px 8px; font-size: 11px; color: #1a2c3e; border-bottom: 1px solid #f1f5f9; }
  .data-table tbody tr:hover { background: #f8fafc; }
  
  .codigo-cell { font-weight: 600; color: #1a3a5c; }
  .empresa-cell, .equipo-cell { font-weight: 500; }
  
  .badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 500; }
  .badge-success { background: #c6f6d5; color: #22543d; }
  .badge-info { background: #bee3f8; color: #2c5282; }
  .badge-warning { background: #feebc8; color: #7b341e; }
  .badge-danger { background: #fed7d7; color: #742a2a; }
  .badge-neutral { background: #edf2f7; color: #4a5568; }
  
  .btn-view, .btn-edit, .btn-delete { padding: 2px 6px; border-radius: 4px; border: none; cursor: pointer; font-size: 9px; font-weight: 500; margin-right: 3px; }
  .btn-view { background: #e0f2fe; color: #0369a1; }
  .btn-edit { background: #e0e7ff; color: #4338ca; }
  .btn-delete { background: #fee2e2; color: #dc2626; }
  
  .mensaje-exito, .mensaje-error { padding: 6px 10px; border-radius: 5px; margin-bottom: 10px; font-size: 11px; }
  .mensaje-exito { background: #e8f5ed; color: #2a6e3b; }
  .mensaje-error { background: #feefee; color: #bc2c1e; }
  
  .pagination { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 6px; }
  .pagination-info { font-size: 10px; color: #718096; }
  .pagination-btn { padding: 3px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer; font-size: 10px; }
  .pagination-number { min-width: 24px; padding: 3px 6px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer; font-size: 10px; text-align: center; }
  .pagination-number.active { background: #1a3a5c; color: white; border-color: #1a3a5c; }
  .pagination-page-size { display: flex; align-items: center; gap: 5px; font-size: 10px; }
  .pagination-select { padding: 3px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 10px; }
  
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal-content { background: white; border-radius: 10px; width: 90%; max-width: 450px; max-height: 80vh; overflow-y: auto; }
  .modal-large { max-width: 700px; }
  .modal-header { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .modal-header h2 { font-size: 14px; font-weight: 600; margin: 0; }
  .modal-close { background: none; border: none; font-size: 16px; cursor: pointer; color: #94a3b8; }
  .modal-body { padding: 12px; }
  .modal-footer { padding: 10px 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; }

  /* Campos adicionales */
  .extras-section { margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
  .extras-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .extras-title { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; }
  .btn-agregar-extra { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
  .btn-agregar-extra:hover { background: #dbeafe; }
  .extras-vacio { font-size: 11px; color: #94a3b8; text-align: center; padding: 10px 0; margin: 0; }
  .extra-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
  .extra-input { flex: 1; padding: 6px 8px; border: 1px solid #d1dce6; border-radius: 6px; font-size: 12px; outline: none; }
  .extra-input:focus { border-color: #2563eb; }
  .extra-btn-remove { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-size: 11px; flex-shrink: 0; }
  .modal-error { background: #fed7d7; color: #742a2a; padding: 6px 10px; margin: 0 12px 10px 12px; border-radius: 5px; font-size: 11px; }
  
  .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .form-group { margin-bottom: 0; }
  .form-group label { display: block; font-size: 10px; font-weight: 600; color: #2d3748; margin-bottom: 2px; }
  .form-group input, .form-group select { width: 100%; padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 11px; outline: none; }
  
  .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .details-grid div { font-size: 11px; }
  
  .btn-cancel { padding: 4px 12px; border-radius: 5px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 11px; }
  .btn-save { padding: 4px 14px; border-radius: 5px; border: none; background: #1a3a5c; color: white; cursor: pointer; font-size: 11px; }
  
  .empty-cell { text-align: center; padding: 30px; color: #94a3b8; font-size: 11px; }
  .equipos-loading { text-align: center; padding: 30px; color: #718096; font-size: 11px; }

  /* Selección múltiple */
  .btn-seleccion-activa {
    padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 500;
    cursor: pointer; background: #fef3c7; color: #b45309;
    border: 1px solid #fcd34d; transition: background 0.15s;
  }
  .btn-seleccion-activa:hover { background: #fde68a; }
  .barra-seleccion {
    display: flex; align-items: center; justify-content: space-between;
    background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
    padding: 12px 20px; margin-bottom: 16px; gap: 16px; flex-wrap: wrap;
  }
  .seleccion-info { font-size: 14px; font-weight: 500; color: #92400e; }
  .btn-eliminar-masivo {
    background: #dc2626; color: white; border: none; border-radius: 8px;
    padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.15s;
  }
  .btn-eliminar-masivo:hover:not(:disabled) { background: #b91c1c; }
  .btn-eliminar-masivo:disabled { background: #fca5a5; cursor: not-allowed; }
  .th-checkbox, .td-checkbox { width: 40px; text-align: center; padding: 8px 4px !important; }
  .checkbox-tabla { width: 16px; height: 16px; cursor: pointer; accent-color: #2563eb; }
  .fila-seleccionada { background: #eff6ff !important; }
  .equipo-codigo { font-size: 11px; color: #94a3b8; display: block; line-height: 1.2; }

  .loading-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
  }
  .loading-box {
    background: white; border-radius: 16px; padding: 40px 48px;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); min-width: 260px;
  }
  .loading-spinner {
    width: 52px; height: 52px; border: 5px solid #e2e8f0;
    border-top-color: #2563eb; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-msg {
    font-size: 15px; font-weight: 500; color: #334155;
    text-align: center; margin: 0;
  }
  
  @media (max-width: 768px) {
    .equipos-container { padding: 10px; }
    .equipos-header { flex-direction: column; align-items: stretch; }
    .equipos-actions { justify-content: stretch; }
    .form-grid { grid-template-columns: 1fr; }
    .details-grid { grid-template-columns: 1fr; }
    .pagination { flex-direction: column; align-items: center; }
  }
`;
document.head.appendChild(equiposStyles);