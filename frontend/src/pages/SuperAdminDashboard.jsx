// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import { getEmpresas } from '../services/empresasService';
import { getEquiposByEmpresa } from '../services/equiposService';
import { useAuth } from '../context/AuthContext';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function SuperAdminDashboard() {
  const [empresas, setEmpresas] = useState([]);
  const [equiposPorEmpresa, setEquiposPorEmpresa] = useState({});
  const [cargando, setCargando] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const empresasData = await getEmpresas();
      
      if (empresasData.success) {
        setEmpresas(empresasData.data);
        
        for (const empresa of empresasData.data) {
          const equiposData = await getEquiposByEmpresa(empresa.id);
          if (equiposData.success) {
            setEquiposPorEmpresa(prev => ({
              ...prev,
              [empresa.id]: equiposData.data
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoClass = (estado) => {
    const map = {
      'Activo': 'badge-success',
      'Asignado': 'badge-info',
      'Disponible': 'badge-neutral',
      'Mantenimiento': 'badge-warning',
      'Baja': 'badge-danger'
    };
    return map[estado] || 'badge-neutral';
  };

  const getNombreEstado = (estado) => {
    return estado || '-';
  };

  if (cargando) {
    return <div style={styles.cargando}>Cargando panel de super administrador...</div>;
  }

  const totalEquipos = Object.values(equiposPorEmpresa).flat().length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Panel de Super Administrador</h1>
        <p style={styles.subtitle}>
          Bienvenido, {usuario?.nombre} - Vista general de todas las empresas
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Empresas</h3>
          <p style={styles.statNumber}>{empresas.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Equipos</h3>
          <p style={styles.statNumber}>{totalEquipos}</p>
        </div>
      </div>

      {/* Lista de empresas */}
      <div style={styles.empresasList}>
        {empresas.map((empresa) => {
          const equipos = equiposPorEmpresa[empresa.id] || [];
          const activos = equipos.filter(e => e.estado === 'Activo').length;
          
          return (
            <div key={empresa.id} style={styles.empresaCard}>
              <div style={styles.empresaHeader}>
                <div>
                  <h3 style={styles.empresaTitle}>{empresa.nombre}</h3>
                  <div style={styles.empresaStats}>
                    <span style={styles.empresaStat}>ID: {empresa.id}</span>
                    <span style={styles.empresaStat}>Total equipos: <strong>{equipos.length}</strong></span>
                    <span style={styles.empresaStat}>Activos: <strong>{activos}</strong></span>
                  </div>
                </div>
              </div>

              {equipos.length === 0 ? (
                <div style={styles.emptyState}>
                  No hay equipos registrados en esta empresa
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th}>Código</th>
                        <th style={styles.th}>Equipo</th>
                        <th style={styles.th}>Tipo</th>
                        <th style={styles.th}>Estado</th>
                        <th style={styles.th}>Asignado a</th>
                        <th style={styles.th}>Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipos.map((equipo) => (
                        <tr key={equipo.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: '500' }}>{equipo.codigo || '-'}</td>
                          <td style={styles.td}>{equipo.nombre_equipo || '-'}</td>
                          <td style={styles.td}>{equipo.tipo || '-'}</td>
                          <td style={styles.td}>
                            <span className={getEstadoClass(equipo.estado)} style={styles.badge}>
                              {getNombreEstado(equipo.estado)}
                            </span>
                          </td>
                          <td style={styles.td}>{equipo.asignado_a || '-'}</td>
                          <td style={styles.td}>{equipo.ubicacion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
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
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  statTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: 'normal',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  empresasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  empresaCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  empresaHeader: {
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  empresaTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  empresaStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#6b7280',
    flexWrap: 'wrap',
  },
  empresaStat: {
    fontSize: '13px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
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
    height: '100vh',
    fontSize: '18px',
    color: '#6b7280',
  },
};

// ==========================================
// 4. EXPORTACIÓN
// ==========================================
export default SuperAdminDashboard;