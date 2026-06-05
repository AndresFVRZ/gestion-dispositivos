import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Login';
import Equipos from './pages/Equipos';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GestionDashboard from './pages/GestionDashboard';
import VisualizadorDashboard from './pages/VisualizadorDashboard';
import Historial from './pages/Historial';
import Usuarios from './pages/Usuarios';
import Papelera from './pages/Papelera';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivarCuenta from './pages/ActivarCuenta';
import Empresas from './pages/Empresas';
import Sedes from './pages/Sedes';
import Mantenimientos from './pages/Mantenimientos';
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando sistema...</p>
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
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/papelera" element={<Papelera />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/sedes" element={<Sedes />} />
          <Route path="/mantenimientos" element={<Mantenimientos />} />
        </Routes>
      </Layout>
    );
  }

  // GESTIÓN
  if (usuario.rol === 'gestion') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<GestionDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/sedes" element={<Sedes />} />
          <Route path="/mantenimientos" element={<Mantenimientos />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </Layout>
    );
  }

  // VISUALIZADOR
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<VisualizadorDashboard />} />
        <Route path="/equipos" element={<Equipos />} />
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
  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
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