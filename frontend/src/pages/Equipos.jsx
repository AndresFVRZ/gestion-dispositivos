// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getEquipos, eliminarEquipo, crearEquipo, actualizarEquipo, getEquipoById, reasignarPerifericos } from '../services/equiposService';
import { getEmpresas, getEmpresasParaPrestamo } from '../services/empresasService';
import { getSedes } from '../services/sedesService';
import { getProcesos } from '../services/procesosService';
import { getTiposEquipo, getTiposPeriferico } from '../services/tipoDispositivoService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/Common/ConfirmModal';
import ImportModal from '../components/Common/ImportModal';
import LoadingOverlay from '../components/Common/LoadingOverlay';
import { calcularGarantia, textoGarantia, colorGarantia, aTotalDias, diasADisplay, formatearDias } from '../utils/garantia';
import { getLogoEmpresa } from '../utils/logos';
import * as XLSX from 'xlsx';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function Equipos() {
  const { usuario } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [todasEmpresas, setTodasEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [equipoDetalle, setEquipoDetalle] = useState(null);
  const [cargandoOperacion, setCargandoOperacion] = useState(false);
  const [empresaFiltro, setEmpresaFiltro] = useState(null); // null = todas
  const [mensajeOperacion, setMensajeOperacion] = useState('');
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [perifericos, setPerifericos] = useState([]);
  const [garantiaValor, setGarantiaValor] = useState('');
  const [garantiaUnidad, setGarantiaUnidad] = useState('meses');
  const [confirm, setConfirm] = useState(null);
  const [importModal, setImportModal] = useState({ estado: 'idle', progreso: 0, total: 0, importados: 0, errores: [] });
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [tiposPeriferico, setTiposPeriferico] = useState([]);
  const [modalReasignar, setModalReasignar] = useState(null);
  const [busquedaSede, setBusquedaSede]         = useState('');
  const [showDropdownSede, setShowDropdownSede] = useState(false); // { equipoId, equipoNombre, perifericos, empresaId }
  const [reasignarDestino, setReasignarDestino] = useState('');
  const [reasignarSel, setReasignarSel] = useState([]);
  const [cargandoReasignar, setCargandoReasignar] = useState(false);

  const esSuperAdmin = usuario?.rol === 'super_admin';
  const puedeEditar = usuario?.rol === 'super_admin' || usuario?.rol === 'gestion';
  const puedeEliminar = usuario?.rol === 'super_admin';

  const [formData, setFormData] = useState({
    nombre_equipo: '', tipo_id: '', marca: '', modelo: '',
    serial: '', estado: 'Disponible', ubicacion: '', piso: '', modulo: '', asignado_a: '',
    fecha_asignacion: '', procesador: '', ram: '', disco_duro: '',
    sistema_operativo: '', garantia: '', especificaciones: '',
    observaciones: '', empresa_id: '', numero_placa: '', proceso_id: ''
  });

  const estados = ['Disponible', 'Asignado', 'Préstamo', 'Mantenimiento', 'Dañado', 'Obsoleto', 'Baja'];

  // Normaliza los campos de texto a mayúsculas antes de enviar al API
  const CAMPOS_NO_UPPER = new Set(['empresa_id', 'tipo_id', 'proceso_id', 'prestado_a_empresa_id',
    'sede', 'fecha_asignacion', 'garantia', 'estado']);
  const normalizeFormData = (data) =>
    Object.fromEntries(Object.entries(data).map(([k, v]) =>
      [k, typeof v === 'string' && !CAMPOS_NO_UPPER.has(k) ? v.toUpperCase() : v]
    ));

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [empresasData, equiposData, sedesData, tiposEqData, tipsPeriData, todasEmpData, procesosData] = await Promise.all([
        getEmpresas(), getEquipos(), getSedes(), getTiposEquipo(), getTiposPeriferico(), getEmpresasParaPrestamo(), getProcesos()
      ]);
      if (empresasData.success)  setEmpresas(empresasData.data);
      if (todasEmpData.success)  setTodasEmpresas(todasEmpData.data);
      if (equiposData.success)   setEquipos(equiposData.data);
      if (sedesData.success)    setSedes(sedesData.data);
      if (tiposEqData.success)  setTiposEquipo(tiposEqData.data);
      if (tipsPeriData.success) setTiposPeriferico(tipsPeriData.data);
      if (procesosData.success) setProcesos(procesosData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setEquipoEditando(null);
    setFormData({
      nombre_equipo: '', tipo_id: '', marca: '', modelo: '',
      serial: '', estado: 'Disponible', ubicacion: '', piso: '', modulo: '', asignado_a: '',
      fecha_asignacion: '', procesador: '', ram: '', disco_duro: '',
      sistema_operativo: '', garantia: '', especificaciones: '',
      observaciones: '', empresa_id: '', numero_placa: '', sede: '', prestado_a_empresa_id: '', proceso_id: ''
    });
    setPerifericos([]);
    setGarantiaValor('');
    setGarantiaUnidad('meses');
    setBusquedaSede('');
    setErrorForm('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (equipo) => {
    setEquipoEditando(equipo);
    setFormData({
      nombre_equipo: equipo.nombre_equipo || '',
      tipo_id: equipo.tipo_id || '', marca: equipo.marca || '',
      modelo: equipo.modelo || '', serial: equipo.serial || '',
      estado: equipo.estado || 'Disponible', ubicacion: equipo.ubicacion || '',
      piso: equipo.piso || '', modulo: equipo.modulo || '',
      asignado_a: equipo.asignado_a || '', fecha_asignacion: equipo.fecha_asignacion || '',
      procesador: equipo.procesador || '', ram: equipo.ram || '',
      disco_duro: equipo.disco_duro || '', sistema_operativo: equipo.sistema_operativo || '',
      garantia: equipo.garantia || '', especificaciones: equipo.especificaciones || '',
      observaciones: equipo.observaciones || '',
      empresa_id: equipo.empresa_id || '', numero_placa: equipo.numero_placa || '',
      sede: equipo.sede || '', prestado_a_empresa_id: equipo.prestado_a_empresa_id || '',
      proceso_id: equipo.proceso_id || ''
    });
    setBusquedaSede(equipo.sede || '');
    setPerifericos(
      (Array.isArray(equipo.perifericos) ? equipo.perifericos : []).map(p =>
        typeof p === 'string'
          ? { tipo_id: '', marca: '', modelo: '', serial: '', descripcion: p }
          : {
              tipo_id:     p.tipo_id     || '',
              marca:       p.marca       || '',
              modelo:      p.modelo      || '',
              serial:      p.serial      || '',
              descripcion: p.descripcion || ''
            }
      )
    );
    const disp = diasADisplay(equipo.garantia);
    setGarantiaValor(disp.valor ? String(disp.valor) : '');
    setGarantiaUnidad(disp.unidad);
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
      const payload = {
        ...normalizeFormData(formData),
        garantia: aTotalDias(garantiaValor, garantiaUnidad),
        perifericos: perifericos.filter(p => p.tipo_id || p.marca?.trim() || p.modelo?.trim() || p.serial?.trim() || p.descripcion?.trim())
      };

      let result;
      if (equipoEditando) {
        result = await actualizarEquipo(equipoEditando.id, payload);
      } else {
        result = await crearEquipo(payload);
      }
      if (result.success) {
        setMostrarModal(false);
        toast.success(equipoEditando ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente');

        // Si se puso en Baja, verificar si tiene periféricos para reasignar
        if (formData.estado === 'Baja') {
          const equipoId = equipoEditando?.id || result.data?.id;
          if (equipoId) {
            const r = await getEquipoById(equipoId);
            const perifs = r.success && Array.isArray(r.data?.perifericos) ? r.data.perifericos : [];
            if (perifs.length > 0) {
              setModalReasignar({ equipoId, equipoNombre: formData.nombre_equipo, perifericos: perifs, empresaId: formData.empresa_id });
              setReasignarSel(perifs.map(p => p.id));
              setReasignarDestino('');
            }
          }
        }

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

    // Refrescar empresas en el momento del import para tener la lista más actualizada
    let empresasParaImport = empresas;
    try {
      const empRes = await getEmpresas();
      if (empRes.success && empRes.data.length > 0) empresasParaImport = empRes.data;
    } catch (_) {}

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

        const normKey = (s) =>
          s.toLowerCase().trim()
           .normalize('NFD').replace(/[̀-ͯ]/g, '')
           .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');

        const normEmp = normKey;

        for (let i = 0; i < rows.length; i++) {
          setImportModal(prev => ({ ...prev, progreso: i + 1 }));
          const row = rows[i];
          try {
            // Normalizar claves del Excel para lectura flexible
            const col = {};
            Object.keys(row).forEach(k => {
              col[normKey(k)] = row[k];
            });
            const g = (...keys) => {
              for (const key of keys) {
                const v = String(col[normKey(key)] ?? '').trim();
                if (v) return v;
              }
              return '';
            };

            // ── Empresa ──────────────────────────────────────────────
            const empresaNombre = g('empresa', 'em', 'compania', 'company');

            const excelNorm = normEmp(empresaNombre);
            const empresaEncontrada = empresasParaImport.find(emp => {
              const dbNorm = normEmp(emp.nombre);
              return dbNorm === excelNorm ||
                     dbNorm.includes(excelNorm) ||
                     excelNorm.includes(dbNorm);
            });

            if (!empresaEncontrada) {
              errores.push(`Fila ${i + 1}: Empresa "${empresaNombre || '(vacía)'}" no encontrada`);
              continue;
            }

            // ── Campos principales ────────────────────────────────────
            const marca  = g('marca');
            const modelo = g('modelo');
            const serial = g('serial');

            // nombre_equipo: columna propia o combinación marca+modelo
            const nombre_equipo =
              g('nombre_equipo', 'nombre equipo', 'equipo', 'nombre') ||
              [marca, modelo].filter(Boolean).join(' ') ||
              `EQ-${String(i + 1).padStart(4, '0')}`;

            // código: placa inventario → serial → auto
            const codigo =
              g('placa inventario', 'placa', 'num inventario', 'codigo') ||
              serial ||
              `EQ-${String(i + 1).padStart(4, '0')}`;

            const numero_placa = g('placa inventario', 'placa', 'num inventario');

            // tipo equipo
            const tipoRaw = g('tipo equipo', 'tipo').toUpperCase();
            const tipoMap = {
              'LAPTOP': 'Portátil', 'PORTATIL': 'Portátil', 'PORTÁTIL': 'Portátil',
              'DESKTOP': 'Desktop', 'PC': 'Desktop', 'ESCRITORIO': 'Desktop',
              'COMPUTADORA': 'Desktop', 'COMPUTADOR': 'Desktop',
              'TABLET': 'Tablet',
              'TODO EN UNO': 'Todo en uno', 'ALL IN ONE': 'Todo en uno',
            };
            const tipoTexto = tipoMap[tipoRaw] || '';
            const tipoEncontrado = tiposEquipo.find(t => t.nombre.toLowerCase() === tipoTexto.toLowerCase());
            const tipo_id = tipoEncontrado?.id || null;

            // ubicación, piso y módulo
            const ubicacion = g('ubicacion', 'ubicación', 'area', 'área');
            const piso      = g('piso');
            const modulo    = g('modulo', 'módulo');

            // sistema operativo = SO + VERSION
            const so      = g('so', 'sistema operativo', 'sistema_operativo');
            const version = g('version', 'version so');
            const sistema_operativo = [so, version].filter(Boolean).join(' ') || '';

            // procesador = PROCESADOR + VELOCIDAD
            const proc     = g('procesador', 'cpu');
            const velocidad = g('velocidad', 'frecuencia');
            const procesador = [proc, velocidad].filter(Boolean).join(' ');

            // disco = DD + TECNOLOGIA
            const dd   = g('dd', 'disco duro', 'disco', 'almacenamiento');
            const tech = g('tecnologia', 'tecnología');
            const disco_duro = [dd, tech].filter(Boolean).join(' ');

            const ram       = g('ram', 'memoria');
            const garantia  = g('garantia', 'garantía');
            const asignado_a = g('usuario pc', 'usuario', 'asignado a', 'asignado_a', 'encargado');
            const fecha_asignacion = g('fecha', 'fecha asignacion', 'fecha instalacion') || null;
            const sede_nombre = g('sede');

            // estado
            let estado = g('estado', 'de baja') || 'Disponible';
            estado = estadoMap[estado.toUpperCase()] || 'Disponible';

            // ── Periféricos (DISP 1..N, detecta cuántos hay automáticamente) ──
            const headers = Object.keys(row).map(k => k.toLowerCase().trim());
            const maxDisp = headers.reduce((max, h) => {
              const m = h.match(/^nom(?:bre)?\s+disp\s+(\d+)$/);
              return m ? Math.max(max, parseInt(m[1])) : max;
            }, 0) || 10;
            const perifericos = [];
            for (let d = 1; d <= maxDisp; d++) {
              const nom    = g(`nom disp ${d}`, `nombre disp ${d}`);
              const mod    = g(`mod disp ${d}`, `modelo disp ${d}`);
              const marka  = g(`marca disp ${d}`);
              const numInv = g(`num inven disp ${d}`, `num inv disp ${d}`);
              const parts  = [nom, marka, mod, numInv].filter(Boolean);
              if (parts.length) perifericos.push({ tipo_id: null, descripcion: parts.join(' - ') });
            }

            const result = await crearEquipo(normalizeFormData({
              codigo, nombre_equipo, tipo_id, marca, modelo, serial,
              estado, ubicacion, piso: piso || null, modulo: modulo || null,
              asignado_a, procesador, ram,
              disco_duro, sistema_operativo, garantia,
              fecha_asignacion: fecha_asignacion || null,
              numero_placa: numero_placa || null,
              empresa_id: empresaEncontrada.id,
              perifericos,
              es_importacion: true,
            }));
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
        'Tipo': equipo.tipo_nombre || '', 'Marca': equipo.marca || '',
        'Modelo': equipo.modelo || '', 'Serial': equipo.serial || '',
        'Estado': equipo.estado || '', 'Proceso': equipo.proceso_nombre || '',
        'Piso': equipo.piso || '', 'Des. Puesto': equipo.modulo || '',
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

  // Cascada Empresa → Sede → Proceso
  const empresaSeleccionada = formData.empresa_id || (empresas.length === 1 ? String(empresas[0]?.id) : '');
  const sedeHabilitada      = !!empresaSeleccionada;
  const procesoHabilitado   = sedeHabilitada && !!formData.sede?.trim();
  const sedesCombo = sedes
    .filter(s => empresaSeleccionada && String(s.empresa_id) === String(empresaSeleccionada))
    .filter(s => !busquedaSede || s.nombre.toUpperCase().includes(busquedaSede.toUpperCase()));

  // Procesos filtrados por empresa, sin duplicados por nombre
  const empresaIdEfectiva = String(formData.empresa_id || (empresas.length === 1 ? empresas[0]?.id : '') || '');
  const procesosFiltrados = [
    ...new Map(
      procesos
        .filter(p => !empresaIdEfectiva || String(p.empresa_id) === empresaIdEfectiva)
        .map(p => [p.nombre, p])
    ).values()
  ].sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Procesos disponibles para el filtro (desde lista de procesos, filtrados por empresa activa)
  const procesosParaFiltro = empresaFiltro
    ? procesos.filter(p => p.empresa_id === empresaFiltro)
    : procesos.filter((p, i, arr) => arr.findIndex(x => x.nombre === p.nombre) === i);
  const pisosDisponibles  = [...new Set(equipos.map(e => e.piso).filter(Boolean))].sort();
  const modulosDisponibles = [...new Set(equipos.map(e => e.modulo).filter(Boolean))].sort();

  const equiposFiltrados = equipos.filter(equipo => {
    if (empresaFiltro) {
      const perteneceAEmpresa = equipo.empresa_id === empresaFiltro;
      const prestadoAEmpresa  = equipo.prestado_a_empresa_id === empresaFiltro;
      if (!perteneceAEmpresa && !prestadoAEmpresa) return false;
    }
    if (filtroEstado && equipo.estado !== filtroEstado) return false;
    if (filtroArea && String(equipo.proceso_id) !== String(filtroArea)) return false;
    if (!filtroBusqueda) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    return equipo.nombre_equipo?.toLowerCase().includes(busqueda) ||
           equipo.serial?.toLowerCase().includes(busqueda);
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


      {/* Selector de empresa — visible solo si hay más de una */}
      {empresas.length > 1 && (
        <div className="eq-selector-scroll">
          <button
            className={`eq-sel-card ${empresaFiltro === null ? 'eq-sel-card-active' : ''}`}
            onClick={() => { setEmpresaFiltro(null); setPaginaActual(1); }}
          >
            <div className="eq-sel-avatar eq-sel-avatar-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <p className="eq-sel-name">Todas</p>
            <p className="eq-sel-count">{equipos.length}</p>
          </button>
          {empresas.map(emp => {
            const logo = getLogoEmpresa(emp.nombre);
            const activa = empresaFiltro === emp.id;
            const cnt = equipos.filter(e => e.empresa_id === emp.id || e.prestado_a_empresa_id === emp.id).length;
            return (
              <button
                key={emp.id}
                className={`eq-sel-card ${activa ? 'eq-sel-card-active' : ''}`}
                onClick={() => { setEmpresaFiltro(emp.id); setPaginaActual(1); }}
              >
                <div className="eq-sel-avatar">
                  {logo
                    ? <img src={logo} alt={emp.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px' }} />
                    : <span style={{ fontWeight: '700', color: 'white', fontSize: '18px' }}>{emp.nombre.charAt(0)}</span>
                  }
                </div>
                <p className="eq-sel-name">{emp.nombre}</p>
                <p className="eq-sel-count">{cnt}</p>
              </button>
            );
          })}
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
        <select
          className="filter-select"
          value={filtroArea}
          onChange={e => { setFiltroArea(e.target.value); setPaginaActual(1); }}
        >
          <option value="">Todos los procesos</option>
          {procesosParaFiltro
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        {(filtroBusqueda || filtroEstado || filtroArea) && (
          <button
            className="filter-clear"
            onClick={() => { setFiltroBusqueda(''); setFiltroEstado(''); setFiltroArea(''); setPaginaActual(1); }}
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
                <th>Proceso</th>
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
                      <td className="equipo-cell">{e.nombre_equipo || '-'}</td>
                      <td>{e.tipo_nombre || '-'}</td>
                      <td>
                        <span className={`badge ${e.estado === 'Activo' ? 'badge-success' : e.estado === 'Asignado' ? 'badge-info' : e.estado === 'Préstamo' ? 'badge-warning' : e.estado === 'Dañado' ? 'badge-danger' : 'badge-neutral'}`}>
                          {e.estado || '-'}
                        </span>
                        {e.estado === 'Préstamo' && e.prestado_a_empresa_id && (() => {
                          // Si hay filtro activo, usarlo para determinar perspectiva
                          // Si no, el dueño ve "prestado a", el receptor ve "prestado de"
                          const viendoComoDueno = empresaFiltro
                            ? empresaFiltro === e.empresa_id
                            : e.prestado_a_empresa_id !== null && (
                                usuario?.empresas?.some(emp => emp.id === e.empresa_id) ||
                                usuario?.empresa_id === e.empresa_id
                              );
                          return viendoComoDueno ? (
                            <div style={{fontSize:'10px',color:'#065f46',background:'#d1fae5',border:'1px solid #6ee7b7',borderRadius:'4px',padding:'1px 6px',marginTop:'4px',whiteSpace:'nowrap'}}>
                              Prestado a: <strong>{e.prestado_a_nombre || '—'}</strong>
                            </div>
                          ) : (
                            <div style={{fontSize:'10px',color:'#92400e',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'4px',padding:'1px 6px',marginTop:'4px',whiteSpace:'nowrap'}}>
                              Prestado de: <strong>{e.empresa_nombre || '—'}</strong>
                            </div>
                          );
                        })()}
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
                      <td>{e.proceso_nombre || '-'}</td>
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

      {/* Modal de reasignación de periféricos */}
      {modalReasignar && (
        <div className="modal-overlay" onClick={() => setModalReasignar(null)}>
          <div className="modal-content" style={{maxWidth:'480px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reasignar periféricos</h2>
              <button className="modal-close" onClick={() => setModalReasignar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:'13px',color:'#475569',marginBottom:'14px'}}>
                El equipo <strong>{modalReasignar.equipoNombre}</strong> fue dado de baja.
                Selecciona los periféricos que deseas mover a otro equipo.
              </p>

              {/* Lista de periféricos con checkbox */}
              <div style={{marginBottom:'14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                  <span style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>Periféricos ({modalReasignar.perifericos.length})</span>
                  <button type="button" style={{fontSize:'11px',color:'#2563eb',background:'none',border:'none',cursor:'pointer'}}
                    onClick={() => setReasignarSel(
                      reasignarSel.length === modalReasignar.perifericos.length
                        ? []
                        : modalReasignar.perifericos.map(p => p.id)
                    )}>
                    {reasignarSel.length === modalReasignar.perifericos.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                </div>
                <div style={{border:'1px solid #e2e8f0',borderRadius:'8px',overflow:'hidden'}}>
                  {modalReasignar.perifericos.map((p, i) => {
                    const seleccionado = reasignarSel.includes(p.id);
                    const label = [p.tipo_nombre, p.marca, p.modelo, p.serial, p.descripcion].filter(Boolean).join(' — ') || `Periférico ${i + 1}`;
                    return (
                      <label key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',background: seleccionado ? '#eff6ff' : '#fff',borderBottom: i < modalReasignar.perifericos.length - 1 ? '1px solid #e2e8f0' : 'none',cursor:'pointer'}}>
                        <input type="checkbox" checked={seleccionado}
                          onChange={() => setReasignarSel(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                        <span style={{fontSize:'12px',color:'#334155'}}>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Selector de equipo destino */}
              <div style={{marginBottom:'6px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Equipo destino <span style={{color:'#ef4444'}}>*</span></label>
                <select style={{width:'100%',padding:'8px 10px',border:'1px solid #d1dce6',borderRadius:'6px',fontSize:'13px',outline:'none'}}
                  value={reasignarDestino} onChange={e => setReasignarDestino(e.target.value)}>
                  <option value="">Seleccionar equipo...</option>
                  {equipos
                    .filter(e => e.empresa_id === modalReasignar.empresaId && e.id !== modalReasignar.equipoId && e.estado !== 'Baja')
                    .map(e => <option key={e.id} value={e.id}>{e.nombre_equipo}{e.serial ? ` — ${e.serial}` : ''}</option>)
                  }
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{gap:'8px'}}>
              <button className="btn-cancel" onClick={() => setModalReasignar(null)}>Omitir</button>
              <button className="btn-save" disabled={cargandoReasignar || !reasignarDestino || reasignarSel.length === 0}
                onClick={async () => {
                  setCargandoReasignar(true);
                  try {
                    const r = await reasignarPerifericos(modalReasignar.equipoId, Number(reasignarDestino), reasignarSel);
                    if (r.success) {
                      toast.success(r.message);
                      setModalReasignar(null);
                      cargarDatos();
                    } else {
                      toast.error(r.message || 'Error al reasignar');
                    }
                  } catch { toast.error('Error de conexión'); }
                  finally { setCargandoReasignar(false); }
                }}>
                {cargandoReasignar ? 'Reasignando...' : `Reasignar (${reasignarSel.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de creación/edición */}
      {cargandoForm && <LoadingOverlay mensaje={equipoEditando ? 'Actualizando equipo...' : 'Guardando equipo...'} />}

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
                    <div className="form-group req">
                      <label>Empresa</label>
                      <select value={formData.empresa_id} onChange={e => setFormData({...formData, empresa_id: e.target.value, sede: '', proceso_id: ''})}>
                        <option value="">Seleccionar</option>
                        {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group opc">
                    <label>Sede</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder={sedeHabilitada ? 'Buscar sede...' : 'Selecciona una empresa primero'}
                        disabled={!sedeHabilitada}
                        value={busquedaSede}
                        onChange={e => {
                          setBusquedaSede(e.target.value);
                          setFormData(prev => ({...prev, sede: e.target.value, proceso_id: e.target.value.trim() ? prev.proceso_id : ''}));
                          setShowDropdownSede(true);
                        }}
                        onFocus={() => setShowDropdownSede(true)}
                        onBlur={() => setTimeout(() => setShowDropdownSede(false), 200)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1dce6', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', opacity: sedeHabilitada ? 1 : 0.45, cursor: sedeHabilitada ? 'text' : 'not-allowed', background: sedeHabilitada ? 'white' : '#f8fafc' }}
                      />
                      {showDropdownSede && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'white', border: '1px solid #d1dce6', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 9999, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
                          {sedesCombo.length === 0 ? (
                            <div style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>Sin sedes disponibles</div>
                          ) : sedesCombo.map(s => (
                            <div
                              key={s.id}
                              onMouseDown={() => {
                                setBusquedaSede(s.nombre);
                                setFormData(prev => ({...prev, sede: s.nombre}));
                                setShowDropdownSede(false);
                              }}
                              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#1e293b' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                              onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                              {s.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group req"><label>Nombre del equipo</label><input type="text" required value={formData.nombre_equipo} onChange={e => setFormData({...formData, nombre_equipo: e.target.value})} /></div>
                  <div className="form-group opc">
                    <label>Tipo de equipo</label>
                    <select value={formData.tipo_id} onChange={e => setFormData({...formData, tipo_id: e.target.value})}>
                      <option value="">Sin tipo</option>
                      {tiposEquipo.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group req">
                    <label>Estado</label>
                    {(() => {
                      const enPrestamo = !!equipoEditando?.prestado_a_empresa_id;
                      const esSA = usuario?.rol === 'super_admin';
                      const esGestion = usuario?.rol === 'gestion';
                      const esDueno = usuario?.empresas?.some(emp => emp.id === equipoEditando?.empresa_id) || usuario?.empresa_id === equipoEditando?.empresa_id;
                      const bloqueado = enPrestamo && !(esSA || (esGestion && esDueno));
                      return <>
                        <select
                          value={formData.estado}
                          disabled={bloqueado}
                          onChange={e => setFormData({...formData, estado: e.target.value, prestado_a_empresa_id: e.target.value !== 'Préstamo' ? '' : formData.prestado_a_empresa_id})}
                        >
                          {estados.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {bloqueado && (
                          <span style={{fontSize:'11px',color:'#92400e',marginTop:'4px',display:'block'}}>
                            Solo la empresa dueña puede cambiar el estado de un equipo en préstamo.
                          </span>
                        )}
                      </>;
                    })()}
                  </div>
                  {(['Dañado', 'Mantenimiento', 'Baja'].includes(formData.estado) || formData.observaciones) && (
                    <div className="form-group req observaciones-group">
                      <label className="observaciones-label">
                        Falla / Observaciones
                        {['Dañado', 'Mantenimiento', 'Baja'].includes(formData.estado) && (
                          <span className="observaciones-badge">{formData.estado}</span>
                        )}
                      </label>
                      <textarea
                        rows={3}
                        required={['Dañado', 'Mantenimiento', 'Baja'].includes(formData.estado)}
                        placeholder="Describe la falla o posible falla del equipo..."
                        value={formData.observaciones}
                        onChange={e => setFormData({...formData, observaciones: e.target.value})}
                      />
                    </div>
                  )}
                  {formData.estado === 'Préstamo' && (
                    <div className="form-group req">
                      <label>Prestado a empresa</label>
                      <select value={formData.prestado_a_empresa_id} onChange={e => setFormData({...formData, prestado_a_empresa_id: e.target.value})}>
                        <option value="">Seleccionar empresa...</option>
                        {todasEmpresas.filter(e => String(e.id) !== String(formData.empresa_id))
                          .map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group opc">
                    <label>Marca</label>
                    <input type="text" list="marcas-lista" placeholder="Escribe o selecciona..."
                      value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
                    <datalist id="marcas-lista">
                      {['HP','Dell','Lenovo','Asus','Acer','Apple','Toshiba','Samsung','MSI','Huawei','LG','Sony','Epson','Ricoh','Zebra','Genérico'].map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group opc"><label>Modelo</label><input type="text" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} /></div>
                  <div className="form-group opc"><label>Serial</label><input type="text" value={formData.serial} onChange={e => setFormData({...formData, serial: e.target.value.toUpperCase()})} style={{textTransform:'uppercase'}} /></div>
                  <div className="form-group opc">
                    <label>Proceso</label>
                    <select
                      disabled={!procesoHabilitado}
                      value={formData.proceso_id}
                      onChange={e => setFormData({...formData, proceso_id: e.target.value})}
                      style={!procesoHabilitado ? {opacity:0.45, cursor:'not-allowed', background:'#f8fafc'} : {}}
                    >
                      <option value="">{procesoHabilitado ? 'Sin proceso' : 'Completa la sede primero'}</option>
                      {procesosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group opc">
                    <label>Piso</label>
                    <input type="text" list="pisos-lista" placeholder="Ej: 1, 2, PB..."
                      value={formData.piso} onChange={e => setFormData({...formData, piso: e.target.value})} />
                    <datalist id="pisos-lista">
                      {pisosDisponibles.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  <div className="form-group opc">
                    <label>Des. Puesto</label>
                    <input type="text" list="modulos-lista" placeholder="Ej: A, B, 01..."
                      value={formData.modulo} onChange={e => setFormData({...formData, modulo: e.target.value})} />
                    <datalist id="modulos-lista">
                      {modulosDisponibles.map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                  <div className="form-group opc"><label>Asignado a</label><input type="text" value={formData.asignado_a} onChange={e => setFormData({...formData, asignado_a: e.target.value})} /></div>
                  <div className="form-group opc"><label>Procesador</label><input type="text" value={formData.procesador} onChange={e => setFormData({...formData, procesador: e.target.value})} /></div>
                  <div className="form-group opc"><label>RAM</label><input type="text" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} /></div>
                  <div className="form-group opc"><label>Disco Duro</label><input type="text" value={formData.disco_duro} onChange={e => setFormData({...formData, disco_duro: e.target.value})} /></div>
                  <div className="form-group opc"><label>Sistema Operativo</label><input type="text" value={formData.sistema_operativo} onChange={e => setFormData({...formData, sistema_operativo: e.target.value})} /></div>
                  <div className="form-group opc">
                    <label>Garantía</label>
                    <div style={{display:'flex', gap:'6px'}}>
                      <input
                        type="number" min="1"
                        placeholder="Ej: 12"
                        value={garantiaValor}
                        onChange={e => setGarantiaValor(e.target.value)}
                        style={{flex:1}}
                      />
                      <select
                        value={garantiaUnidad}
                        onChange={e => setGarantiaUnidad(e.target.value)}
                        style={{width:'90px'}}
                      >
                        <option value="días">Días</option>
                        <option value="meses">Meses</option>
                        <option value="años">Años</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group opc"><label>N° de placa</label><input type="text" placeholder="Ej: EMTRA-0042" value={formData.numero_placa} onChange={e => setFormData({...formData, numero_placa: e.target.value.toUpperCase()})} style={{textTransform:'uppercase'}} /></div>
                </div>

                {/* Periféricos */}
                <div className="extras-section">
                  <div className="extras-header">
                    <span className="extras-title">Periféricos</span>
                    <button
                      type="button"
                      className="btn-agregar-extra"
                      onClick={() => setPerifericos(prev => [...prev, { tipo_id: '', marca: '', modelo: '', serial: '', descripcion: '' }])}
                    >
                      + Agregar
                    </button>
                  </div>
                  {perifericos.length === 0 && (
                    <p className="extras-vacio">Sin periféricos. Haz clic en "+ Agregar" para añadir.</p>
                  )}
                  {perifericos.map((p, idx) => {
                    const upd = (field, val) => {
                      const nuevos = [...perifericos];
                      nuevos[idx] = { ...nuevos[idx], [field]: val };
                      setPerifericos(nuevos);
                    };
                    return (
                      <div key={idx} className="periferico-card">
                        <div className="periferico-card-top">
                          <select
                            className="extra-select"
                            value={p.tipo_id || ''}
                            onChange={e => upd('tipo_id', e.target.value)}
                          >
                            <option value="">Sin tipo</option>
                            {tiposPeriferico.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                          </select>
                          <button type="button" className="extra-btn-remove" onClick={() => setPerifericos(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                        </div>
                        <div className="periferico-card-fields">
                          <input className="extra-input" type="text" placeholder="Marca" value={p.marca || ''} onChange={e => upd('marca', e.target.value)} />
                          <input className="extra-input" type="text" placeholder="Modelo" value={p.modelo || ''} onChange={e => upd('modelo', e.target.value)} />
                          <input className="extra-input" type="text" placeholder="Serial" value={p.serial || ''} onChange={e => upd('serial', e.target.value.toUpperCase())} style={{textTransform:'uppercase'}} />
                          <input className="extra-input periferico-desc" type="text" placeholder="Descripción adicional" value={p.descripcion || ''} onChange={e => upd('descripcion', e.target.value)} />
                        </div>
                      </div>
                    );
                  })}
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

              <div><strong>Equipo:</strong> {equipoDetalle.nombre_equipo || '-'}</div>
              <div><strong>Tipo:</strong> {equipoDetalle.tipo_nombre || '-'}</div>
              <div><strong>Estado:</strong> {equipoDetalle.estado || '-'}</div>
              <div><strong>Marca:</strong> {equipoDetalle.marca || '-'}</div>
              <div><strong>Modelo:</strong> {equipoDetalle.modelo || '-'}</div>
              <div><strong>Serial:</strong> {equipoDetalle.serial || '-'}</div>
              <div><strong>N° de placa:</strong> {equipoDetalle.numero_placa || <span style={{color:'#94a3b8'}}>Sin placa</span>}</div>
              <div><strong>Proceso:</strong> {equipoDetalle.proceso_nombre || '-'}</div>
              <div><strong>Piso:</strong> {equipoDetalle.piso || '-'}</div>
              <div><strong>Des. Puesto:</strong> {equipoDetalle.modulo || '-'}</div>
              <div><strong>Asignado a:</strong> {equipoDetalle.asignado_a || '-'}</div>
              <div><strong>Procesador:</strong> {equipoDetalle.procesador || '-'}</div>
              <div><strong>RAM:</strong> {equipoDetalle.ram || '-'}</div>
              <div><strong>Disco Duro:</strong> {equipoDetalle.disco_duro || '-'}</div>
              <div><strong>Sistema Operativo:</strong> {equipoDetalle.sistema_operativo || '-'}</div>
              {equipoDetalle.observaciones && (
                <div style={{ gridColumn: '1 / -1', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Falla / Observaciones</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#431407', whiteSpace: 'pre-wrap' }}>{equipoDetalle.observaciones}</p>
                </div>
              )}
              <div><strong>Empresa:</strong> {empresas.find(e => e.id === equipoDetalle.empresa_id)?.nombre || '-'}</div>
              <div><strong>Sede:</strong> {equipoDetalle.sede || <span style={{color:'#94a3b8'}}>Sin sede</span>}</div>
              {equipoDetalle.estado === 'Préstamo' && equipoDetalle.prestado_a_empresa_id && (() => {
                const esOwner = empresaFiltro
                  ? empresaFiltro === equipoDetalle.empresa_id
                  : (usuario?.empresas?.some(emp => emp.id === equipoDetalle.empresa_id) ||
                     usuario?.empresa_id === equipoDetalle.empresa_id);
                return esOwner ? (
                  <div style={{gridColumn:'1/-1',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',padding:'10px 14px'}}>
                    <p style={{margin:'0 0 2px',fontSize:'11px',fontWeight:'700',color:'#166534',textTransform:'uppercase',letterSpacing:'0.4px'}}>Equipo en préstamo</p>
                    <p style={{margin:0,fontSize:'13px',color:'#14532d'}}>
                      Prestado a: <strong>{equipoDetalle.prestado_a_nombre || '—'}</strong>
                    </p>
                  </div>
                ) : (
                  <div style={{gridColumn:'1/-1',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'8px',padding:'10px 14px'}}>
                    <p style={{margin:'0 0 2px',fontSize:'11px',fontWeight:'700',color:'#92400e',textTransform:'uppercase',letterSpacing:'0.4px'}}>Equipo en préstamo</p>
                    <p style={{margin:0,fontSize:'13px',color:'#78350f'}}>
                      Prestado de: <strong>{equipoDetalle.empresa_nombre || '—'}</strong>
                    </p>
                  </div>
                );
              })()}
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
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: c.color, opacity: 0.7 }}>{formatearDias(equipoDetalle.garantia)} de garantía</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {Array.isArray(equipoDetalle.perifericos) && equipoDetalle.perifericos.length > 0 && (
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                  <strong>Periféricos:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    {equipoDetalle.perifericos.map((p, i) => {
                      const partes = [
                        p.tipo_nombre,
                        [p.marca, p.modelo].filter(Boolean).join(' '),
                        p.serial,
                        p.descripcion
                      ].filter(Boolean);
                      return <li key={i} style={{ fontSize: '13px', color: '#334155' }}>{partes.join(' — ') || '-'}</li>;
                    })}
                  </ul>
                </div>
              )}
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
  
  /* Selector empresa */
  .eq-selector-scroll {
    display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px;
    margin-bottom: 12px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
  }
  .eq-sel-card {
    flex-shrink: 0; width: 100px; background: white; border-radius: 12px;
    padding: 10px 8px; border: 2px solid transparent; cursor: pointer;
    text-align: center; transition: all 0.18s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .eq-sel-card:hover { border-color: #bfdbfe; transform: translateY(-2px); }
  .eq-sel-card-active { border-color: #2563eb !important; background: #eff6ff !important; }
  .eq-sel-avatar {
    width: 48px; height: 48px; border-radius: 10px;
    background: linear-gradient(135deg, #0f2b5c, #2563eb);
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .eq-sel-avatar-all { background: linear-gradient(135deg, #1e40af, #3b82f6); }
  .eq-sel-name { font-size: 10px; font-weight: 600; color: #0f172a; margin: 0; line-height: 1.3; }
  .eq-sel-count { font-size: 10px; color: #94a3b8; margin: 0; }

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
  .extra-input { flex: 1; padding: 6px 8px; border: 1px solid #d1dce6; border-radius: 6px; font-size: 12px; outline: none; background: #fff; }
  .extra-input:focus { border-color: #2563eb; }
  .extra-select { padding: 6px 8px; border: 1px solid #d1dce6; border-radius: 6px; font-size: 12px; outline: none; background: #fff; min-width: 110px; }
  .extra-select:focus { border-color: #2563eb; }
  .extra-btn-remove { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-size: 11px; flex-shrink: 0; }
  .periferico-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; background: #f8fafc; }
  .periferico-card-top { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
  .periferico-card-top .extra-select { flex: 1; }
  .periferico-card-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .periferico-desc { grid-column: 1 / -1; }
  .modal-error { background: #fed7d7; color: #742a2a; padding: 6px 10px; margin: 0 12px 10px 12px; border-radius: 5px; font-size: 11px; }
  .observaciones-group { grid-column: 1 / -1; }
  .observaciones-group textarea { width: 100%; padding: 8px 10px; border: 1px solid #fed7aa; border-radius: 6px; font-size: 12px; outline: none; resize: vertical; background: #fff7ed; font-family: inherit; box-sizing: border-box; }
  .observaciones-group textarea:focus { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249,115,22,.15); }
  .observaciones-label { display: flex; align-items: center; gap: 6px; }
  .observaciones-badge { background: #f97316; color: #fff; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
  
  .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .form-group { margin-bottom: 0; }
  .form-group label { display: block; font-size: 10px; font-weight: 600; color: #2d3748; margin-bottom: 2px; }
  .form-group.req label::after { content: " *"; color: #ef4444; font-weight: 700; }
  .form-group.opc label::after { content: " (opc)"; color: #9ca3af; font-weight: 400; font-size: 9px; }
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