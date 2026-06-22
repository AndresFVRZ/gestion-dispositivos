const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
    getEquipos,
    getEquiposByEmpresa,
    getEquipoById,
    crearEquipo,
    actualizarEquipo,
    reasignarPerifericos
} = require('../controllers/equiposController');

router.get('/empresa/:empresaId', verificarToken, getEquiposByEmpresa);
router.get('/', verificarToken, getEquipos);
router.get('/:id', verificarToken, getEquipoById);
router.post('/:id/reasignar-perifericos', verificarToken, reasignarPerifericos);
router.post('/', verificarToken, crearEquipo);
router.put('/:id', verificarToken, actualizarEquipo);

module.exports = router;
