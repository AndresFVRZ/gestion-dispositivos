const pool = require('../config/db');
const { registrarHistorial } = require('../utils/helpers');

const TIPOS_VALIDOS = ['Preventivo', 'Correctivo', 'Actualización', 'Limpieza', 'Diagnóstico', 'Otro'];

const getMantenimientos = async (req, res) => {
    try {
        const usuario = req.usuario;
        const { equipo_id, empresa_id, tipo } = req.query;
        let conditions = [];
        let params = [];
        let i = 1;

        if (usuario.rol !== 'super_admin') {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length === 0) return res.json({ success: true, data: [] });
            conditions.push(`eq.empresa_id = ANY($${i++}::int[])`);
            params.push(empresaIds);
        } else if (empresa_id) {
            conditions.push(`eq.empresa_id = $${i++}`);
            params.push(empresa_id);
        }

        if (equipo_id) { conditions.push(`m.equipo_id = $${i++}`); params.push(equipo_id); }
        if (tipo)      { conditions.push(`m.tipo = $${i++}`);       params.push(tipo); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT m.*,
                    eq.nombre_equipo, eq.serial, eq.empresa_id, eq.codigo,
                    e.nombre AS empresa_nombre
             FROM mantenimientos m
             JOIN equipos  eq ON m.equipo_id  = eq.id
             JOIN empresas e  ON eq.empresa_id = e.id
             ${where}
             ORDER BY m.fecha_mantenimiento DESC, m.id DESC`,
            params
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error getMantenimientos:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const crearMantenimiento = async (req, res) => {
    try {
        const { equipo_id, fecha_mantenimiento, tipo, descripcion, tecnico, costo } = req.body;

        if (!equipo_id || !fecha_mantenimiento || !tipo)
            return res.status(400).json({ success: false, message: 'Equipo, fecha y tipo son requeridos' });
        if (!TIPOS_VALIDOS.includes(tipo))
            return res.status(400).json({ success: false, message: `Tipo inválido. Opciones: ${TIPOS_VALIDOS.join(', ')}` });

        const equipoActual = await pool.query(
            `SELECT id, codigo, nombre_equipo, empresa_id, estado FROM equipos WHERE id = $1 AND eliminado = FALSE`,
            [equipo_id]
        );
        if (equipoActual.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });

        const equipo = equipoActual.rows[0];
        const estadoAnterior = equipo.estado;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `INSERT INTO mantenimientos (equipo_id, fecha_mantenimiento, tipo, descripcion, tecnico, costo, estado_anterior, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
                [equipo_id, fecha_mantenimiento, tipo, descripcion?.trim() || null, tecnico?.trim() || null, costo || null, estadoAnterior]
            );

            await client.query(`UPDATE equipos SET estado = 'Mantenimiento' WHERE id = $1`, [equipo_id]);

            await client.query('COMMIT');

            await registrarHistorial(pool, req, 'MANTENIMIENTO_CREAR', equipo,
                `Mantenimiento ${tipo} registrado. Técnico: ${tecnico || 'N/A'}. Estado anterior: ${estadoAnterior}`
            );

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error crearMantenimiento:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const actualizarMantenimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { equipo_id, fecha_mantenimiento, tipo, descripcion, tecnico, costo } = req.body;

        if (!equipo_id || !fecha_mantenimiento || !tipo)
            return res.status(400).json({ success: false, message: 'Equipo, fecha y tipo son requeridos' });
        if (!TIPOS_VALIDOS.includes(tipo))
            return res.status(400).json({ success: false, message: `Tipo inválido. Opciones: ${TIPOS_VALIDOS.join(', ')}` });

        const result = await pool.query(
            `UPDATE mantenimientos
             SET equipo_id = $1, fecha_mantenimiento = $2, tipo = $3,
                 descripcion = $4, tecnico = $5, costo = $6
             WHERE id = $7 RETURNING *`,
            [equipo_id, fecha_mantenimiento, tipo, descripcion?.trim() || null, tecnico?.trim() || null, costo || null, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        const equipoRes = await pool.query(
            `SELECT id, codigo, nombre_equipo, empresa_id FROM equipos WHERE id = $1`, [equipo_id]
        );
        const equipo = equipoRes.rows[0];

        await registrarHistorial(pool, req, 'MANTENIMIENTO_EDITAR', equipo,
            `Mantenimiento ${tipo} actualizado. Técnico: ${tecnico || 'N/A'}`
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error actualizarMantenimiento:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const eliminarMantenimiento = async (req, res) => {
    try {
        const { id } = req.params;

        const mantRes = await pool.query(
            `SELECT m.*, eq.codigo, eq.nombre_equipo, eq.empresa_id
             FROM mantenimientos m
             JOIN equipos eq ON m.equipo_id = eq.id
             WHERE m.id = $1`, [id]
        );

        const result = await pool.query('DELETE FROM mantenimientos WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        if (mantRes.rows.length > 0) {
            const m = mantRes.rows[0];
            await registrarHistorial(pool, req, 'MANTENIMIENTO_ELIMINAR',
                { id: m.equipo_id, codigo: m.codigo, nombre_equipo: m.nombre_equipo, empresa_id: m.empresa_id },
                `Mantenimiento ${m.tipo} eliminado. Fecha: ${m.fecha_mantenimiento}`
            );
        }

        res.json({ success: true, message: 'Mantenimiento eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminarMantenimiento:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento };
