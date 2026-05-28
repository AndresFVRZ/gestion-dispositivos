import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Common/Input';
import Boton from '../components/Common/Boton';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      const usuario = result.usuario;
      if (usuario.rol === 'super_admin') {
        window.location.href = '/super-admin';
      } else {
        window.location.href = '/equipos';
      }
    } else {
      setError(result.message || 'Credenciales inválidas');
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Gestión de Equipos</h1>
          <p className="text-gray-500 mt-2">Acceso unificado para todas las empresas</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.com"
            required
          />
          
          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />

          <Boton type="submit" variant="primary" disabled={cargando} className="w-full">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </Boton>
        </form>

        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;