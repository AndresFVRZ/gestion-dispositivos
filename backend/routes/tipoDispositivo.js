const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getTipos, crearTipo, eliminarTipo } = require('../controllers/tipoDispositivoController');

router.get('/',       verificarToken, getTipos);
router.post('/',      verificarToken, verificarRol(['super_admin']), crearTipo);
router.delete('/:id', verificarToken, verificarRol(['super_admin']), eliminarTipo);

module.exports = router;
