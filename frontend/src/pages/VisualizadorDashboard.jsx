import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { useAuth } from '../context/AuthContext';

function VisualizadorDashboard() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const equiposRes = await getEquipos();
      
      if (equiposRes.data) {
        const equiposFiltrados = equiposRes.data.filter(e => e.empresa_id === usuario?.empresa_id);
        setEquipos(equiposFiltrados);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const totalEquipos = equipos.length;
  const equiposAsignados = equipos.filter(e => e.estado === 'asignado').length;
  const equiposDisponibles = equipos.filter(e => e.estado === 'disponible').length;

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'activo': return 'status-activo';
      case 'asignado': return 'status-asignado';
      case 'disponible': return 'status-disponible';
      case 'prestamo': return 'status-prestamo';
      case 'reparacion': return 'status-reparacion';
      case 'dañado': return 'status-danado';
      case 'baja': return 'status-baja';
      default: return 'status-disponible';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'asignado': return 'Asignado';
      case 'disponible': return 'Disponible';
      case 'prestamo': return 'Préstamo';
      case 'reparacion': return 'Reparación';
      case 'dañado': return 'Dañado';
      case 'baja': return 'Baja';
      default: return estado || 'Disponible';
    }
  };

  const equiposFiltrados = equipos.filter(e =>
    e.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.codigo?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.marca?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.asignado_a?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) {
    return <div className="visualizador-loading">Cargando dashboard...</div>;
  }

  return (
    <div className="visualizador-container">
      <div className="visualizador-header">
        <h1 className="visualizador-title">Panel de Control</h1>
        <p className="visualizador-subtitle">Bienvenido, {usuario?.nombre} - Visualización de equipos</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Equipos</h3>
            <p className="stat-number">{totalEquipos}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Asignados</h3>
            <p className="stat-number">{equiposAsignados}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Disponibles</h3>
            <p className="stat-number">{equiposDisponibles}</p>
          </div>
        </div>
      </div>

      <div className="visualizador-filter">
        <input
          type="text"
          className="filter-input"
          placeholder="Buscar equipo por nombre, código o asignado a..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="visualizador-section">
        <div className="section-header">
          <h2>Listado de Equipos</h2>
        </div>
        <div className="equipos-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Equipo</th>
                <th>Marca / Modelo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Asignado a</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <td><td colSpan="7" className="empty-data">No hay equipos registrados</td></td>
              ) : (
                equiposFiltrados.map(equipo => (
                  <tr key={equipo.id}>
                    <td className="codigo-cell">{equipo.codigo || '-'}</td>
                    <td className="equipo-cell">{equipo.nombre || '-'}</td>
                    <td className="modelo-cell">{equipo.marca || '-'} {equipo.modelo || '-'}</td>
                    <td>{equipo.tipo || '-'}</td>
                    <td>
                      <span className={`status-badge ${getColorEstado(equipo.estado)}`}>
                        {getEstadoTexto(equipo.estado)}
                      </span>
                    </td>
                    <td>{equipo.asignado_a || '-'}</td>
                    <td>{equipo.ubicacion || '-'}</td>
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

export default VisualizadorDashboard;

// ============================================
// ESTILOS DEL COMPONENTE
// ============================================
const visualizadorStyles = document.createElement('style');
visualizadorStyles.textContent = `
  .visualizador-container {
    padding: 24px;
    background: #f1f5f9;
    min-height: 100vh;
  }

  .visualizador-header {
    margin-bottom: 28px;
  }

  .visualizador-title {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .visualizador-subtitle {
    color: #64748b;
    font-size: 14px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 24px 20px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .stat-info h3 {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-number {
    font-size: 36px;
    font-weight: 700;
    color: #1e293b;
  }

  .visualizador-filter {
    margin-bottom: 20px;
  }

  .filter-input {
    width: 100%;
    max-width: 350px;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: white;
  }

  .filter-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
  }

  .visualizador-section {
    background: white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
  }

  .section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
  }

  .equipos-table-wrapper {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
  }

  .data-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .data-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }

  .data-table tbody tr:hover {
    background: #f8fafc;
  }

  .codigo-cell {
    font-weight: 600;
    color: #0f172a;
  }

  .equipo-cell {
    font-weight: 500;
  }

  .modelo-cell {
    font-size: 13px;
    color: #64748b;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    min-width: 90px;
    text-align: center;
  }

  .status-activo { background: #dcfce7; color: #166534; }
  .status-asignado { background: #dbeafe; color: #1e40af; }
  .status-disponible { background: #f1f5f9; color: #475569; }
  .status-prestamo { background: #fef3c7; color: #d97706; }
  .status-reparacion { background: #fed7aa; color: #9a3412; }
  .status-danado { background: #fee2e2; color: #dc2626; }
  .status-baja { background: #e2e8f0; color: #475569; }

  .empty-data {
    text-align: center;
    padding: 40px;
    color: #94a3b8;
  }

  .visualizador-loading {
    text-align: center;
    padding: 48px;
    color: #64748b;
  }

  @media (max-width: 768px) {
    .visualizador-container {
      padding: 16px;
    }
    
    .visualizador-title {
      font-size: 24px;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .filter-input {
      max-width: 100%;
    }
    
    .stat-number {
      font-size: 28px;
    }
  }
`;
document.head.appendChild(visualizadorStyles);