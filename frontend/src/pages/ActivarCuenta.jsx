import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import logoAccesalud   from '../assets/Accesalud.png';
import logoEmtra       from '../assets/Emtra.png';
import logoEmtraSur    from '../assets/EmtraSur.png';
import logoInprosalud  from '../assets/InprosaludPlus.png';
import logoSertti      from '../assets/Sertti.png';
import logoSoluciones  from '../assets/solucionescorp.png';
import logoSimadrid    from '../assets/simadrid.png';

const TODOS_LOGOS = [
  { src: logoAccesalud,  nombre: 'Accesalud' },
  { src: logoEmtra,      nombre: 'EMTRA' },
  { src: logoEmtraSur,   nombre: 'EmtraSur' },
  { src: logoInprosalud, nombre: 'Inprosalud Plus' },
  { src: logoSertti,     nombre: 'Sertti' },
  { src: logoSoluciones, nombre: 'Soluciones Corp' },
  { src: logoSimadrid,   nombre: 'Simadrid' },
];

function ActivarCuenta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const COLS_W = 7, FILAS_W = 8;
  const wallpaper = Array.from({ length: COLS_W * FILAS_W }, (_, i) => {
    const col = i % COLS_W, fila = Math.floor(i / COLS_W);
    return { ...TODOS_LOGOS[i % TODOS_LOGOS.length], esOscuro: (col + fila) % 2 === 0, key: i };
  });

  const [estado, setEstado] = useState('verificando'); // verificando | listo | expirado | activado
  const [usuario, setUsuario] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) { setEstado('expirado'); return; }
    api.get(`/auth/activar/${token}`)
      .then(res => { setUsuario(res.data.data); setEstado('listo'); })
      .catch(() => setEstado('expirado'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }

    setCargando(true);
    try {
      await api.post('/auth/activar', { token, password });
      setEstado('activado');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al activar la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Wallpaper logos */}
      <div style={s.wallpaper}>
        {wallpaper.map(({ src, nombre, esOscuro, key }) => (
          <div key={key} style={{
            ...s.wCell,
            background: esOscuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)',
          }}>
            <img src={src} alt={nombre} style={s.wImg} />
          </div>
        ))}
      </div>

      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.headerTitle}>Sistema de Gestión de Equipos</h1>
          <p style={s.headerSub}>Inventario tecnológico corporativo</p>
        </div>

        <div style={s.body}>
          {/* Verificando */}
          {estado === 'verificando' && (
            <div style={s.center}>
              <div style={s.spinner} />
              <p style={s.texto}>Verificando enlace...</p>
            </div>
          )}

          {/* Enlace expirado o inválido */}
          {estado === 'expirado' && (
            <div style={s.center}>
              <div style={{ ...s.iconCircle, background: '#fef2f2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" width="32" height="32">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={s.titulo}>Enlace inválido o expirado</h2>
              <p style={s.texto}>Este enlace de activación ya no es válido.<br/>Contacta al administrador para recibir uno nuevo.</p>
            </div>
          )}

          {/* Formulario de activación */}
          {estado === 'listo' && (
            <>
              <div style={s.bienvenida}>
                <h2 style={s.titulo}>Hola, <strong>{usuario?.nombre}</strong></h2>
                <p style={s.texto}>Crea tu contraseña para activar tu cuenta en el sistema EMTRA.</p>
              </div>

              <form onSubmit={handleSubmit} style={s.form}>
                <div style={s.campo}>
                  <label style={s.label}>Nueva contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.campo}>
                  <label style={s.label}>Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repite tu contraseña"
                    style={s.input}
                    required
                  />
                </div>

                {error && <p style={s.error}>{error}</p>}

                <button type="submit" disabled={cargando} style={s.btn}>
                  {cargando ? 'Activando...' : 'Activar mi cuenta'}
                </button>
              </form>
            </>
          )}

          {/* Cuenta activada */}
          {estado === 'activado' && (
            <div style={s.center}>
              <div style={{ ...s.iconCircle, background: '#f0fdf4' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" width="32" height="32">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 style={s.titulo}>¡Cuenta activada!</h2>
              <p style={s.texto}>Tu contraseña fue creada correctamente.<br/>Ya puedes iniciar sesión.</p>
              <button onClick={() => navigate('/login')} style={s.btn}>
                Ir al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f2b5c 0%, #1a3d7c 60%, #2563eb 100%)',
    padding: '16px', position: 'relative',
  },
  wallpaper: {
    position: 'fixed', inset: 0, display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
  },
  wCell: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
  },
  wImg: {
    width: '80%', maxHeight: '44px', objectFit: 'contain',
    filter: 'brightness(0) invert(1)', opacity: 0.85,
  },
  card: {
    background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px',
    overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    position: 'relative', zIndex: 1,
  },
  header: {
    background: 'linear-gradient(135deg, #0f2b5c, #2563eb)',
    padding: '24px 20px', textAlign: 'center',
  },
  headerTitle: { color: 'white', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 },
  body: { padding: '32px 28px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' },
  iconCircle: {
    width: '68px', height: '68px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
  },
  bienvenida: { marginBottom: '24px' },
  titulo: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' },
  texto: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#334155' },
  input: {
    padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '14px', outline: 'none', transition: 'border 0.15s',
  },
  error: {
    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: '8px', padding: '10px 12px', fontSize: '13px', margin: 0,
  },
  btn: {
    background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px',
    padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    marginTop: '4px', width: '100%',
  },
  spinner: {
    width: '40px', height: '40px', border: '4px solid #e2e8f0',
    borderTopColor: '#2563eb', borderRadius: '50%', animation: 'activarSpin 0.8s linear infinite',
  },
};

const st = document.createElement('style');
st.textContent = `@keyframes activarSpin { to { transform: rotate(360deg); } }`;
document.head.appendChild(st);

export default ActivarCuenta;
