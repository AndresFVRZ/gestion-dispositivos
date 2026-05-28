// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setMensaje(result.message || 'Revisa tu correo para restablecer tu contraseña');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">¿Olvidaste tu contraseña?</h1>
        <p className="text-gray-500 text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            required
          />
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/" className="text-primary-500 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;