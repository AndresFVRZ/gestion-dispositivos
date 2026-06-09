const express = require('express');
const pool = require('../config/db');
const { verificarToken, verificarRol } = require('../middleware/auth');

const router = express.Router();

// GET / — empresas según rol
router.get('/', verificarToken, async (req, res) => {
    try {
        const usuario = req.usuario;

        if (usuario.rol === 'super_admin') {
            const result = await pool.query('SELECT * FROM empresas ORDER BY nombre');
            return res.json({ success: true, data: result.rows });
        }

        const empresaIds = (usuario.empresas || []).map(e => e.id);
        if (empresaIds.length === 0) return res.json({ success: true, data: [] });

        const result = await pool.query(
            'SELECT * FROM empresas WHERE id = ANY($1::int[]) ORDER BY nombre',
            [empresaIds]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /para-prestamo — todas las empresas (para dropdown de préstamo)
router.get('/para-prestamo', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM empresas ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresas WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const AREAS_DEFAULT = [
    'BAJA', 'COMERCIAL', 'CALIDAD', 'DISPONIBLE', 'FINANCIERA SCI',
    'GERENCIA', 'GESTION HUMANA', 'IT', 'JURIDICA', 'LOGISTICA',
    'PLANTA', 'PRODUCCION', 'SST', 'TESORERIA', 'TX'
];

// POST / — crear empresa (solo super_admin)
router.post('/', verificarToken, verificarRol(['super_admin']), async (req, res) => {
    try {
        const { nombre, logo } = req.body;
        if (!nombre?.trim())
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'INSERT INTO empresas (nombre, logo) VALUES ($1, $2) RETURNING *',
                [nombre.trim(), logo || null]
            );
            const empresaId = result.rows[0].id;
            for (const area of AREAS_DEFAULT) {
                await client.query(
                    'INSERT INTO procesos (empresa_id, nombre) VALUES ($1, $2) ON CONFLICT (empresa_id, nombre) DO NOTHING',
                    [empresaId, area]
                );
            }
            await client.query('COMMIT');
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /:id — actualizar nombre y/o logo (solo super_admin)
router.put('/:id', verificarToken, verificarRol(['super_admin']), async (req, res) => {
    try {
        const { nombre, logo } = req.body;
        const result = await pool.query(
            `UPDATE empresas SET
                nombre = COALESCE($1, nombre),
                logo   = COALESCE($2, logo)
             WHERE id = $3 RETURNING *`,
            [nombre?.trim() || null, logo || null, req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /:id/logo — quitar logo
router.delete('/:id/logo', verificarToken, verificarRol(['super_admin']), async (req, res) => {
    try {
        await pool.query('UPDATE empresas SET logo = NULL WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Logo eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
