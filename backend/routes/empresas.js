const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, async (req, res) => {
    try {
        const usuario = req.usuario;

        if (usuario.rol === 'super_admin') {
            const result = await pool.query('SELECT * FROM empresas ORDER BY id');
            return res.json({ success: true, data: result.rows });
        }

        const empresaIds = (usuario.empresas || []).map(e => e.id);
        if (empresaIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const result = await pool.query(
            'SELECT * FROM empresas WHERE id = ANY($1::int[]) ORDER BY id',
            [empresaIds]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;