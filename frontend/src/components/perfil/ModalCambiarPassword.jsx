import React, { useState } from 'react';
import { cambiarPassword } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const ModalCambiarPassword = ({ isOpen, onClose }) => {
  const { usuario } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    try {
      const result = await cambiarPassword(usuario.id, currentPassword, newPassword);
      if (result.success) {
        setSuccess('Contraseña actualizada correctamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(result.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-password" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cambiar Contraseña</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese su contraseña actual"
                required
              />
            </div>

            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={cargando}>
              {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCambiarPassword;

// ============================================
// ESTILOS DEL COMPONENTE
// ============================================
const modalStyles = document.createElement('style');
modalStyles.textContent = `
  .modal-password {
    max-width: 420px;
  }

  .modal-error {
    background: #fef2f2;
    color: #dc2626;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    margin: 0 20px 16px 20px;
    border-left: 3px solid #dc2626;
  }

  .modal-success {
    background: #dcfce7;
    color: #166534;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    margin: 0 20px 16px 20px;
    border-left: 3px solid #10b981;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 0;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: white;
    transition: all 0.2s;
  }

  .form-group input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }

  .form-group input::placeholder {
    color: #94a3b8;
    font-size: 13px;
  }
`;
document.head.appendChild(modalStyles);