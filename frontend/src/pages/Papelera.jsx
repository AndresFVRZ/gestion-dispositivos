// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import { getPapelera, restaurarEquipo, eliminarPermanente } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function Papelera() {
  const { usuario } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const esSuperAdmin = usuario?.rol === 'super_admin';

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [papeleraData, empresasData] = await Promise.all([
        getPapelera(),
        getEmpresas()
      ]);
      if (papeleraData.success) setEquipos(papeleraData.data);
      if (empresasData.success) setEmpresas(empresasData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleRestaurar = async (equipo) => {
    if (window.confirm(`¿Restaurar "${equipo.codigo} - ${equipo.nombre_equipo}"?`)) {
      try {
        const result = await restaurarEquipo(equipo.id);
        if (result.success) {
          setMensaje(`Equipo ${equipo.codigo} restaurado`);
          cargarDatos();
          setTimeout(() => setMensaje(''), 3000);
        } else {
          alert(result.message || 'Error al restaurar');
        }
      } catch (error) {
        alert('Error de conexión');
      }
    }
  };

  const handleEliminarPermanente = async (equipo) => {
    if (window.confirm(`¿Eliminar permanentemente "${equipo.codigo} - ${equipo.nombre_equipo}"? Esta acción no se puede deshacer.`)) {
      try {
        const result = await eliminarPermanente(equipo.id);
        if (result.success) {
          setMensaje(`Equipo ${equipo.codigo} eliminado permanentemente`);
          cargarDatos();
          setTimeout(() => setMensaje(''), 3000);
        } else {
          alert(result.message || 'Error al eliminar');
        }
      } catch (error) {
        alert('Error de conexión');
      }
    }
  };

  const equiposFiltrados = equipos.filter(equipo => {
    if (!filtroBusqueda) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    return equipo.codigo?.toLowerCase().includes(busqueda) ||
           equipo.nombre_equipo?.toLowerCase().includes(busqueda);
  });

  if (cargando) {
    return <div style={styles.cargando}>Cargando papelera...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Papelera</h1>
          <p style={styles.subtitle}>Equipos eliminados</p>
        </div>
      </div>

      {mensaje && <div style={styles.mensajeExito}>{mensaje}</div>}

      {/* Buscador */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            style={styles.input}
          />
        </div>
      </div>

      {/* Tabla de equipos en papelera */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                {esSuperAdmin && <th style={styles.th}>Empresa</th>}
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Equipo</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Estado original</th>
                <th style={styles.th}>Eliminado el</th>
                <th style={styles.th}>Eliminado por</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={esSuperAdmin ? 8 : 7} style={styles.emptyCell}>
                    No hay equipos en la papelera
                  </td>
                </tr>
              ) : (
                equiposFiltrados.map((equipo) => {
                  const empresa = empresas.find(e => e.id === equipo.empresa_id);
                  const fechaEliminacion = new Date(equipo.eliminado_en).toLocaleString();
                  return (
                    <tr key={equipo.id} style={styles.tr}>
                      {esSuperAdmin && <td style={styles.td}>{empresa?.nombre || '-'}</td>}
                      <td style={{ ...styles.td, fontWeight: '500' }}>{equipo.codigo || '-'}</td>
                      <td style={styles.td}>{equipo.nombre_equipo || '-'}</td>
                      <td style={styles.td}>{equipo.tipo || '-'}</td>
                      <td style={styles.td}>{equipo.estado || '-'}</td>
                      <td style={styles.td}>{fechaEliminacion}</td>
                      <td style={styles.td}>{equipo.eliminado_por_nombre || '-'}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleRestaurar(equipo)} style={styles.btnSuccess}>
                          Restaurar
                        </button>
                        <button onClick={() => handleEliminarPermanente(equipo)} style={styles.btnDanger}>
                          Eliminar permanentemente
                        </button>
                      </td>
                    </tr>
                  );
                })
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
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
  mensajeExito: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  searchWrapper: {
    maxWidth: '300px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
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
  btnSuccess: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
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
export default Papelera;