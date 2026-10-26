const rateLimit = require('express-rate-limit');

// Cada limitador lleva su propio contador por IP en una ventana de 15 minutos
const crearLimite = (max, message) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
});

// Inicio de sesión: frena ataques de fuerza bruta de contraseñas
const limiteLogin = crearLimite(10, 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.');

// Envío de correos de recuperación: evita spam a los buzones
const limiteCorreo = crearLimite(5, 'Demasiadas solicitudes de recuperación. Intenta de nuevo en 15 minutos.');

// Cambiar / restablecer contraseña y activar cuenta
const limitePassword = crearLimite(10, 'Demasiados intentos. Intenta de nuevo en 15 minutos.');

module.exports = { limiteLogin, limiteCorreo, limitePassword };
