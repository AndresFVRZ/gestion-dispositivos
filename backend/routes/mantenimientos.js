const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const {
  getMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento,
  completarMantenimiento, aprobarMantenimiento, rechazarMantenimiento
} = require('../controllers/mantenimientosController');

router.get('/',                  verificarToken, getMantenimientos);
router.post('/',                 verificarToken, verificarRol(['super_admin', 'soporte']), crearMantenimiento);
router.put('/:id',               verificarToken, verificarRol(['super_admin', 'soporte']), actualizarMantenimiento);
router.delete('/:id',            verificarToken, verificarRol(['super_admin', 'soporte']), eliminarMantenimiento);
router.post('/:id/completar',    verificarToken, verificarRol(['super_admin', 'soporte']), completarMantenimiento);
router.post('/:id/aprobar',      verificarToken, verificarRol(['super_admin', 'soporte']), aprobarMantenimiento);
router.post('/:id/rechazar',     verificarToken, verificarRol(['super_admin', 'soporte']), rechazarMantenimiento);

module.exports = router;
