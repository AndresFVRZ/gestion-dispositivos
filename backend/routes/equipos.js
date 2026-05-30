const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
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

router.get('/papelera', verificarToken, getPapelera);
router.get('/empresa/:empresaId', verificarToken, getEquiposByEmpresa);
router.get('/', verificarToken, getEquipos);
router.post('/:id/restaurar', verificarToken, restaurarEquipo);
router.post('/', verificarToken, crearEquipo);
router.put('/:id', verificarToken, actualizarEquipo);
router.delete('/:id/permanente', verificarToken, eliminarPermanente);
router.delete('/:id', verificarToken, eliminarEquipo);

module.exports = router;
