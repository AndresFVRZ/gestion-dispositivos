const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getSedes, crearSede, actualizarSede, eliminarSede } = require('../controllers/sedesController');

router.get('/',     verificarToken, getSedes);
router.post('/',    verificarToken, verificarRol(['super_admin', 'gestion']), crearSede);
router.put('/:id',  verificarToken, verificarRol(['super_admin', 'gestion']), actualizarSede);
router.delete('/:id', verificarToken, verificarRol(['super_admin']), eliminarSede);

module.exports = router;
