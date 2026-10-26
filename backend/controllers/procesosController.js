const pool = require('../config/db');

const getProcesos = async (req, res) => {
    try {
        const usuario = req.usuario;
        const { empresa_id } = req.query;

        let conditions = [];
        let params = [];

        if (usuario.rol !== 'super_admin') {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length === 0) return res.json({ success: true, data: [] });
            conditions.push(`p.empresa_id IN (?)`);
            params.push(empresaIds);
        } else if (empresa_id) {
            conditions.push(`p.empresa_id = ?`);
            params.push(empresa_id);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT p.*, e.nombre AS empresa_nombre,
                    (SELECT COUNT(*) FROM equipos eq WHERE eq.proceso_id = p.id AND eq.eliminado = FALSE) AS total_equipos
             FROM procesos p
             JOIN empresas e ON p.empresa_id = e.id
             ${where}
             ORDER BY e.nombre, p.nombre`,
            params
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error getProcesos:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const crearProceso = async (req, res) => {
    try {
        const { empresa_id, nombre, descripcion } = req.body;

        if (!empresa_id || !nombre?.trim())
            return res.status(400).json({ success: false, message: 'Empresa y nombre son requeridos' });

        const ins = await pool.query(
            `INSERT INTO procesos (empresa_id, nombre, descripcion, created_at)
             VALUES (?, ?, ?, NOW())`,
            [empresa_id, nombre.trim(), descripcion?.trim() || null]
        );
        const sel = await pool.query('SELECT * FROM procesos WHERE id = ?', [ins.insertId]);
        res.status(201).json({ success: true, data: sel.rows[0] });
    } catch (error) {
        console.error('Error crearProceso:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const actualizarProceso = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        if (!nombre?.trim())
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });

        const upd = await pool.query(
            `UPDATE procesos SET nombre = ?, descripcion = ? WHERE id = ?`,
            [nombre.trim(), descripcion?.trim() || null, id]
        );
        if (upd.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Área no encontrada' });

        const sel = await pool.query('SELECT * FROM procesos WHERE id = ?', [id]);
        res.json({ success: true, data: sel.rows[0] });
    } catch (error) {
        console.error('Error actualizarProceso:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const eliminarProceso = async (req, res) => {
    try {
        const { id } = req.params;

        const enUso = await pool.query(
            `SELECT COUNT(*) AS total FROM equipos WHERE proceso_id = ? AND eliminado = FALSE`, [id]
        );
        if (parseInt(enUso.rows[0].total) > 0)
            return res.status(400).json({ success: false, message: 'No se puede eliminar: hay equipos asignados a esta área' });

        const result = await pool.query('DELETE FROM procesos WHERE id = ?', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Área no encontrada' });

        res.json({ success: true, message: 'Área eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminarProceso:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = { getProcesos, crearProceso, actualizarProceso, eliminarProceso };
