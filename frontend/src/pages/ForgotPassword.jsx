// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';
import { Link } from 'react-router-dom';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setMensaje(result.message || 'Revisa tu correo para restablecer tu contraseña');
        setEmail('');
      } else {
        setError(result.message || 'Error al enviar la solicitud');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>¿Olvidaste tu contraseña?</h1>
        <p style={styles.subtitle}>
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        {mensaje && <div style={styles.mensajeExito}>{mensaje}</div>}
        {error && <div style={styles.mensajeError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={styles.input}
            required
          />
          <button
            type="submit"
            disabled={cargando}
            style={cargando ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div style={styles.linkContainer}>
          <Link to="/" style={styles.link}>
            Volver al inicio
          </Link>
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
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    outline: 'none',
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
export default ForgotPassword;