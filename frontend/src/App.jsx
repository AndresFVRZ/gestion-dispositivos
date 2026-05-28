import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Login';
import Equipos from './pages/Equipos';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Historial from './pages/Historial';
import Usuarios from './pages/Usuarios';
import Papelera from './pages/Papelera';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div className="app-loading">Cargando...</div>;
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

  if (usuario.rol === 'super_admin') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/super-admin" />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/papelera" element={<Papelera />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/equipos" />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/historial" element={<Historial />} />
      </Routes>
    </Layout>
  );
}

export default App;