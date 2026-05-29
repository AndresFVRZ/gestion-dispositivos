// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import { getHistorial } from '../services/historialService';
import { useAuth } from '../context/AuthContext';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function Historial() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
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
      'CREAR': 'badge-success',
      'EDITAR': 'badge-info',
      'ELIMINAR': 'badge-warning',
      'RESTAURAR': 'badge-info',
      'ELIMINAR_PERMANENTE': 'badge-danger'
    };
    return map[accion] || 'badge-neutral';
  };

  const getNombreAccion = (accion) => {
    const map = {
      'CREAR': 'Creación',
      'EDITAR': 'Edición',
      'ELIMINAR': 'Papelera',
      'RESTAURAR': 'Restauración',
      'ELIMINAR_PERMANENTE': 'Eliminación permanente'
    };
    return map[accion] || accion;
  };

  if (cargando) {
    return <div style={styles.cargando}>Cargando historial...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Historial de Acciones</h1>
        <p style={styles.subtitle}>Registro de todas las acciones del sistema</p>
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
};

// ==========================================
// 4. EXPORTACIÓN
// ==========================================
export default Historial;