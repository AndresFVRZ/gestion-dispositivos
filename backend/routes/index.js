const express = require('express');
const authRoutes = require('./auth');
const empresaRoutes = require('./empresas');
const equipoRoutes = require('./equipos');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/empresas', empresaRoutes);
router.use('/equipos', equipoRoutes);

module.exports = router;