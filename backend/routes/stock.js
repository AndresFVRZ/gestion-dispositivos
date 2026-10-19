const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { getStock, crearParte, actualizarParte, ajustarCantidad, eliminarParte } = require('../controllers/stockController');

// Consultar: cualquier usuario autenticado. Modificar: estos roles.
const ROLES_STOCK = ['super_admin', 'administrador', 'logistica', 'soporte'];

router.get('/',               verificarToken, getStock);
router.post('/',              verificarToken, verificarRol(ROLES_STOCK), crearParte);
router.put('/:id',            verificarToken, verificarRol(ROLES_STOCK), actualizarParte);
router.patch('/:id/ajustar',  verificarToken, verificarRol(ROLES_STOCK), ajustarCantidad);
router.delete('/:id',         verificarToken, verificarRol(ROLES_STOCK), eliminarParte);

module.exports = router;
