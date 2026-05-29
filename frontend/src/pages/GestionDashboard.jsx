import React, { useState, useEffect } from 'react';
import { getEquipos } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';

function GestionDashboard() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaActiva, setEmpresaActiva] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [equiposRes, empresasRes] = await Promise.all([
        getEquipos(),
        getEmpresas()
      ]);
      
      if (equiposRes.data) setEquipos(equiposRes.data);
      
      if (empresasRes.data) {
        const empresasAsignadas = empresasRes.data.filter(e => 
          usuario?.empresas?.includes(e.id)
        );
        setEmpresas(empresasAsignadas);
        if (empresasAsignadas.length > 0) {
          setEmpresaActiva(empresasAsignadas[0].id);
        }
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const equiposPorEmpresa = equipos.filter(e => e.empresa_id === empresaActiva);
  
  const totalEquipos = equiposPorEmpresa.length;
  const equiposAsignados = equiposPorEmpresa.filter(e => e.estado === 'asignado').length;
  const equiposDisponibles = equiposPorEmpresa.filter(e => e.estado === 'disponible').length;

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

  const ultimosEquipos = [...equiposPorEmpresa]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (cargando) {
    return <div className="gestion-loading">Cargando dashboard...</div>;
  }

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <h1 className="gestion-title">Panel de Control</h1>
        <p className="gestion-subtitle">Bienvenido, {usuario?.nombre} - Gestión de equipos</p>
      </div>

      {empresas.length > 1 && (
        <div className="empresa-selector">
          <label>Empresa:</label>
          <select 
            value={empresaActiva} 
            onChange={(e) => setEmpresaActiva(parseInt(e.target.value))}
            className="empresa-select"
          >
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
            ))}
          </select>
        </div>
      )}

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

      <div className="gestion-section">
        <div className="section-header">
          <h2>Últimos Equipos Agregados</h2>
        </div>
        <div className="ultimos-equipos-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Equipo</th>
                <th>Marca / Modelo</th>
                <th>Estado</th>
                <th>Asignado a</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimosEquipos.length === 0 ? (
                <td><td colSpan="6" className="empty-data">No hay equipos registrados</td></td>
              ) : (
                ultimosEquipos.map(equipo => (
                  <tr key={equipo.id}>
                    <td className="codigo-cell">{equipo.codigo || '-'}</td>
                    <td className="equipo-cell">{equipo.nombre || '-'}</td>
                    <td className="modelo-cell">{equipo.marca || '-'} {equipo.modelo || '-'}</td>
                    <td>
                      <span className={`status-badge ${getColorEstado(equipo.estado)}`}>
                        {getEstadoTexto(equipo.estado)}
                      </span>
                    </td>
                    <td>{equipo.asignado_a || '-'}</td>
                    <td className="fecha-cell">{equipo.created_at ? new Date(equipo.created_at).toLocaleDateString() : '-'}</td>
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

export default GestionDashboard;

// ============================================
// ESTILOS DEL COMPONENTE
// ============================================
const gestionStyles = document.createElement('style');
gestionStyles.textContent = `
  .gestion-container {
    padding: 24px;
    background: #f1f5f9;
    min-height: 100vh;
  }

  .gestion-header {
    margin-bottom: 28px;
  }

  .gestion-title {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .gestion-subtitle {
    color: #64748b;
    font-size: 14px;
  }

  .empresa-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding: 12px 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .empresa-selector label {
    font-weight: 600;
    color: #334155;
    font-size: 14px;
  }

  .empresa-select {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
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

  .gestion-section {
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

  .ultimos-equipos-table {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
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

  .fecha-cell {
    font-size: 12px;
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

  .gestion-loading {
    text-align: center;
    padding: 48px;
    color: #64748b;
  }

  @media (max-width: 768px) {
    .gestion-container {
      padding: 16px;
    }
    
    .gestion-title {
      font-size: 24px;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .stat-number {
      font-size: 28px;
    }
  }
`;
document.head.appendChild(gestionStyles);