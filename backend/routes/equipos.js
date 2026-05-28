const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const { 
    getEquipos, 
    getEquiposByEmpresa,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    restaurarEquipo,
    eliminarPermanente,
    getPapelera
} = require('../controllers/equiposController');

const router = express.Router();

router.get('/', verificarToken, verificarRol(['super_admin', 'gestion', 'visualizador']), getEquipos);
router.get('/empresa/:empresaId', verificarToken, getEquiposByEmpresa);
router.get('/papelera', verificarToken, verificarRol(['super_admin']), getPapelera);
router.post('/', verificarToken, verificarRol(['super_admin', 'gestion']), crearEquipo);
router.put('/:id', verificarToken, verificarRol(['super_admin', 'gestion']), actualizarEquipo);
router.delete('/:id', verificarToken, verificarRol(['super_admin']), eliminarEquipo);
router.post('/:id/restaurar', verificarToken, verificarRol(['super_admin']), restaurarEquipo);
router.delete('/:id/permanente', verificarToken, verificarRol(['super_admin']), eliminarPermanente);

module.exports = router;