// Archivo aparte: los contadores del rate-limit viven en memoria del proceso.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, cerrar } = require('./helpers');

after(cerrar);

test('login bloquea tras 10 intentos -> 429', async () => {
    const intentar = () => request(app).post('/api/auth/login')
        .send({ email: 'no-existe@pruebas.local', password: 'incorrecta' });

    for (let i = 0; i < 10; i++) {
        const res = await intentar();
        assert.notEqual(res.status, 429, `bloqueado antes de tiempo en el intento ${i + 1}`);
    }
    const res = await intentar();
    assert.equal(res.status, 429);
});
