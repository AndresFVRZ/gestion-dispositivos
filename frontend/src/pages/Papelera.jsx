import React, { useState, useEffect } from 'react';
import { getPapelera, restaurarEquipo, eliminarPermanente } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import Boton from '../components/Common/Boton';

function Papelera() {
  const { token, usuario } = useAuth();
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
    return <div className="flex justify-center items-center h-64">Cargando papelera...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Papelera</h1>
          <p className="text-gray-500">Equipos eliminados (soft delete)</p>
        </div>
      </div>

      {mensaje && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
          {mensaje}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="max-w-md">
          <input
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="input"
          />
        </div>
      </div>

      {/* Tabla de equipos en papelera */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {esSuperAdmin && <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Empresa</th>}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Equipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado original</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Eliminado el</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Eliminado por</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {equiposFiltrados.map((equipo) => {
                const empresa = empresas.find(e => e.id === equipo.empresa_id);
                const fechaEliminacion = new Date(equipo.eliminado_en).toLocaleString();
                return (
                  <tr key={equipo.id} className="hover:bg-gray-50">
                    {esSuperAdmin && <td className="px-4 py-3 text-sm">{empresa?.nombre || '-'}</td>}
                    <td className="px-4 py-3 text-sm font-medium">{equipo.codigo || '-'}</td>
                    <td className="px-4 py-3 text-sm">{equipo.nombre_equipo || '-'}</td>
                    <td className="px-4 py-3 text-sm">{equipo.tipo || '-'}</td>
                    <td className="px-4 py-3 text-sm">{equipo.estado || '-'}</td>
                    <td className="px-4 py-3 text-sm">{fechaEliminacion}</td>
                    <td className="px-4 py-3 text-sm">{equipo.eliminado_por_nombre || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleRestaurar(equipo)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg mr-2 text-sm"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleEliminarPermanente(equipo)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Eliminar permanentemente
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {equiposFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">No hay equipos en la papelera</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Papelera;