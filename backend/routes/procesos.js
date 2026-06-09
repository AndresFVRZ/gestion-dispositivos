const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getProcesos, crearProceso, actualizarProceso, eliminarProceso } = require('../controllers/procesosController');

router.get('/',       verificarToken, getProcesos);
router.post('/',      verificarToken, verificarRol(['super_admin', 'gestion']), crearProceso);
router.put('/:id',    verificarToken, verificarRol(['super_admin', 'gestion']), actualizarProceso);
router.delete('/:id', verificarToken, verificarRol(['super_admin', 'gestion']), eliminarProceso);

module.exports = router;
