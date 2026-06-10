const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const {
  getMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento,
  completarMantenimiento, aprobarMantenimiento, rechazarMantenimiento
} = require('../controllers/mantenimientosController');

router.get('/',                  verificarToken, getMantenimientos);
router.post('/',                 verificarToken, verificarRol(['super_admin', 'gestion']), crearMantenimiento);
router.put('/:id',               verificarToken, verificarRol(['super_admin', 'gestion']), actualizarMantenimiento);
router.delete('/:id',            verificarToken, verificarRol(['super_admin', 'gestion']), eliminarMantenimiento);
router.post('/:id/completar',    verificarToken, verificarRol(['super_admin', 'gestion']), completarMantenimiento);
router.post('/:id/aprobar',      verificarToken, verificarRol(['super_admin', 'gestion']), aprobarMantenimiento);
router.post('/:id/rechazar',     verificarToken, verificarRol(['super_admin', 'gestion']), rechazarMantenimiento);

module.exports = router;
