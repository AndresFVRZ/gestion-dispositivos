const pool = require('../config/db');

const getPlacas = async (req, res) => {
    try {
        const usuario = req.usuario;
        let query, params = [];

        if (usuario.rol === 'super_admin') {
            query = `
                SELECT p.*,
                       e.nombre  AS empresa_nombre,
                       eq.codigo AS equipo_codigo,
                       eq.nombre_equipo,
                       u.nombre  AS asignado_por_nombre
                FROM placas p
                LEFT JOIN empresas  e  ON p.empresa_id    = e.id
                LEFT JOIN equipos   eq ON p.equipo_id     = eq.id
                LEFT JOIN usuarios  u  ON p.asignado_por  = u.id
                ORDER BY p.created_at DESC
            `;
        } else {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length === 0) return res.json({ success: true, data: [] });
            query = `
                SELECT p.*,
                       e.nombre  AS empresa_nombre,
                       eq.codigo AS equipo_codigo,
                       eq.nombre_equipo,
                       u.nombre  AS asignado_por_nombre
                FROM placas p
                LEFT JOIN empresas  e  ON p.empresa_id    = e.id
                LEFT JOIN equipos   eq ON p.equipo_id     = eq.id
                LEFT JOIN usuarios  u  ON p.asignado_por  = u.id
                WHERE p.empresa_id = ANY($1::int[])
                ORDER BY p.created_at DESC
            `;
            params = [empresaIds];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error getPlacas:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const crearPlaca = async (req, res) => {
    try {
        const { equipo_id, empresa_id, numero, fecha_asignacion, estado, notas } = req.body;

        if (!numero?.trim() || !empresa_id)
            return res.status(400).json({ success: false, message: 'Número de placa y empresa son requeridos' });

        const numCheck = await pool.query(
            'SELECT id FROM placas WHERE numero = $1 AND empresa_id = $2',
            [numero.trim(), empresa_id]
        );
        if (numCheck.rows.length > 0)
            return res.status(400).json({ success: false, message: 'Ya existe una placa con ese número en esta empresa' });

        const result = await pool.query(
            `INSERT INTO placas (equipo_id, empresa_id, numero, fecha_asignacion, estado, notas, asignado_por, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
            [
                equipo_id || null,
                empresa_id,
                numero.trim(),
                fecha_asignacion || null,
                estado || 'activa',
                notas?.trim() || null,
                req.usuario.id
            ]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error crearPlaca:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const actualizarPlaca = async (req, res) => {
    try {
        const { id } = req.params;
        const { equipo_id, empresa_id, numero, fecha_asignacion, estado, notas } = req.body;

        if (!numero?.trim() || !empresa_id)
            return res.status(400).json({ success: false, message: 'Número de placa y empresa son requeridos' });

        const numCheck = await pool.query(
            'SELECT id FROM placas WHERE numero = $1 AND empresa_id = $2 AND id != $3',
            [numero.trim(), empresa_id, id]
        );
        if (numCheck.rows.length > 0)
            return res.status(400).json({ success: false, message: 'Ya existe una placa con ese número en esta empresa' });

        const result = await pool.query(
            `UPDATE placas
             SET equipo_id = $1, empresa_id = $2, numero = $3,
                 fecha_asignacion = $4, estado = $5, notas = $6
             WHERE id = $7 RETURNING *`,
            [
                equipo_id || null,
                empresa_id,
                numero.trim(),
                fecha_asignacion || null,
                estado || 'activa',
                notas?.trim() || null,
                id
            ]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Placa no encontrada' });

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error actualizarPlaca:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const eliminarPlaca = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM placas WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Placa no encontrada' });

        res.json({ success: true, message: 'Placa eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminarPlaca:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getPlacas, crearPlaca, actualizarPlaca, eliminarPlaca };
