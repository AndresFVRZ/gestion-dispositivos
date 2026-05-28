// src/pages/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { getEmpresas } from '../services/empresasService';
import { getEquiposByEmpresa } from '../services/equiposService';
import { useAuth } from '../context/AuthContext';


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
        
        // Cargar equipos para cada empresa
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

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'Activo': return 'status-active';
      case 'Asignado': return 'status-info';
      case 'Disponible': return 'status-success';
      case 'Mantenimiento': return 'status-warning';
      case 'Baja': return 'status-danger';
      default: return 'status-default';
    }
  };

  if (cargando) {
    return (
      <div className="superadmin-loading">
        <div className="spinner"></div>
        <p>Cargando panel de super administrador...</p>
      </div>
    );
  }

  const totalEquipos = Object.values(equiposPorEmpresa).flat().length;

  return (
    <div className="superadmin-container">
      {/* Header */}
      <div className="superadmin-header">
        <h1>Panel de Super Administrador</h1>
        <p>
          Bienvenido, {usuario?.nombre} - Vista general de todas las empresas
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Empresas</h3>
          <p className="stat-number">{empresas.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Equipos</h3>
          <p className="stat-number">{totalEquipos}</p>
        </div>
      </div>

      {/* Lista de empresas */}
      <div className="empresas-list">
        {empresas.map((empresa) => {
          const equipos = equiposPorEmpresa[empresa.id] || [];
          const activos = equipos.filter(e => e.estado === 'Activo').length;
          
          return (
            <div key={empresa.id} className="empresa-card">
              <div className="empresa-header">
                <div>
                  <h3>{empresa.nombre}</h3>
                  <div className="empresa-stats">
                    <span>ID: {empresa.id}</span>
                    <span>Total equipos: <strong>{equipos.length}</strong></span>
                    <span>Activos: <strong>{activos}</strong></span>
                  </div>
                </div>
              </div>

              {equipos.length === 0 ? (
                <div className="empty-state">
                  No hay equipos registrados en esta empresa
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Equipo</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Asignado a</th>
                        <th>Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipos.map((equipo) => (
                        <tr key={equipo.id}>
                          <td className="font-medium">{equipo.codigo || '-'}</td>
                          <td>{equipo.nombre_equipo || '-'}</td>
                          <td>{equipo.tipo || '-'}</td>
                          <td>
                            <span className={`status-badge ${getColorEstado(equipo.estado)}`}>
                              {equipo.estado || '-'}
                            </span>
                          </td>
                          <td>{equipo.asignado_a || '-'}</td>
                          <td>{equipo.ubicacion || '-'}</td>
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

export default SuperAdminDashboard;