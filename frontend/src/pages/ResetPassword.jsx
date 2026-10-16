import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita un nuevo restablecimiento.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6)          { setError('La contraseña debe tener al menos 6 caracteres'); return; }

    setCargando(true);
    setError('');

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setMensaje(result.message);
        setExitoso(true);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(result.message || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div
              className="auth-brand-logo"
              style={{ width: 400, height: 190, maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}
            >
              <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 className="auth-brand-title">Gestión de Equipos</h1>
            <p className="auth-brand-sub">Sistema corporativo de inventario tecnológico</p>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-success-state">
              <div className="auth-error-icon-big">!</div>
              <h2 className="auth-card-title" style={{ marginTop: 16 }}>Enlace inválido</h2>
              <p className="auth-card-sub">Este enlace no es válido o ya fue utilizado. Solicita uno nuevo.</p>
              <Link to="/forgot-password" className="auth-back-btn">Solicitar nuevo enlace</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div
            className="auth-brand-logo"
            style={{ width: 400, height: 190, maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}
          >
            <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 className="auth-brand-title">Gestión de Equipos</h1>
          <p className="auth-brand-sub">Establece una nueva contraseña segura para tu cuenta</p>
          <div className="auth-brand-features">
            <div className="auth-feature"><span className="auth-feature-dot" />Mínimo 6 caracteres</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Usa letras, números y símbolos</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Serás redirigido al iniciar sesión</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          {exitoso ? (
            <div className="auth-success-state">
              <div className="auth-success-icon">✓</div>
              <h2 className="auth-card-title">¡Contraseña actualizada!</h2>
              <p className="auth-card-sub">{mensaje}</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Redirigiendo en 3 segundos...</p>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">Restablecer contraseña</h2>
                <p className="auth-card-sub">Ingresa y confirma tu nueva contraseña</p>
              </div>

              {error && (
                <div className="auth-error">
                  <span className="auth-error-icon">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Nueva contraseña</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirmar contraseña</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={cargando}>
                  {cargando ? (
                    <span className="auth-btn-loading">
                      <span className="auth-spinner" />
                      Restableciendo...
                    </span>
                  ) : 'Restablecer contraseña'}
                </button>
              </form>

              <div className="auth-footer">
                <Link to="/" className="auth-link">← Volver al inicio de sesión</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

const rpStyles = document.createElement('style');
rpStyles.textContent = `
  .auth-error-icon-big {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white; font-size: 32px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto; box-shadow: 0 8px 24px rgba(245,158,11,0.3);
  }
`;
document.head.appendChild(rpStyles);
