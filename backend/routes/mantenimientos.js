const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento } = require('../controllers/mantenimientosController');

router.get('/',     verificarToken, getMantenimientos);
router.post('/',    verificarToken, verificarRol(['super_admin', 'gestion']), crearMantenimiento);
router.put('/:id',  verificarToken, verificarRol(['super_admin', 'gestion']), actualizarMantenimiento);
router.delete('/:id', verificarToken, verificarRol(['super_admin', 'gestion']), eliminarMantenimiento);

module.exports = router;
