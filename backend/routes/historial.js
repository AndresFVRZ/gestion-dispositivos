const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getHistorial } = require('../controllers/historialController');

const router = express.Router();

router.get('/', verificarToken, verificarRol(['super_admin', 'gestion']), getHistorial);

module.exports = router;