// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. Solicita un nuevo restablecimiento.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setMensaje(result.message);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Enlace inválido</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <a href="/forgot-password" className="text-primary-500 hover:underline">
            Solicitar nuevo enlace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Restablecer contraseña</h1>
        <p className="text-gray-500 text-center mb-6">Ingresa tu nueva contraseña</p>

        {mensaje && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar contraseña"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            required
          />
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {cargando ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/" className="text-primary-500 hover:underline">Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;