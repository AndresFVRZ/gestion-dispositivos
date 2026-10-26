const pool = require('../config/db');

const getSedes = async (req, res) => {
    try {
        const usuario = req.usuario;
        let query, params = [];

        if (usuario.rol === 'super_admin') {
            query = `
                SELECT s.*, e.nombre AS empresa_nombre
                FROM sedes s
                JOIN empresas e ON s.empresa_id = e.id
                ORDER BY e.nombre, s.nombre
            `;
        } else {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length === 0) return res.json({ success: true, data: [] });
            query = `
                SELECT s.*, e.nombre AS empresa_nombre
                FROM sedes s
                JOIN empresas e ON s.empresa_id = e.id
                WHERE s.empresa_id IN (?)
                ORDER BY e.nombre, s.nombre
            `;
            params = [empresaIds];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error getSedes:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const crearSede = async (req, res) => {
    try {
        const { empresa_id, nombre, ubicacion } = req.body;
        if (!nombre?.trim() || !empresa_id)
            return res.status(400).json({ success: false, message: 'Empresa y nombre son requeridos' });

        const ins = await pool.query(
            `INSERT INTO sedes (empresa_id, nombre, ubicacion, created_at)
             VALUES (?, ?, ?, NOW())`,
            [empresa_id, nombre.trim(), ubicacion?.trim() || null]
        );
        const sel = await pool.query('SELECT * FROM sedes WHERE id = ?', [ins.insertId]);
        res.status(201).json({ success: true, data: sel.rows[0] });
    } catch (error) {
        console.error('Error crearSede:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const actualizarSede = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ubicacion, empresa_id } = req.body;
        if (!nombre?.trim())
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });

        const upd = await pool.query(
            `UPDATE sedes
             SET nombre = ?, ubicacion = ?, empresa_id = ?
             WHERE id = ?`,
            [nombre.trim(), ubicacion?.trim() || null, empresa_id, id]
        );
        if (upd.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Sede no encontrada' });

        const sel = await pool.query('SELECT * FROM sedes WHERE id = ?', [id]);
        res.json({ success: true, data: sel.rows[0] });
    } catch (error) {
        console.error('Error actualizarSede:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const eliminarSede = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sedes WHERE id = ?', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Sede no encontrada' });

        res.json({ success: true, message: 'Sede eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminarSede:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = { getSedes, crearSede, actualizarSede, eliminarSede };
