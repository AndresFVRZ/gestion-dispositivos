const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getSedes, crearSede, actualizarSede, eliminarSede } = require('../controllers/sedesController');

router.get('/',     verificarToken, getSedes);
router.post('/',    verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), crearSede);
router.put('/:id',  verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), actualizarSede);
router.delete('/:id', verificarToken, verificarRol(['super_admin']), eliminarSede);

module.exports = router;
