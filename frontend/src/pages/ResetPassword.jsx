// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. Solicita un nuevo restablecimiento.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setMensaje(result.message);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Enlace inválido</h1>
          <p style={styles.errorText}>{error}</p>
          <a href="/forgot-password" style={styles.link}>
            Solicitar nuevo enlace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Restablecer contraseña</h1>
        <p style={styles.subtitle}>Ingresa tu nueva contraseña</p>

        {mensaje && <div style={styles.mensajeExito}>{mensaje}</div>}
        {error && <div style={styles.mensajeError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            style={styles.input}
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar contraseña"
            style={styles.input}
            required
          />
          <button
            type="submit"
            disabled={cargando}
            style={cargando ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {cargando ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div style={styles.linkContainer}>
          <a href="/" style={styles.link}>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ESTILOS
// ==========================================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: '8px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '24px',
    fontSize: '14px',
  },
  mensajeExito: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  mensajeError: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  errorText: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '20px',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    backgroundColor: '#1e40af',
    color: 'white',
    fontWeight: '500',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  linkContainer: {
    textAlign: 'center',
    marginTop: '20px',
  },
  link: {
    color: '#1e40af',
    textDecoration: 'none',
    fontSize: '14px',
  },
};

// ==========================================
// 4. EXPORTACIÓN
// ==========================================
export default ResetPassword;