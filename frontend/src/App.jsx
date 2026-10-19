import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Login';
import Equipos from './pages/Equipos';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdministradorDashboard from './pages/AdministradorDashboard';
import LogisticaDashboard from './pages/LogisticaDashboard';
import SoporteDashboard from './pages/SoporteDashboard';
import GerenciaDashboard from './pages/GerenciaDashboard';
import FinancieraDashboard from './pages/FinancieraDashboard';
import Auditoria from './pages/Auditoria';
import Usuarios from './pages/Usuarios';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivarCuenta from './pages/ActivarCuenta';
import Empresas from './pages/Empresas';
import Mantenimientos from './pages/Mantenimientos';
import Stock from './pages/Stock';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px', borderRadius: '10px', fontWeight: '500' },
            success: { style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' } },
            error:   { style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activar" element={<ActivarCuenta />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="splash-screen">
        <div className="splash-card">
          <div
            className="splash-logo"
            style={{
              width: 720, height: 440, maxWidth: '92vw',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 className="splash-title">Gestión de Equipos</h1>
          <p className="splash-sub">Sistema Corporativo</p>
          <div className="splash-bar-track">
            <div className="splash-bar-fill" />
          </div>
          <p className="splash-status">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  const Layout = ({ children }) => (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );

  // SUPER ADMIN
  if (usuario.rol === 'super_admin') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/super-admin" />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/mantenimientos" element={<Mantenimientos />} />
        </Routes>
      </Layout>
    );
  }

  // ADMINISTRADOR — usuarios + inventario, sin mantenimientos
  if (usuario.rol === 'administrador') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<AdministradorDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/auditoria" element={<Auditoria />} />
        </Routes>
      </Layout>
    );
  }

  // LOGÍSTICA — inventario, sin mantenimientos
  if (usuario.rol === 'logistica') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<LogisticaDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/auditoria" element={<Auditoria />} />
        </Routes>
      </Layout>
    );
  }

  // SOPORTE — mantenimientos + asignación de proceso y persona
  if (usuario.rol === 'soporte') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<SoporteDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/mantenimientos" element={<Mantenimientos />} />
          <Route path="/auditoria" element={<Auditoria />} />
        </Routes>
      </Layout>
    );
  }

  // GERENCIA — exclusivo Baja y Canibalizar
  if (usuario.rol === 'gerencia') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<GerenciaDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/auditoria" element={<Auditoria />} />
        </Routes>
      </Layout>
    );
  }

  // FINANCIERA — solo lectura con vista financiera
  if (usuario.rol === 'financiera') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<FinancieraDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/stock" element={<Stock />} />
        </Routes>
      </Layout>
    );
  }

  // Fallback — financiera por defecto
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<FinancieraDashboard />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/stock" element={<Stock />} />
      </Routes>
    </Layout>
  );
}

export default App;

// ============================================
// ESTILOS DEL COMPONENTE
// ============================================
const appStyles = document.createElement('style');
appStyles.textContent = `
  /* ── Splash screen ── */
  .splash-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f2b5c 0%, #1a3d7c 60%, #1e4fa0 100%);
  }

  .splash-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: splash-in 0.5s ease;
  }

  @keyframes splash-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .splash-logo {
    width: 560px; height: 280px;
    max-width: 90vw;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .splash-logo img { width: 100%; height: 100%; object-fit: contain; }

  .splash-title {
    font-size: 24px; font-weight: 700; color: white; margin: 0;
    letter-spacing: -0.3px;
  }

  .splash-sub {
    font-size: 13px; color: rgba(255,255,255,0.55); margin: 0;
    text-transform: uppercase; letter-spacing: 1.5px;
  }

  .splash-bar-track {
    width: 200px; height: 3px;
    background: rgba(255,255,255,0.15);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 24px;
  }

  .splash-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4299e1, #60a5fa);
    border-radius: 99px;
    animation: splash-bar 1.6s ease-in-out infinite;
  }

  @keyframes splash-bar {
    0%   { width: 0%;   margin-left: 0; }
    50%  { width: 70%;  margin-left: 0; }
    100% { width: 0%;   margin-left: 100%; }
  }

  .splash-status {
    font-size: 12px; color: rgba(255,255,255,0.45); margin: 4px 0 0;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .app-layout {
    display: flex;
    min-height: 100vh;
  }

  .app-main {
    flex: 1;
    margin-left: var(--sidebar-w, 260px);
    padding: 24px;
    background: #f1f5f9;
    min-height: 100vh;
    transition: margin-left 0.25s ease;
  }

  @media (max-width: 768px) {
    .app-main {
      margin-left: 0 !important;
      padding: 16px;
      padding-top: 60px;
    }
  }
`;
document.head.appendChild(appStyles);