// ============================================
// LÓGICA DEL COMPONENTE (ARRIBA)
// ============================================

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, reenviarInvitacion } from '../services/usuariosService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/Common/ConfirmModal';

function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  const [confirm, setConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'financiera',
    empresas_ids: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [usuariosRes, empresasRes] = await Promise.all([getUsuarios(), getEmpresas()]);

      let listaUsuarios = [];
      if (Array.isArray(usuariosRes)) listaUsuarios = usuariosRes;
      else if (Array.isArray(usuariosRes?.data)) listaUsuarios = usuariosRes.data;
      setUsuarios(listaUsuarios);

      if (empresasRes?.data) {
        setEmpresas(Array.isArray(empresasRes.data) ? empresasRes.data : empresasRes.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'financiera',
      empresas_ids: []
    });
    setSelectedUsuario(null);
    setShowModal(true);
  };

  const handleEdit = (usuario) => {
    setModalMode('edit');
    setSelectedUsuario(usuario);
    setFormData({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol: usuario.rol || 'financiera',
      empresas_ids: usuario.empresas_ids || []
    });
    setShowModal(true);
  };

  const handleReenviar = async (id) => {
    try {
      const result = await reenviarInvitacion(id);
      if (result?.success) toast.success('Invitación reenviada correctamente');
      else toast.error(result?.message || 'Error al reenviar');
    } catch { toast.error('Error de conexión'); }
  };

  const handleDelete = (id) => {
    const u = usuarios.find(x => x.id === id);
    setConfirm({
      titulo: 'Eliminar usuario',
      mensaje: `¿Desactivar a "${u?.nombre || 'este usuario'}"? Ya no podrá iniciar sesión.`,
      variante: 'danger',
      textConfirmar: 'Eliminar',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const result = await eliminarUsuario(id);
          if (result?.success) { toast.success('Usuario eliminado'); cargarDatos(); }
          else toast.error(result?.message || 'Error al eliminar usuario');
        } catch { toast.error('Error al eliminar usuario'); }
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email) {
      toast.error('Nombre y email son obligatorios'); return;
    }
    if (modalMode === 'edit' && formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return;
    }
    if (formData.rol !== 'super_admin' && formData.empresas_ids.length === 0) {
      toast.error('Debe seleccionar al menos una empresa'); return;
    }
    
    try {
      const result = modalMode === 'create'
        ? await crearUsuario(formData)
        : await actualizarUsuario(selectedUsuario.id, formData);

      if (result && result.success) {
        setShowModal(false);
        setFormData({ nombre: '', email: '', password: '', rol: 'financiera', empresas_ids: [] });
        toast.success(modalMode === 'create' ? 'Usuario creado exitosamente' : 'Usuario actualizado');
        await cargarDatos();
      } else {
        toast.error(result?.message || 'Error al guardar usuario');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar usuario');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmpresaChange = (e) => {
    const value = parseInt(e.target.value);
    const checked = e.target.checked;
    let nuevasEmpresas = [...formData.empresas_ids];

    if (checked) {
      if (formData.rol === 'financiera') {
        nuevasEmpresas = [value]; // financiera: solo una empresa
      } else {
        nuevasEmpresas.push(value);
      }
    } else {
      nuevasEmpresas = nuevasEmpresas.filter(id => id !== value);
    }
    setFormData({ ...formData, empresas_ids: nuevasEmpresas });
  };

  const getRolTexto = (rol) => ({
    super_admin:   'Super Administrador',
    administrador: 'Administrador',
    logistica:     'Logística',
    soporte:       'Soporte',
    gerencia:      'Gerencia',
    financiera:    'Financiera',
  }[rol] || 'Usuario');

  const getRolColor = (rol) => ({
    super_admin:   'rol-super-admin',
    administrador: 'rol-administrador',
    logistica:     'rol-logistica',
    soporte:       'rol-soporte',
    gerencia:      'rol-gerencia',
    financiera:    'rol-financiera',
  }[rol] || 'rol-default');

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) {
    return <div className="usuarios-loading">Cargando usuarios...</div>;
  }

  return (
    <div className="usuarios-container">
      <ConfirmModal
        open={confirm !== null}
        titulo={confirm?.titulo}
        mensaje={confirm?.mensaje}
        variante={confirm?.variante}
        textConfirmar={confirm?.textConfirmar}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
      <div className="usuarios-header">
        <h1 className="usuarios-title">Usuarios</h1>
        <div className="usuarios-actions">
          <button className="btn-primary" onClick={handleCreate}>Agregar usuario</button>
        </div>
      </div>

      <div className="usuarios-filter">
        <input
          type="text"
          className="filter-input"
          placeholder="Buscar por nombre o email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="usuarios-table-wrapper">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Empresas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="usuarios-empty">No hay usuarios registrados</td>
              </tr>
            ) : (
              usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td className="usuario-nombre">{usuario.nombre || '-'}</td>
                  <td className="usuario-email">{usuario.email || '-'}</td>
                  <td><span className={`rol-badge ${getRolColor(usuario.rol)}`}>{getRolTexto(usuario.rol)}</span></td>
                  <td className="usuario-empresas">
                    {usuario.empresas?.length > 0
                      ? usuario.empresas.map(e => e.nombre).join(', ')
                      : '-'}
                  </td>
                  <td>
                    {usuario.estado === 'pendiente'
                      ? <span className="estado-badge estado-pendiente">Pendiente</span>
                      : <span className="estado-badge estado-activo">Activo</span>}
                  </td>
                  <td className="acciones-cell">
                    {usuario.estado === 'pendiente' && (
                      <button className="btn-reenviar" onClick={() => handleReenviar(usuario.id)}>Reenviar</button>
                    )}
                    <button className="btn-edit" onClick={() => handleEdit(usuario)}>Editar</button>
                    {usuario.id !== usuarioActual?.id && (
                      <button className="btn-delete" onClick={() => handleDelete(usuario.id)}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL AGREGAR/EDITAR USUARIO */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Agregar Usuario' : 'Editar Usuario'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  {modalMode === 'edit' && (
                    <div className="form-group">
                      <label>Nueva contraseña</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Dejar vacío para no cambiar" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Rol *</label>
                    <select name="rol" value={formData.rol} onChange={handleInputChange} required>
                      <option value="financiera">Financiera</option>
                      <option value="soporte">Soporte</option>
                      <option value="logistica">Logística</option>
                      <option value="gerencia">Gerencia</option>
                      <option value="administrador">Administrador</option>
                      <option value="super_admin">Super Administrador</option>
                    </select>
                  </div>
                </div>
                {modalMode === 'create' && (
                  <div className="info-message" style={{ marginBottom: '8px' }}>
                    Se enviará un correo de invitación al usuario para que cree su propia contraseña.
                  </div>
                )}
                
                {formData.rol !== 'super_admin' && (
                  <div className="form-group">
                    <label>
                      Empresa{formData.rol === 'financiera' ? '' : 's'} Asignada{formData.rol === 'financiera' ? '' : 's'}
                      {formData.rol === 'financiera' && <span style={{fontSize:'11px',color:'#92400e',fontWeight:'400',marginLeft:'8px'}}>(máximo 1)</span>}
                    </label>
                    <div className="empresas-checkbox-group">
                      {empresas.length === 0 ? (
                        <p className="no-empresas">No hay empresas disponibles</p>
                      ) : (
                        empresas.map(empresa => (
                          <label key={empresa.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              value={empresa.id}
                              checked={formData.empresas_ids.includes(empresa.id)}
                              onChange={handleEmpresaChange}
                            />
                            <span className="checkbox-text">{empresa.nombre}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {formData.rol !== 'super_admin' && formData.empresas_ids.length === 0 && (
                      <small className="warning-text">Debe asignar al menos una empresa</small>
                    )}
                  </div>
                )}
                
                {formData.rol === 'super_admin' && (
                  <div className="info-message">
                    Los usuarios Super Administrador tienen acceso a todas las empresas
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">
                  {modalMode === 'create' ? 'Crear y enviar invitación' : 'Guardar cambios'}
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

// ============================================
// ESTILOS DEL COMPONENTE (AL FINAL)
// ============================================

const usuariosStyles = document.createElement('style');
usuariosStyles.textContent = `
  .usuarios-container {
    padding: 24px;
    background: #f1f5f9;
    min-height: 100vh;
  }

  .usuarios-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .usuarios-title {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .usuarios-actions {
    display: flex;
    gap: 12px;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-cancel {
    background: #f1f5f9;
    color: #475569;
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-save {
    background: #2563eb;
    color: white;
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }

  .usuarios-filter {
    margin-bottom: 20px;
  }

  .filter-input {
    width: 100%;
    max-width: 320px;
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

  .usuarios-table-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow-x: auto;
  }

  .usuarios-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }

  .usuarios-table th {
    padding: 14px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .usuarios-table td {
    padding: 14px 16px;
    font-size: 14px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }

  .usuarios-table tbody tr:hover {
    background: #f8fafc;
  }

  .usuario-nombre {
    font-weight: 500;
    color: #0f172a;
  }

  .usuario-email {
    color: #475569;
  }

  .usuario-empresas {
    font-size: 13px;
    color: #64748b;
  }

  .rol-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  .rol-super-admin   { background: #fef3c7; color: #d97706; }
  .rol-administrador { background: #ede9fe; color: #6d28d9; }
  .rol-logistica     { background: #d1fae5; color: #065f46; }
  .rol-soporte       { background: #ffedd5; color: #c2410c; }
  .rol-gerencia      { background: #1e293b; color: #e2e8f0; }
  .rol-financiera    { background: #ecfeff; color: #0e7490; }
  .rol-default       { background: #e2e8f0; color: #475569; }

  .acciones-cell {
    white-space: nowrap;
  }

  .estado-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .estado-activo { background: #f0fdf4; color: #15803d; }
  .estado-pendiente { background: #fffbeb; color: #b45309; }

  .btn-reenviar {
    padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer;
    font-size: 12px; font-weight: 500; margin-right: 6px;
    background: #fffbeb; color: #b45309;
  }
  .btn-reenviar:hover { background: #fef3c7; }

  .btn-edit, .btn-delete {
    padding: 5px 10px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    margin-right: 6px;
  }

  .btn-edit {
    background: #eff6ff;
    color: #2563eb;
  }

  .btn-edit:hover {
    background: #dbeafe;
  }

  .btn-delete {
    background: #fef2f2;
    color: #dc2626;
  }

  .btn-delete:hover {
    background: #fee2e2;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-large {
    max-width: 700px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #94a3b8;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 0;
  }

  .form-group {
    flex: 1;
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #334155;
    margin-bottom: 6px;
  }

  .form-group label:after {
    content: " *";
    color: #dc2626;
  }

  .form-group input, .form-group select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
  }

  .form-group input:focus, .form-group select:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
  }

  .empresas-checkbox-group {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
    max-height: 200px;
    overflow-y: auto;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    margin-top: 4px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid #e2e8f0;
  }

  .checkbox-label:hover {
    background: #eff6ff;
    border-color: #2563eb;
  }

  .checkbox-label input {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #2563eb;
    margin: 0;
  }

  .checkbox-text {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
  }

  .no-empresas {
    text-align: center;
    padding: 20px;
    color: #94a3b8;
    font-size: 13px;
  }

  .warning-text {
    display: block;
    margin-top: 8px;
    font-size: 11px;
    color: #dc2626;
    background: #fef2f2;
    padding: 6px 10px;
    border-radius: 6px;
  }

  .info-message {
    background: #e0e7ff;
    color: #4338ca;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
    text-align: center;
    margin-top: 16px;
  }

  .usuarios-loading, .usuarios-empty {
    text-align: center;
    padding: 48px;
    color: #64748b;
  }

  @media (max-width: 768px) {
    .usuarios-container {
      padding: 16px;
    }
    
    .usuarios-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .usuarios-actions {
      justify-content: stretch;
    }
    
    .filter-input {
      max-width: 100%;
    }
    
    .form-row {
      flex-direction: column;
      gap: 0;
    }
    
    .empresas-checkbox-group {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(usuariosStyles);