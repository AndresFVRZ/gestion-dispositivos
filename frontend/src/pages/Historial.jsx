// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getHistorial } from '../services/historialService';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function Historial() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const { usuario } = useAuth();

  useEffect(() => {
    cargarHistorial();
  }, [filtroAccion, fechaDesde, fechaHasta]);

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const params = {};
      if (filtroAccion !== 'todos') params.accion = filtroAccion;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      
      const data = await getHistorial(params);
      if (data.success) {
        setHistorial(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const getColorAccion = (accion) => {
    const map = {
      'CREAR':                 'badge-success',
      'EDITAR':                'badge-info',
      'MANTENIMIENTO_CREAR':   'badge-mant',
      'MANTENIMIENTO_EDITAR':  'badge-mant',
      'MANTENIMIENTO_ELIMINAR':'badge-warning',
    };
    return map[accion] || 'badge-neutral';
  };

  const getNombreAccion = (accion) => {
    const map = {
      'CREAR':                 'Creación',
      'EDITAR':                'Edición',
      'MANTENIMIENTO_CREAR':     'Mantenimiento registrado',
      'MANTENIMIENTO_EDITAR':    'Mantenimiento editado',
      'MANTENIMIENTO_ELIMINAR':  'Mantenimiento eliminado',
      'MANTENIMIENTO_COMPLETAR': 'Mantenimiento completado',
      'MANTENIMIENTO_APROBAR':   'Mantenimiento aprobado',
      'MANTENIMIENTO_RECHAZAR':  'Mantenimiento rechazado',
    };
    return map[accion] || accion;
  };

  const obtenerDatosExport = async () => {
    const params = { sin_limite: 'true' };
    if (filtroAccion !== 'todos') params.accion = filtroAccion;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    const res = await getHistorial(params);
    return res?.data || [];
  };

  const descargarCSV = async () => {
    try {
      const datos = await obtenerDatosExport();
      if (datos.length === 0) { toast.error('No hay registros para descargar'); return; }
      const headers = ['Fecha', 'Usuario', 'Rol', 'Acción', 'Equipo', 'Código', 'Detalles', 'IP'];
      const filas = datos.map(item => [
        new Date(item.fecha).toLocaleString('es-CO'),
        item.usuario_nombre || '',
        item.usuario_rol || '',
        getNombreAccion(item.accion),
        item.equipo_nombre || '',
        item.equipo_codigo || '',
        (item.detalles || '').replace(/"/g, '""'),
        item.ip_address || '',
      ]);
      const csv = [headers, ...filas].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV descargado');
    } catch { toast.error('Error al generar el CSV'); }
  };

  const descargarTXT = async () => {
    try {
      const datos = await obtenerDatosExport();
      if (datos.length === 0) { toast.error('No hay registros para descargar'); return; }
      const sep = '-'.repeat(70);
      const lineas = [
        'EMTRA — Historial de Acciones',
        `Generado: ${new Date().toLocaleString('es-CO')}`,
        `Total registros: ${datos.length}`,
        '='.repeat(70), '',
        ...datos.flatMap(item => [
          `Fecha:    ${new Date(item.fecha).toLocaleString('es-CO')}`,
          `Usuario:  ${item.usuario_nombre || '-'} (${item.usuario_rol || '-'})`,
          `Acción:   ${getNombreAccion(item.accion)}`,
          `Equipo:   ${item.equipo_nombre || '-'}  |  Código: ${item.equipo_codigo || '-'}`,
          `Detalles: ${item.detalles || '-'}`,
          `IP:       ${item.ip_address || '-'}`,
          sep, '',
        ]),
      ];
      const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `historial_${new Date().toISOString().split('T')[0]}.txt`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('TXT descargado');
    } catch { toast.error('Error al generar el TXT'); }
  };

  const descargarPDF = async () => {
    setGenerandoPDF(true);
    try {
      // Traer todos los registros con los filtros activos, sin límite
      const params = { sin_limite: 'true' };
      if (filtroAccion !== 'todos') params.accion = filtroAccion;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const res = await getHistorial(params);
      const datos = res?.data || [];
      if (datos.length === 0) { toast.error('No hay registros para descargar'); return; }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fechaGen = new Date().toLocaleString('es-CO');

      const accionColor = (accion) => {
        const map = {
          'CREAR':                 [16, 185, 129],
          'EDITAR':                [59, 130, 246],
          'MANTENIMIENTO_CREAR':   [14, 165, 233],
          'MANTENIMIENTO_EDITAR':  [14, 165, 233],
          'MANTENIMIENTO_ELIMINAR':[245, 158, 11],
        };
        return map[accion] || [100, 116, 139];
      };

      // ── Encabezado ──
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, 297, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('EMTRA — Historial de Acciones', 14, 13);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${fechaGen}`, 283, 13, { align: 'right' });

      // ── Filtros aplicados ──
      doc.setTextColor(80, 80, 80); doc.setFontSize(8);
      let filtroTexto = `Total registros: ${datos.length}`;
      if (filtroAccion !== 'todos') filtroTexto += `  |  Tipo: ${getNombreAccion(filtroAccion)}`;
      if (fechaDesde) filtroTexto += `  |  Desde: ${fechaDesde}`;
      if (fechaHasta) filtroTexto += `  |  Hasta: ${fechaHasta}`;
      doc.text(filtroTexto, 14, 27);

      // ── Resumen por tipo de acción ──
      const conteo = {};
      datos.forEach(item => {
        const nombre = getNombreAccion(item.accion);
        conteo[nombre] = (conteo[nombre] || 0) + 1;
      });
      const resumenBody = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .map(([nombre, cant]) => [nombre, cant, `${Math.round(cant / datos.length * 100)}%`]);

      autoTable(doc, {
        startY: 31,
        head: [['Tipo de acción', 'Registros', '%']],
        body: resumenBody,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 7, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 22, halign: 'center' }, 2: { cellWidth: 16, halign: 'center' } },
        tableWidth: 100,
        margin: { left: 14 },
      });

      // ── Detalle agrupado por tipo ──
      const grupos = {};
      datos.forEach(item => {
        const key = getNombreAccion(item.accion);
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(item);
      });

      let y = doc.lastAutoTable.finalY + 6;

      for (const [tipo, items] of Object.entries(grupos).sort((a, b) => b[1].length - a[1].length)) {
        const color = accionColor(items[0]?.accion);

        // Cabecera de grupo
        doc.setFillColor(...color);
        doc.roundedRect(14, y, 269, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`${tipo.toUpperCase()}  (${items.length} registro${items.length !== 1 ? 's' : ''})`, 17, y + 4.2);
        y += 7;

        autoTable(doc, {
          startY: y,
          head: [['Fecha', 'Usuario', 'Equipo', 'Detalles']],
          body: items.map(item => [
            new Date(item.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
            item.usuario_nombre || '-',
            item.equipo_nombre || '-',
            item.detalles || '-',
          ]),
          styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: color, textColor: 255, fontSize: 7, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 42 },
            2: { cellWidth: 50 },
            3: { cellWidth: 'auto' },
          },
          margin: { left: 14, right: 14 },
        });

        y = doc.lastAutoTable.finalY + 5;
      }

      // ── Pie de página ──
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setTextColor(180, 180, 180);
        doc.text(`Página ${i} de ${pageCount}  —  EMTRA Gestión de Equipos`, 148.5, 205, { align: 'center' });
      }

      doc.save(`historial_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      toast.error('Error al generar el PDF');
      console.error(err);
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (cargando) {
    return <div style={styles.cargando}>Cargando historial...</div>;
  }

  return (
    <div style={styles.container}>

      {generandoPDF && (
        <div style={styles.overlay}>
          <div style={styles.overlayBox}>
            <div style={styles.spinner} />
            <p style={styles.overlayMsg}>Generando PDF...</p>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Historial de Acciones</h1>
          <p style={styles.subtitle}>Registro de todas las acciones del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={descargarPDF} disabled={generandoPDF || historial.length === 0} style={styles.pdfButton}>
            {generandoPDF ? 'Generando...' : '↓ PDF'}
          </button>
          <button onClick={descargarCSV} disabled={historial.length === 0} style={styles.csvButton}>
            ↓ CSV
          </button>
          <button onClick={descargarTXT} disabled={historial.length === 0} style={styles.txtButton}>
            ↓ TXT
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filtersContainer}>
        <div style={styles.filtersGrid}>
          <div>
            <label style={styles.label}>Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              style={styles.select}
            >
              <option value="todos">Todas</option>
              <option value="CREAR">Creación</option>
              <option value="EDITAR">Edición</option>
              <option value="MANTENIMIENTO_CREAR">Mantenimiento registrado</option>
              <option value="MANTENIMIENTO_EDITAR">Mantenimiento editado</option>
              <option value="MANTENIMIENTO_ELIMINAR">Mantenimiento eliminado</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.filterButtonContainer}>
            <button onClick={cargarHistorial} style={styles.filterButton}>
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de historial */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Acción</th>
                <th style={styles.th}>Equipo</th>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Detalles</th>
                <th style={styles.th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="8" style={styles.emptyCell}>
                    No hay registros en el historial
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>{new Date(item.fecha).toLocaleString()}</td>
                    <td style={{ ...styles.td, fontWeight: '500' }}>{item.usuario_nombre || '-'}</td>
                    <td style={styles.td}>{item.usuario_rol || '-'}</td>
                    <td style={styles.td}>
                      <span className={getColorAccion(item.accion)} style={styles.badge}>
                        {getNombreAccion(item.accion)}
                      </span>
                    </td>
                    <td style={styles.td}>{item.equipo_nombre || '-'}</td>
                    <td style={styles.td}>{item.equipo_codigo || '-'}</td>
                    <td style={styles.td}>{item.detalles || '-'}</td>
                    <td style={styles.td}>{item.ip_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ESTILOS
// ==========================================
const styles = {
  container: {
    padding: '24px',
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  filterButtonContainer: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  filterButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    fontWeight: '500',
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thead: {
    backgroundColor: '#f9fafb',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '60px',
    color: '#9ca3af',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cargando: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '256px',
    color: '#6b7280',
  },
  pdfButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: '600',
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  csvButton: {
    backgroundColor: '#16a34a',
    color: 'white',
    fontWeight: '600',
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  txtButton: {
    backgroundColor: '#4b5563',
    color: 'white',
    fontWeight: '600',
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  overlayBox: {
    background: 'white', borderRadius: '16px', padding: '40px 48px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', minWidth: '240px',
  },
  spinner: {
    width: '52px', height: '52px', border: '5px solid #e2e8f0',
    borderTopColor: '#dc2626', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  overlayMsg: {
    fontSize: '15px', fontWeight: '500', color: '#334155',
    textAlign: 'center', margin: 0,
  },
};

// ==========================================
// 4. ESTILOS GLOBALES (spinner)
// ==========================================
const historialStyles = document.createElement('style');
historialStyles.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(historialStyles);

// ==========================================
// 5. EXPORTACIÓN
// ==========================================
export default Historial;