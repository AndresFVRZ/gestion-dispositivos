const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
    getEquipos,
    getOpciones,
    getHojaVida,
    getEquiposByEmpresa,
    getEquipoById,
    crearEquipo,
    actualizarEquipo,
    reasignarPerifericos
} = require('../controllers/equiposController');

router.get('/opciones', verificarToken, getOpciones);
router.get('/empresa/:empresaId', verificarToken, getEquiposByEmpresa);
router.get('/', verificarToken, getEquipos);
router.get('/:id/hoja-vida', verificarToken, getHojaVida);
router.get('/:id', verificarToken, getEquipoById);
router.post('/:id/reasignar-perifericos', verificarToken, reasignarPerifericos);
router.post('/', verificarToken, crearEquipo);
router.put('/:id', verificarToken, actualizarEquipo);

module.exports = router;
