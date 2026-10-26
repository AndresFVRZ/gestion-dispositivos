// Configuración común de las pruebas: clave JWT propia y app sin levantar puerto.
process.env.SECRET_KEY = 'clave-de-pruebas';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const app = require('../server');
const { pool } = require('../config/db');

// Token firmado como lo hace /api/auth/login
const tokenDe = (rol, id = 9999) =>
    jwt.sign({ id, email: `${rol}@pruebas.local`, nombre: rol, rol, empresas: [] }, process.env.SECRET_KEY, { expiresIn: '5m' });

const cerrar = () => pool.end();

module.exports = { app, tokenDe, cerrar };
