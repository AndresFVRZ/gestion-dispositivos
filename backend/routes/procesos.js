const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getProcesos, crearProceso, actualizarProceso, eliminarProceso } = require('../controllers/procesosController');

router.get('/',       verificarToken, getProcesos);
router.post('/',      verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), crearProceso);
router.put('/:id',    verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), actualizarProceso);
router.delete('/:id', verificarToken, verificarRol(['super_admin', 'administrador', 'logistica']), eliminarProceso);

module.exports = router;
