const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getAuditoria } = require('../controllers/auditoriaController');

const router = express.Router();

router.get('/', verificarToken, verificarRol(['super_admin', 'administrador', 'logistica', 'soporte', 'gerencia']), getAuditoria);

module.exports = router;