import React, { useState, useEffect } from 'react';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../services/authService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import Boton from '../components/Common/Boton';
import Input from '../components/Common/Input';

function Usuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol_id: 2,
    empresas_ids: []  // 👈 CAMBIADO: array de IDs de empresas
  });

  const roles = [
    { id: 1, nombre: 'super_admin' },
    { id: 2, nombre: 'gestion' },
    { id: 3, nombre: 'visualizador' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [usuariosData, empresasData] = await Promise.all([
        getUsuarios(),
        getEmpresas()
      ]);
      if (usuariosData.success) setUsuarios(usuariosData.data);
      if (empresasData.success) setEmpresas(empresasData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol_id: 2,
      empresas_ids: []
    });
    setErrorForm('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol_id: usuario.rol_id || 2,
      empresas_ids: usuario.empresas?.map(e => e.id) || []  // 👈 CARGAR EMPRESAS ASIGNADAS
    });
    setErrorForm('');
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoForm(true);
    setErrorForm('');

    try {
      let result;
      if (usuarioEditando) {
        result = await actualizarUsuario(usuarioEditando.id, {
          nombre: formData.nombre,
          email: formData.email,
          rol_id: formData.rol_id,
          estado: 'activo',
          empresas_ids: formData.empresas_ids  // 👈 ENVIAR ARRAY
        });
      } else {
        result = await crearUsuario({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol_id: formData.rol_id,
          empresas_ids: formData.empresas_ids  // 👈 ENVIAR ARRAY
        });
      }
      
      if (result.success) {
        setMostrarModal(false);
        cargarDatos();
        setMensaje(usuarioEditando ? 'Usuario actualizado' : 'Usuario creado');
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setErrorForm(result.message || 'Error al guardar');
      }
    } catch (error) {
      setErrorForm(error.message || 'Error de conexión');
    } finally {
      setCargandoForm(false);
    }
  };

  const handleEliminar = async (usuario) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${usuario.nombre}"?`)) {
      try {
        const result = await eliminarUsuario(usuario.id);
        if (result.success) {
          cargarDatos();
          setMensaje('Usuario eliminado');
          setTimeout(() => setMensaje(''), 3000);
        } else {
          alert(result.message || 'Error al eliminar');
        }
      } catch (error) {
        alert('Error de conexión');
      }
    }
  };

  const getRolNombre = (rolId) => {
    const rol = roles.find(r => r.id === rolId);
    return rol ? rol.nombre : 'Desconocido';
  };

  // Obtener nombres de empresas para mostrar en la tabla
  const getEmpresasNombres = (empresasIds) => {
    if (!empresasIds || empresasIds.length === 0) return '-';
    const nombres = empresasIds.map(id => {
      const empresa = empresas.find(e => e.id === id);
      return empresa?.nombre || '';
    }).filter(n => n);
    return nombres.join(', ');
  };

  if (cargando) {
    return <div className="flex justify-center items-center h-64">Cargando usuarios...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500">Gestión de usuarios del sistema</p>
        </div>
        <Boton onClick={abrirModalCrear} variant="primary">
          + Agregar usuario
        </Boton>
      </div>

      {mensaje && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
          {mensaje}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Empresas</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((usuario) => {
                return (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{usuario.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{usuario.nombre}</td>
                    <td className="px-4 py-3 text-sm">{usuario.email}</td>
                    <td className="px-4 py-3 text-sm">{getRolNombre(usuario.rol_id)}</td>
                    <td className="px-4 py-3 text-sm">
                      {usuario.empresas?.map(e => e.nombre).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {usuario.estado || 'activo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(usuario)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">No hay usuarios registrados</div>
          )}
        </div>
      </div>

      {/* Modal de creación/edición */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {usuarioEditando ? 'Editar Usuario' : 'Agregar Usuario'}
            </h2>
            
            {errorForm && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              
              {!usuarioEditando && (
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              )}
              
              <div className="mb-4">
                <label className="label">Rol</label>
                <select
                  value={formData.rol_id}
                  onChange={(e) => setFormData({...formData, rol_id: parseInt(e.target.value)})}
                  className="input"
                  required
                >
                  <option value={1}>Super Administrador</option>
                  <option value={2}>Gestión</option>
                  <option value={3}>Visualizador</option>
                </select>
              </div>
              
              {/* Selección múltiple de empresas */}
              <div className="mb-4">
                <label className="label">Empresas (puede seleccionar varias)</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {empresas.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        value={emp.id}
                        checked={formData.empresas_ids?.includes(emp.id) || false}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const current = formData.empresas_ids || [];
                          if (e.target.checked) {
                            setFormData({...formData, empresas_ids: [...current, value]});
                          } else {
                            setFormData({...formData, empresas_ids: current.filter(id => id !== value)});
                          }
                        }}
                        className="w-4 h-4 text-primary-500 rounded"
                      />
                      <span className="text-sm text-gray-700">{emp.nombre}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Seleccione las empresas a las que el usuario tendrá acceso
                </p>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoForm}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {cargandoForm ? 'Guardando...' : (usuarioEditando ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;