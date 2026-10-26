const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, tokenDe, cerrar } = require('./helpers');

after(cerrar);

const RUTAS_USUARIOS = [
    ['get',    '/api/usuarios'],
    ['post',   '/api/usuarios'],
    ['put',    '/api/usuarios/1'],
    ['delete', '/api/usuarios/1'],
    ['post',   '/api/usuarios/1/reenviar-invitacion'],
];

describe('Gestión de usuarios', () => {
    for (const [metodo, ruta] of RUTAS_USUARIOS) {
        test(`${metodo.toUpperCase()} ${ruta} sin token -> 401`, async () => {
            const res = await request(app)[metodo](ruta);
            assert.equal(res.status, 401);
        });
    }

    test('token firmado con otra clave -> 401', async () => {
        const falso = jwt.sign({ id: 1, rol: 'super_admin' }, 'EMTRA_SECRET_KEY_2024');
        const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${falso}`);
        assert.equal(res.status, 401);
    });

    for (const rol of ['soporte', 'logistica', 'financiera', 'gerencia', 'visualizador']) {
        test(`rol ${rol} no puede listar usuarios -> 403`, async () => {
            const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenDe(rol)}`);
            assert.equal(res.status, 403);
        });
    }

    for (const rol of ['super_admin', 'administrador']) {
        test(`rol ${rol} supera la autorización`, async () => {
            const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenDe(rol)}`);
            assert.ok(![401, 403].includes(res.status), `status inesperado ${res.status}`);
        });
    }

    test('administrador no puede crear un super_admin -> 403', async () => {
        const res = await request(app).post('/api/usuarios')
            .set('Authorization', `Bearer ${tokenDe('administrador')}`)
            .send({ nombre: 'X', email: 'x@pruebas.local', rol: 'super_admin' });
        assert.equal(res.status, 403);
    });

    test('administrador no puede ascender a super_admin -> 403', async () => {
        const res = await request(app).put('/api/usuarios/1')
            .set('Authorization', `Bearer ${tokenDe('administrador')}`)
            .send({ nombre: 'X', email: 'x@pruebas.local', rol: 'super_admin' });
        assert.equal(res.status, 403);
    });

    test('nadie puede eliminar su propia cuenta -> 400', async () => {
        const res = await request(app).delete('/api/usuarios/9999')
            .set('Authorization', `Bearer ${tokenDe('super_admin', 9999)}`);
        assert.equal(res.status, 400);
    });
});

describe('Cambio de contraseña', () => {
    test('sin token -> 401', async () => {
        const res = await request(app).put('/api/auth/password/1')
            .send({ currentPassword: 'a', newPassword: 'bbbbbb' });
        assert.equal(res.status, 401);
    });

    test('no se puede cambiar la contraseña de otro usuario -> 403', async () => {
        const res = await request(app).put('/api/auth/password/1')
            .set('Authorization', `Bearer ${tokenDe('super_admin', 9999)}`)
            .send({ currentPassword: 'a', newPassword: 'bbbbbb' });
        assert.equal(res.status, 403);
    });
});

describe('Rutas de inventario', () => {
    for (const ruta of ['/api/equipos', '/api/empresas', '/api/stock', '/api/mantenimientos', '/api/auditoria']) {
        test(`GET ${ruta} sin token -> 401`, async () => {
            const res = await request(app).get(ruta);
            assert.equal(res.status, 401);
        });
    }

    test('soporte no puede eliminar una sede -> 403', async () => {
        const res = await request(app).delete('/api/sedes/1').set('Authorization', `Bearer ${tokenDe('soporte')}`);
        assert.equal(res.status, 403);
    });
});

describe('Cabeceras de seguridad', () => {
    test('helmet activo y CORS restringido', async () => {
        const res = await request(app).get('/').set('Origin', 'https://sitio-malicioso.example');
        assert.equal(res.headers['x-content-type-options'], 'nosniff');
        assert.equal(res.headers['access-control-allow-origin'], undefined);
    });

    test('CORS permite el frontend', async () => {
        const origen = process.env.APP_URL || 'http://localhost:5180';
        const res = await request(app).get('/').set('Origin', origen);
        assert.equal(res.headers['access-control-allow-origin'], origen);
    });
});
