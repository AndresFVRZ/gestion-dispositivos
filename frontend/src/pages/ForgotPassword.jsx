import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setMensaje(result.message || 'Revisa tu correo para restablecer tu contraseña');
        setEnviado(true);
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
          <p className="auth-brand-sub">Recupera el acceso a tu cuenta de forma segura</p>
          <div className="auth-brand-features">
            <div className="auth-feature"><span className="auth-feature-dot" />Te enviamos un enlace por email</div>
            <div className="auth-feature"><span className="auth-feature-dot" />El enlace expira en 1 hora</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Tu contraseña no cambia hasta confirmarlo</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          {enviado ? (
            <div className="auth-success-state">
              <div className="auth-success-icon">✓</div>
              <h2 className="auth-card-title">¡Correo enviado!</h2>
              <p className="auth-card-sub">Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.</p>
              <Link to="/" className="auth-back-btn">Volver al inicio</Link>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">¿Olvidaste tu contraseña?</h2>
                <p className="auth-card-sub">Ingresa tu correo y te enviaremos un enlace de recuperación</p>
              </div>

              {error && (
                <div className="auth-error">
                  <span className="auth-error-icon">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="usuario@empresa.com"
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={cargando}>
                  {cargando ? (
                    <span className="auth-btn-loading">
                      <span className="auth-spinner" />
                      Enviando...
                    </span>
                  ) : 'Enviar enlace de recuperación'}
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

export default ForgotPassword;

const fpStyles = document.createElement('style');
fpStyles.textContent = `
  .auth-page { min-height: 100vh; display: flex; }

  .auth-brand {
    width: 45%;
    background: linear-gradient(160deg, #0a1f44 0%, #0f2b5c 40%, #1a3d7c 80%, #1e4d99 100%);
    display: flex; align-items: center; justify-content: center;
    padding: 60px 48px; position: relative; overflow: hidden;
  }
  .auth-brand::before {
    content: ''; position: absolute; width: 400px; height: 400px;
    background: rgba(255,255,255,0.03); border-radius: 50%; top: -100px; right: -100px;
  }
  .auth-brand::after {
    content: ''; position: absolute; width: 300px; height: 300px;
    background: rgba(255,255,255,0.03); border-radius: 50%; bottom: -80px; left: -80px;
  }
  .auth-brand-inner { position: relative; z-index: 1; max-width: 420px; }
  .auth-brand-logo {
    width: 400px; height: 190px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 28px;
  }
  .auth-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
  .auth-brand-title { font-size: 30px; font-weight: 700; color: white; margin: 0 0 12px 0; line-height: 1.2; }
  .auth-brand-sub   { font-size: 15px; color: rgba(255,255,255,0.6); margin: 0 0 40px 0; line-height: 1.6; }
  .auth-brand-features { display: flex; flex-direction: column; gap: 14px; }
  .auth-feature { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.75); }
  .auth-feature-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; box-shadow: 0 0 8px rgba(59,130,246,0.6); }

  .auth-form-panel {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 48px 32px; background: #f8fafc;
  }
  .auth-card {
    background: white; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    width: 100%; max-width: 420px; padding: 44px 40px;
    animation: authSlide 0.4s ease;
  }
  @keyframes authSlide {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-card-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; }
  .auth-card-sub   { font-size: 14px; color: #64748b; margin: 0 0 28px 0; line-height: 1.5; }

  .auth-error {
    display: flex; align-items: center; gap: 10px;
    background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
    border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 14px;
  }
  .auth-error-icon {
    width: 20px; height: 20px; border-radius: 50%; background: #dc2626; color: white;
    font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .auth-form  { display: flex; flex-direction: column; gap: 20px; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-label { font-size: 13px; font-weight: 600; color: #374151; }
  .auth-input {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; color: #0f172a; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    background: #fafafa;
  }
  .auth-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: white; }
  .auth-input::placeholder { color: #94a3b8; }

  .auth-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #1a3d7c, #2563eb);
    color: white; border: none; border-radius: 10px;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .auth-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .auth-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
    border-top-color: white; border-radius: 50%; animation: authSpin 0.7s linear infinite;
  }
  @keyframes authSpin { to { transform: rotate(360deg); } }

  .auth-footer { text-align: center; margin-top: 24px; }
  .auth-link { color: #2563eb; font-size: 14px; font-weight: 500; text-decoration: none; }
  .auth-link:hover { text-decoration: underline; }

  /* Estado de éxito */
  .auth-success-state { text-align: center; padding: 8px 0; }
  .auth-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white; font-size: 28px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px auto; box-shadow: 0 8px 24px rgba(16,185,129,0.3);
  }
  .auth-back-btn {
    display: inline-block; margin-top: 24px; padding: 12px 28px;
    background: linear-gradient(135deg, #1a3d7c, #2563eb);
    color: white; border-radius: 10px; font-weight: 600; font-size: 14px;
    text-decoration: none; transition: opacity 0.2s;
  }
  .auth-back-btn:hover { opacity: 0.9; }

  @media (max-width: 768px) {
    .auth-brand { display: none; }
    .auth-form-panel { background: linear-gradient(160deg,#0f2b5c,#1a3d7c); padding: 32px 20px; }
    .auth-card { padding: 32px 24px; }
  }
`;
document.head.appendChild(fpStyles);
