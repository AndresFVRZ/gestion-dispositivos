import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoAccesalud   from '../assets/Accesalud.png';
import logoEmtra       from '../assets/Emtra.png';
import logoEmtraSur    from '../assets/EmtraSur.png';
import logoInprosalud  from '../assets/InprosaludPlus.png';
import logoSertti      from '../assets/Sertti.png';
import logoSoluciones  from '../assets/solucionescorp.png';
import logoSimadrid    from '../assets/simadrid.png';

const TODOS_LOS_LOGOS = [
  { src: logoAccesalud,  nombre: 'Accesalud' },
  { src: logoEmtra,      nombre: 'EMTRA' },
  { src: logoEmtraSur,   nombre: 'EMTRASUR' },
  { src: logoInprosalud, nombre: 'Inprosalud Plus' },
  { src: logoSertti,     nombre: 'Sertti' },
  { src: logoSoluciones, nombre: 'SCI' },
  { src: logoSimadrid,   nombre: 'SI MADRID' },
];

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
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Generar suficientes logos para cubrir toda la pantalla
  const COLS = 8;
  const FILAS = 10;
  const totalCeldas = COLS * FILAS;
  const logosWallpaper = Array.from({ length: totalCeldas }, (_, i) => {
    const col = i % COLS;
    const fila = Math.floor(i / COLS);
    const esOscuro = (col + fila) % 2 === 0;
    const logo = TODOS_LOS_LOGOS[i % TODOS_LOS_LOGOS.length];
    return { ...logo, esOscuro, key: i };
  });

  return (
    <div className="login-page">
      {/* Fondo de logos en toda la página */}
      <div className="login-wallpaper">
        {logosWallpaper.map(({ src, nombre, esOscuro, key }) => (
          <div
            key={key}
            className="login-wallpaper-cell"
            style={{ background: esOscuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)' }}
          >
            <img src={src} alt={nombre} className="login-wallpaper-img" />
          </div>
        ))}
      </div>

      {/* Panel izquierdo - Branding */}
      <div className="login-brand">
        <div className="login-brand-inner">
          <img
            src="/favicon.png"
            alt="Logo"
            className="login-brand-logo-img"
            style={{ maxWidth: 480, maxHeight: 230, objectFit: 'contain', marginBottom: 24, display: 'block' }}
          />
          <h1 className="login-brand-title">Gestión de Equipos</h1>
          <p className="login-brand-sub">Sistema corporativo de inventario tecnológico</p>
          <div className="login-brand-features">
            <div className="login-feature">
              <span className="login-feature-dot" />
              Control total de dispositivos
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Gestión multiempresa
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Auditoría de cambios en tiempo real
            </div>
          </div>

        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Iniciar sesión</h2>
            <p className="login-card-sub">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-icon">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Correo electrónico</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@empresa.com"
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Contraseña</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="login-btn-loading">
                  <span className="login-spinner" />
                  Verificando...
                </span>
              ) : 'Ingresar al sistema'}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/forgot-password" className="login-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

const loginStyles = document.createElement('style');
loginStyles.textContent = `
  * { box-sizing: border-box; }

  .login-page {
    min-height: 100vh;
    display: flex;
  }

  /* ── Panel izquierdo ── */
  .login-brand {
    width: 45%;
    position: relative; z-index: 1;
    background: linear-gradient(160deg, rgba(10,31,68,0.88) 0%, rgba(15,43,92,0.88) 40%, rgba(26,61,124,0.88) 80%, rgba(30,77,153,0.88) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 48px;
    position: relative;
    overflow: hidden;
  }
  .login-brand::before {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    background: rgba(255,255,255,0.03);
    border-radius: 50%;
    top: -100px; right: -100px;
  }
  .login-brand::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    background: rgba(255,255,255,0.03);
    border-radius: 50%;
    bottom: -80px; left: -80px;
  }
  .login-brand-inner { position: relative; z-index: 1; max-width: 480px; }
  .login-brand-logo-img {
    max-width: 480px; max-height: 230px; object-fit: contain;
    margin-bottom: 24px;
  }
  /* Wallpaper de logos */
  .login-wallpaper {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .login-wallpaper-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    aspect-ratio: 1.6;
  }
  .login-wallpaper-img {
    width: 80%;
    max-height: 52px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }
  .login-brand-logo {
    width: 72px; height: 72px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 800; color: white;
    margin-bottom: 28px;
    box-shadow: 0 12px 32px rgba(37,99,235,0.4);
  }
  .login-brand-title {
    font-size: 30px; font-weight: 700; color: white;
    margin: 0 0 12px 0; line-height: 1.2;
  }
  .login-brand-sub {
    font-size: 15px; color: rgba(255,255,255,0.6);
    margin: 0 0 40px 0; line-height: 1.6;
  }
  .login-brand-features { display: flex; flex-direction: column; gap: 14px; }
  .login-feature {
    display: flex; align-items: center; gap: 12px;
    font-size: 14px; color: rgba(255,255,255,0.75);
  }
  .login-feature-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #3b82f6; flex-shrink: 0;
    box-shadow: 0 0 8px rgba(59,130,246,0.6);
  }

  /* ── Panel derecho ── */
  .login-form-panel {
    flex: 1;
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 48px 32px;
    background: #f8fafc;
  }
  .login-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    width: 100%; max-width: 420px;
    padding: 44px 40px;
    animation: loginSlide 0.4s ease;
  }
  @keyframes loginSlide {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .login-card-title {
    font-size: 26px; font-weight: 700; color: #0f172a;
    margin: 0 0 6px 0;
  }
  .login-card-sub {
    font-size: 14px; color: #64748b; margin: 0 0 32px 0;
  }

  /* Error */
  .login-error {
    display: flex; align-items: center; gap: 10px;
    background: #fef2f2; color: #dc2626;
    border: 1px solid #fecaca; border-radius: 10px;
    padding: 12px 16px; margin-bottom: 24px; font-size: 14px;
  }
  .login-error-icon {
    width: 20px; height: 20px; border-radius: 50%;
    background: #dc2626; color: white; font-weight: 700;
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* Form */
  .login-form { display: flex; flex-direction: column; gap: 20px; }
  .login-field { display: flex; flex-direction: column; gap: 6px; }
  .login-label { font-size: 13px; font-weight: 600; color: #374151; }
  .login-input {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; color: #0f172a; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fafafa;
  }
  .login-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    background: white;
  }
  .login-input::placeholder { color: #94a3b8; }

  /* Botón */
  .login-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #1a3d7c, #2563eb);
    color: white; border: none; border-radius: 10px;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 4px;
  }
  .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .login-btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .login-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Footer */
  .login-footer { text-align: center; margin-top: 24px; }
  .login-link { color: #2563eb; font-size: 14px; font-weight: 500; text-decoration: none; }
  .login-link:hover { text-decoration: underline; }

  /* Responsive */
  @media (max-width: 768px) {
    .login-brand { display: none; }
    .login-form-panel { padding: 32px 20px; background: linear-gradient(160deg,#0f2b5c,#1a3d7c); }
    .login-card { padding: 32px 24px; }
  }
`;
document.head.appendChild(loginStyles);