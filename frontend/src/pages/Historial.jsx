// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
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
      'ELIMINAR':              'badge-warning',
      'RESTAURAR':             'badge-info',
      'ELIMINAR_PERMANENTE':   'badge-danger',
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
      'ELIMINAR':              'Papelera',
      'RESTAURAR':             'Restauración',
      'ELIMINAR_PERMANENTE':   'Eliminación permanente',
      'MANTENIMIENTO_CREAR':   'Mantenimiento registrado',
      'MANTENIMIENTO_EDITAR':  'Mantenimiento editado',
      'MANTENIMIENTO_ELIMINAR':'Mantenimiento eliminado',
    };
    return map[accion] || accion;
  };

  const descargarPDF = async () => {
    setGenerandoPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Encabezado
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EMTRA — Historial de Acciones', 14, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const fechaGen = new Date().toLocaleString('es-CO');
      doc.text(`Generado: ${fechaGen}`, 297 - 14, 14, { align: 'right' });

      // Filtros aplicados
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      let filtroTexto = `Total registros: ${historial.length}`;
      if (filtroAccion !== 'todos') filtroTexto += `  |  Acción: ${filtroAccion}`;
      if (fechaDesde) filtroTexto += `  |  Desde: ${fechaDesde}`;
      if (fechaHasta) filtroTexto += `  |  Hasta: ${fechaHasta}`;
      doc.text(filtroTexto, 14, 28);

      const accionColor = (accion) => {
        const map = {
          'CREAR':               [16, 185, 129],
          'EDITAR':              [59, 130, 246],
          'ELIMINAR':            [245, 158, 11],
          'RESTAURAR':           [139, 92, 246],
          'ELIMINAR_PERMANENTE': [239, 68, 68],
        };
        return map[accion] || [100, 116, 139];
      };

      autoTable(doc, {
        startY: 32,
        head: [['Fecha', 'Usuario', 'Rol', 'Acción', 'Equipo', 'Código', 'Detalles', 'IP']],
        body: historial.map(item => [
          new Date(item.fecha).toLocaleString('es-CO'),
          item.usuario_nombre || '-',
          item.usuario_rol || '-',
          item.accion_texto || item.accion || '-',
          item.equipo_nombre || '-',
          item.equipo_codigo || '-',
          item.detalles || '-',
          item.ip_address || '-',
        ]),
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 30 },
          2: { cellWidth: 22 },
          3: { cellWidth: 28 },
          4: { cellWidth: 35 },
          5: { cellWidth: 22 },
          6: { cellWidth: 'auto' },
          7: { cellWidth: 28 },
        },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === 'body') {
            const accion = historial[data.row.index]?.accion;
            const [r, g, b] = accionColor(accion);
            data.cell.styles.textColor = [r, g, b];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Página ${i} de ${pageCount}`, 297 / 2, 205, { align: 'center' });
      }

      const nombreArchivo = `historial_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
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
        <button
          onClick={descargarPDF}
          disabled={generandoPDF || historial.length === 0}
          style={styles.pdfButton}
        >
          Descargar PDF
        </button>
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
              <option value="ELIMINAR">Papelera</option>
              <option value="RESTAURAR">Restauración</option>
              <option value="ELIMINAR_PERMANENTE">Eliminación permanente</option>
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
    alignSelf: 'flex-start',
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