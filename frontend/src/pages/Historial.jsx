import React, { useState, useEffect } from 'react';
import { getHistorial } from '../services/historialService';
import { useAuth } from '../context/AuthContext';

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
    switch (accion) {
      case 'CREAR': return 'bg-green-100 text-green-700';
      case 'EDITAR': return 'bg-blue-100 text-blue-700';
      case 'ELIMINAR': return 'bg-yellow-100 text-yellow-700';
      case 'RESTAURAR': return 'bg-purple-100 text-purple-700';
      case 'ELIMINAR_PERMANENTE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNombreAccion = (accion) => {
    switch (accion) {
      case 'CREAR': return 'Creación';
      case 'EDITAR': return 'Edición';
      case 'ELIMINAR': return 'Papelera';
      case 'RESTAURAR': return 'Restauración';
      case 'ELIMINAR_PERMANENTE': return 'Eliminación permanente';
      default: return accion;
    }
  };

  if (cargando) {
    return <div className="flex justify-center items-center h-64">Cargando historial...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Historial de Acciones</h1>
        <p className="text-gray-500">Registro de todas las acciones del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="input"
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
            <label className="label">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={cargarHistorial}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de historial */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acción</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Equipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Detalles</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historial.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(item.fecha).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.usuario_nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm">{item.usuario_rol || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorAccion(item.accion)}`}>
                      {getNombreAccion(item.accion)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.equipo_nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{item.equipo_codigo || '-'}</td>
                  <td className="px-4 py-3 text-sm">{item.detalles || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {historial.length === 0 && (
            <div className="text-center py-8 text-gray-500">No hay registros en el historial</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Historial;