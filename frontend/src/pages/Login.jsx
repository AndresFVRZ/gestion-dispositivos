import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/equipos');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">GE</div>
          <h1 className="login-title">Gestión de Equipos</h1>
          <p className="login-subtitle">Acceso unificado para todas las empresas</p>
        </div>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@empresa.com"
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="**********"
              />
            </div>
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        
        <div className="login-footer">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

// ============================================
// ESTILOS PROFESIONALES DEL COMPONENTE
// ============================================
const loginStyles = document.createElement('style');
loginStyles.textContent = `
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f2b5c 0%, #1a3d7c 50%, #2c5aa6 100%);
    padding: 20px;
  }

  .login-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 440px;
    padding: 40px;
    animation: fadeIn 0.5s ease;
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-logo {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #0f2b5c, #1a3d7c);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px auto;
    font-size: 28px;
    font-weight: 700;
    color: white;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .login-title {
    font-size: 24px;
    font-weight: 700;
    color: #1a2c3e;
    margin-bottom: 8px;
  }

  .login-subtitle {
    color: #718096;
    font-size: 14px;
  }

  .login-error {
    background: #fed7d7;
    color: #742a2a;
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 20px;
    border-left: 4px solid #dc2626;
    font-size: 14px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-label {
    font-size: 14px;
    font-weight: 600;
    color: #2d3748;
  }

  .input-wrapper {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    opacity: 0.6;
  }

  .input-field {
    width: 100%;
    padding: 12px 16px 12px 42px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.2s;
    outline: none;
  }

  .input-field:focus {
    border-color: #1a3d7c;
    box-shadow: 0 0 0 3px rgba(26, 61, 124, 0.1);
  }

  .login-btn {
    background: #1a3d7c;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
    margin-top: 8px;
  }

  .login-btn:hover {
    background: #0f2b5c;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .login-footer {
    text-align: center;
    margin-top: 24px;
  }

  .login-footer a {
    color: #1a3d7c;
    font-size: 14px;
    text-decoration: none;
    font-weight: 500;
  }

  .login-footer a:hover {
    text-decoration: underline;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(loginStyles);