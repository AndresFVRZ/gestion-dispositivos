const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getPlacas, crearPlaca, actualizarPlaca, eliminarPlaca } = require('../controllers/placasController');

router.get('/',       verificarToken, getPlacas);
router.post('/',      verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), crearPlaca);
router.put('/:id',    verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), actualizarPlaca);
router.delete('/:id', verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), eliminarPlaca);

module.exports = router;
