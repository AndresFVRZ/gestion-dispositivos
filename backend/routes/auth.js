const express = require('express');
const { 
    login, 
    verifyToken,
    forgotPassword,
    resetPassword,
    cambiarPassword,
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// RUTAS PÚBLICAS
// ==========================================
router.post('/login', login);
router.get('/verify', verificarToken, verifyToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================
// Cambiar contraseña (usuario autenticado puede cambiar su propia contraseña)
router.put('/password/:id', verificarToken, cambiarPassword);

// Rutas solo para super_admin
router.get('/usuarios', verificarToken, verificarRol(['super_admin']), getUsuarios);
router.get('/usuarios/:id', verificarToken, verificarRol(['super_admin']), getUsuarioById);
router.post('/usuarios', verificarToken, verificarRol(['super_admin']), crearUsuario);
router.put('/usuarios/:id', verificarToken, verificarRol(['super_admin']), actualizarUsuario);
router.delete('/usuarios/:id', verificarToken, verificarRol(['super_admin']), eliminarUsuario);

module.exports = router;