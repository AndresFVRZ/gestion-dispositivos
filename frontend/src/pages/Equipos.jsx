import React, { useState, useEffect } from 'react';
import { getEquipos, eliminarEquipo } from '../services/equiposService';

function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      setCargando(true);
      const response = await getEquipos();
      if (response.data) {
        setEquipos(response.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este equipo?')) {
      try {
        await eliminarEquipo(id);
        cargarEquipos();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const getEstadoClass = (estado) => {
    const map = {
      'Activo': 'status-activo',
      'Asignado': 'status-asignado',
      'Disponible': 'status-disponible'
    };
    return map[estado] || 'status-disponible';
  };

  const equiposFiltrados = equipos.filter(e =>
    e.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.codigo?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.asignado_a?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando equipos...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Equipos</h1>
        <div className="page-actions">
          <button className="btn btn-outline">Exportar a Excel</button>
          <button className="btn btn-primary">+ Agregar equipo</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input-search"
          placeholder="Buscar equipo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Asignado a</th>
              <th>Ubicación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equiposFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No hay equipos registrados
                </td>
              </tr>
            ) : (
              equiposFiltrados.map((equipo) => (
                <tr key={equipo.id}>
                  <td>
                    <div><strong>{equipo.nombre || '-'}</strong></div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{equipo.codigo || '-'}</div>
                  </td>
                  <td>{equipo.tipo || '-'}</td>
                  <td>
                    <span className={`status-badge ${getEstadoClass(equipo.estado)}`}>
                      {equipo.estado || '-'}
                    </span>
                  </td>
                  <td>{equipo.asignado_a || '-'}</td>
                  <td>{equipo.ubicacion || '-'}</td>
                  <td>
                    <button style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => handleDelete(equipo.id)} style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Equipos;