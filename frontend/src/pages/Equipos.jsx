// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import { getEquipos, eliminarEquipo, crearEquipo, actualizarEquipo } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
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
  const [mostrarModal, setMostrarModal] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [mensajeImport, setMensajeImport] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [equipoDetalle, setEquipoDetalle] = useState(null);

  const esSuperAdmin = usuario?.rol === 'super_admin';
  const puedeEditar = usuario?.rol === 'super_admin' || usuario?.rol === 'gestion';

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
      if (esSuperAdmin) {
        const empresasData = await getEmpresas();
        if (empresasData.success) setEmpresas(empresasData.data);
      }
      const equiposData = await getEquipos();
      if (equiposData.success) setEquipos(equiposData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
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
      let result;
      if (equipoEditando) {
        result = await actualizarEquipo(equipoEditando.id, formData);
      } else {
        result = await crearEquipo(formData);
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

  const handleEliminar = async (equipo) => {
    if (window.confirm(`¿Eliminar "${equipo.codigo} - ${equipo.nombre_equipo}"?`)) {
      try {
        const result = await eliminarEquipo(equipo.id);
        if (result.success) cargarDatos();
        else alert(result.message || 'Error al eliminar');
      } catch (error) {
        alert('Error de conexión');
      }
    }
  };

  const handleImportExcel = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    alert('No se seleccionó ningún archivo');
    return;
  }

  console.log('📁 Archivo seleccionado:', file.name);

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Leer la Hoja2 (índice 1) donde están los datos reales
      const sheetName = workbook.SheetNames[1]; // Hoja2
      console.log('📊 Leyendo hoja:', sheetName);
      
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      
      console.log('📊 Filas encontradas:', rows.length);
      console.log('📊 Columnas detectadas:', Object.keys(rows[0] || {}));
      console.log('📊 Primera fila:', rows[0]);
      
      if (rows.length === 0) {
        alert('El archivo está vacío');
        return;
      }
      
      let importados = 0;
      let errores = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          // Usar los nombres exactos de tus columnas
          const codigo = row['codigo'] || '';
          const nombreEquipo = row['nombre_equipo'] || '';
          const tipo = row['tipo'] || 'Desktop';
          const marca = row['marca'] || '';
          const modelo = row['modelo'] || '';
          const serial = row['serial'] || '';
          let estado = row['estado'] || 'Disponible';
          const ubicacion = row['ubicación'] || row['ubicacion'] || '';
          const asignado_a = row['asignado_a'] || '';
          const procesador = row['procesador'] || '';
          const ram = row['Ram'] || row['ram'] || '';
          const disco_duro = row['disco_duro'] || '';
          const sistema_operativo = row['sistema_operativo'] || '';
          
          // Normalizar estado
          estado = estado.toUpperCase();
          if (estado === 'DISPONIBLE') estado = 'Disponible';
          if (estado === 'ASIGNADO') estado = 'Asignado';
          if (estado === 'BAJA') estado = 'Baja';
          if (estado === 'ACTIVO') estado = 'Activo';
          
          if (!codigo) {
            errores.push(`Fila ${i + 1}: Falta el código`);
            continue;
          }
          
          const nuevoEquipo = {
            codigo: String(codigo),
            nombre_equipo: String(nombreEquipo || 'Equipo sin nombre'),
            tipo: String(tipo),
            marca: String(marca),
            modelo: String(modelo),
            serial: String(serial),
            estado: String(estado),
            ubicacion: String(ubicacion),
            asignado_a: String(asignado_a),
            procesador: String(procesador),
            ram: String(ram),
            disco_duro: String(disco_duro),
            sistema_operativo: String(sistema_operativo),
            garantia: '',
            empresa_id: empresas[0]?.id || 1
          };
          
          console.log(`📝 Importando fila ${i + 1}:`, nuevoEquipo.codigo, nuevoEquipo.nombre_equipo);
          
          const result = await crearEquipo(nuevoEquipo);
          if (result.success) {
            importados++;
          } else {
            errores.push(`Fila ${i + 1}: ${result.message}`);
          }
        } catch (err) {
          errores.push(`Fila ${i + 1}: ${err.message}`);
        }
      }
      
      console.log('📊 Importados:', importados);
      console.log('📊 Errores:', errores.slice(0, 5));
      
      setMensajeImport(`Importación: ${importados} equipos importados, ${errores.length} errores`);
      cargarDatos();
      setTimeout(() => setMensajeImport(''), 5000);
      
    } catch (error) {
      console.error('Error al leer el archivo:', error);
      alert('Error al leer el archivo: ' + error.message);
    }
  };
  
  reader.onerror = (error) => {
    console.error('Error al leer el archivo:', error);
    alert('Error al leer el archivo');
  };
  
  reader.readAsArrayBuffer(file);
  event.target.value = '';
};

  const handleExportExcel = () => {
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
  };

  const equiposFiltrados = equipos.filter(equipo => {
    if (!filtroBusqueda) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    return equipo.codigo?.toLowerCase().includes(busqueda) ||
           equipo.nombre_equipo?.toLowerCase().includes(busqueda);
  });

  const totalPaginas = Math.ceil(equiposFiltrados.length / itemsPorPagina);
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const equiposPaginados = equiposFiltrados.slice(indexInicio, indexInicio + itemsPorPagina);

  if (cargando) return <div className="equipos-loading">Cargando equipos...</div>;

  return (
    <div className="equipos-container">
      <div className="equipos-header">
        <div className="equipos-title-section">
          <h1>Equipos</h1>
          <p>Gestión de equipos tecnológicos</p>
        </div>
        {puedeEditar && (
          <div className="equipos-actions">
            <label className="btn-secondary">Importar Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} style={{display:'none'}} /></label>
            <button className="btn-secondary" onClick={handleExportExcel}>Exportar Excel</button>
            <button className="btn-primary" onClick={abrirModalCrear}>Agregar</button>
          </div>
        )}
      </div>

      {mensajeImport && <div className={mensajeImport.includes('error') ? 'mensaje-error' : 'mensaje-exito'}>{mensajeImport}</div>}

      <div className="filter-container">
        <input className="filter-input" placeholder="Buscar por nombre o código..." value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)} />
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {esSuperAdmin && <th>Empresa</th>}
                <th>Código</th>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Asignado a</th>
                <th>Ubicación</th>
                {puedeEditar && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {equiposPaginados.length === 0 ? (
                <tr>
                  <td colSpan={esSuperAdmin ? 8 : 7} className="empty-cell">
                    No hay equipos registrados
                  </td>
                </tr>
              ) : (
                equiposPaginados.map(e => {
                  const empresa = empresas.find(emp => emp.id === e.empresa_id);
                  return (
                    <tr key={e.id}>
                      {esSuperAdmin && <td className="empresa-cell">{empresa?.nombre || '-'}</td>}
                      <td className="codigo-cell">{e.codigo || '-'}</td>
                      <td className="equipo-cell">{e.nombre_equipo || '-'}</td>
                      <td>{e.tipo || '-'}</td>
                      <td>
                        <span className={`badge ${e.estado === 'Activo' ? 'badge-success' : e.estado === 'Asignado' ? 'badge-info' : e.estado === 'Préstamo' ? 'badge-warning' : e.estado === 'Dañado' ? 'badge-danger' : 'badge-neutral'}`}>
                          {e.estado || '-'}
                        </span>
                      </td>
                      <td>{e.asignado_a || '-'}</td>
                      <td>{e.ubicacion || '-'}</td>
                      {puedeEditar && (
                        <td className="acciones-cell">
                          <button className="btn-view" onClick={() => verDetalleEquipo(e)}>Ver</button>
                          <button className="btn-edit" onClick={() => abrirModalEditar(e)}>Editar</button>
                          <button className="btn-delete" onClick={() => handleEliminar(e)}>Eliminar</button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="pagination">
            <span className="pagination-info">Mostrando {indexInicio+1} a {Math.min(indexInicio+itemsPorPagina, equiposFiltrados.length)} de {equiposFiltrados.length}</span>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => setPaginaActual(p => Math.max(1, p-1))} disabled={paginaActual===1}>Anterior</button>
              {Array.from({length: Math.min(5, totalPaginas)}, (_, i) => {
                let page = totalPaginas <= 5 ? i+1 : (paginaActual <= 3 ? i+1 : (paginaActual >= totalPaginas-2 ? totalPaginas-4+i : paginaActual-2+i));
                return <button key={page} className={`pagination-number ${paginaActual === page ? 'active' : ''}`} onClick={() => setPaginaActual(page)}>{page}</button>;
              })}
              <button className="pagination-btn" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p+1))} disabled={paginaActual===totalPaginas}>Siguiente</button>
            </div>
            <div className="pagination-page-size">
              <span>Mostrar</span>
              <select value={itemsPorPagina} onChange={e => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }} className="pagination-select">
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
              <div><strong>Garantía:</strong> {equipoDetalle.garantia || '-'}</div>
              <div><strong>Empresa:</strong> {empresas.find(e => e.id === equipoDetalle.empresa_id)?.nombre || '-'}</div>
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
  
  .filter-container { background: white; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
  .filter-input { width: 100%; max-width: 220px; padding: 5px 8px; border: 1px solid #d1dce6; border-radius: 5px; font-size: 11px; }
  
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