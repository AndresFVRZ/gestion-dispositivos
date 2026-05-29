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
    if (window.confirm(`Restaurar "${equipo.codigo} - ${equipo.nombre_equipo}"?`)) {
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
    if (window.confirm(`Eliminar permanentemente "${equipo.codigo} - ${equipo.nombre_equipo}"? Esta accion no se puede deshacer.`)) {
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

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const equiposFiltrados = equipos.filter(equipo => {
    if (!filtroBusqueda) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    return equipo.codigo?.toLowerCase().includes(busqueda) ||
           equipo.nombre_equipo?.toLowerCase().includes(busqueda);
  });

  if (cargando) {
    return <div className="papelera-loading">Cargando papelera...</div>;
  }

  return (
    <div className="papelera-container">
      <div className="papelera-header">
        <div>
          <h1 className="papelera-title">Papelera</h1>
          <p className="papelera-subtitle">Equipos eliminados</p>
        </div>
      </div>

      {mensaje && <div className="papelera-mensaje">{mensaje}</div>}

      <div className="papelera-filter">
        <input
          type="text"
          className="papelera-filter-input"
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          placeholder="Buscar por nombre o codigo..."
        />
      </div>

      <div className="papelera-table-container">
        <div className="papelera-table-wrapper">
          <table className="papelera-table">
            <thead>
              <tr>
                {esSuperAdmin && <th>Empresa</th>}
                <th>Codigo</th>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Eliminado el</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={esSuperAdmin ? 7 : 6} className="papelera-empty">
                    No hay equipos en la papelera
                  </td>
                </tr>
              ) : (
                equiposFiltrados.map((equipo) => {
                  const empresa = empresas.find(e => e.id === equipo.empresa_id);
                  return (
                    <tr key={equipo.id}>
                      {esSuperAdmin && <td>{empresa?.nombre || '-'}</td>}
                      <td className="papelera-codigo">{equipo.codigo || '-'}</td>
                      <td className="papelera-equipo">{equipo.nombre_equipo || '-'}</td>
                      <td>{equipo.tipo || '-'}</td>
                      <td>{equipo.estado || '-'}</td>
                      <td className="papelera-fecha">{formatFecha(equipo.eliminado_en)}</td>
                      <td className="papelera-acciones">
                        <button className="papelera-btn-restaurar" onClick={() => handleRestaurar(equipo)}>Restaurar</button>
                        <button className="papelera-btn-eliminar" onClick={() => handleEliminarPermanente(equipo)}>Eliminar</button>
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

export default Papelera;

// ==========================================
// 3. ESTILOS COMPACTOS
// ==========================================
const papeleraStyles = document.createElement('style');
papeleraStyles.textContent = `
  .papelera-container {
    padding: 16px;
    max-width: 100%;
    margin: 0;
  }

  .papelera-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .papelera-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a2c3e;
    margin: 0 0 2px 0;
  }

  .papelera-subtitle {
    font-size: 11px;
    color: #718096;
    margin: 0;
  }

  .papelera-mensaje {
    background: #d1fae5;
    color: #065f46;
    padding: 6px 10px;
    border-radius: 5px;
    margin-bottom: 12px;
    font-size: 11px;
  }

  .papelera-filter {
    background: white;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 12px;
    border: 1px solid #e2e8f0;
  }

  .papelera-filter-input {
    width: 100%;
    max-width: 220px;
    padding: 5px 8px;
    border: 1px solid #d1dce6;
    border-radius: 5px;
    font-size: 11px;
    outline: none;
  }

  .papelera-filter-input:focus {
    border-color: #1a3a5c;
    box-shadow: 0 0 0 2px rgba(26,58,92,0.1);
  }

  .papelera-table-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    width: 100%;
  }

  .papelera-table-wrapper {
    overflow-x: auto;
  }

  .papelera-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
  }

  .papelera-table th {
    padding: 8px 10px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .papelera-table td {
    padding: 8px 10px;
    font-size: 11px;
    color: #1a2c3e;
    border-bottom: 1px solid #f1f5f9;
  }

  .papelera-table tbody tr:hover {
    background: #f8fafc;
  }

  .papelera-codigo {
    font-weight: 600;
    color: #1a3a5c;
  }

  .papelera-equipo {
    font-weight: 500;
  }

  .papelera-fecha {
    font-size: 10px;
    color: #718096;
    white-space: nowrap;
  }

  .papelera-acciones {
    white-space: nowrap;
  }

  .papelera-btn-restaurar {
    background: #e0f2fe;
    color: #0369a1;
    padding: 3px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    font-weight: 500;
    margin-right: 5px;
  }

  .papelera-btn-restaurar:hover {
    background: #bae6fd;
  }

  .papelera-btn-eliminar {
    background: #fee2e2;
    color: #dc2626;
    padding: 3px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    font-weight: 500;
  }

  .papelera-btn-eliminar:hover {
    background: #fecaca;
  }

  .papelera-empty {
    text-align: center;
    padding: 30px;
    color: #94a3b8;
    font-size: 11px;
  }

  .papelera-loading {
    text-align: center;
    padding: 30px;
    color: #718096;
    font-size: 11px;
  }

  @media (max-width: 768px) {
    .papelera-container {
      padding: 10px;
    }
    
    .papelera-filter-input {
      max-width: 100%;
    }
  }
`;
document.head.appendChild(papeleraStyles);