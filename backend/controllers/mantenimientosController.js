const pool = require('../config/db');
const { registrarAuditoria } = require('../utils/helpers');

const TIPOS_VALIDOS = ['Preventivo', 'Correctivo', 'Actualización', 'Limpieza', 'Diagnóstico', 'Otro'];

const getMantenimientos = async (req, res) => {
    try {
        const usuario = req.usuario;
        const { equipo_id, empresa_id, tipo } = req.query;
        let conditions = [];
        let params = [];

        if (usuario.rol !== 'super_admin') {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length === 0) return res.json({ success: true, data: [] });
            conditions.push(`eq.empresa_id IN (?)`);
            params.push(empresaIds);
        } else if (empresa_id) {
            conditions.push(`eq.empresa_id = ?`);
            params.push(empresa_id);
        }

        if (equipo_id) { conditions.push(`m.equipo_id = ?`); params.push(equipo_id); }
        if (tipo)      { conditions.push(`m.tipo = ?`);       params.push(tipo); }

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
            `SELECT id, codigo, nombre_equipo, empresa_id, estado FROM equipos WHERE id = ? AND eliminado = FALSE`,
            [equipo_id]
        );
        if (equipoActual.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });

        const equipo = equipoActual.rows[0];
        const estadoAnterior = equipo.estado;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const ins = await client.query(
                `INSERT INTO mantenimientos (equipo_id, fecha_mantenimiento, tipo, descripcion, tecnico, costo, estado_anterior, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [equipo_id, fecha_mantenimiento, tipo, descripcion?.trim() || null, tecnico?.trim() || null, costo || null, estadoAnterior]
            );

            await client.query(`UPDATE equipos SET estado = 'Mantenimiento' WHERE id = ?`, [equipo_id]);

            const sel = await client.query(`SELECT * FROM mantenimientos WHERE id = ?`, [ins.insertId]);

            await client.query('COMMIT');

            await registrarAuditoria(pool, req, 'MANTENIMIENTO_CREAR', equipo,
                `Mantenimiento ${tipo} registrado. Técnico: ${tecnico || 'N/A'}. Estado anterior: ${estadoAnterior}`
            );

            res.status(201).json({ success: true, data: sel.rows[0] });
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

        const upd = await pool.query(
            `UPDATE mantenimientos
             SET equipo_id = ?, fecha_mantenimiento = ?, tipo = ?,
                 descripcion = ?, tecnico = ?, costo = ?
             WHERE id = ?`,
            [equipo_id, fecha_mantenimiento, tipo, descripcion?.trim() || null, tecnico?.trim() || null, costo || null, id]
        );
        if (upd.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        const mantRes = await pool.query(`SELECT * FROM mantenimientos WHERE id = ?`, [id]);

        const equipoRes = await pool.query(
            `SELECT id, codigo, nombre_equipo, empresa_id FROM equipos WHERE id = ?`, [equipo_id]
        );
        const equipo = equipoRes.rows[0];

        await registrarAuditoria(pool, req, 'MANTENIMIENTO_EDITAR', equipo,
            `Mantenimiento ${tipo} actualizado. Técnico: ${tecnico || 'N/A'}`
        );

        res.json({ success: true, data: mantRes.rows[0] });
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
             WHERE m.id = ?`, [id]
        );

        const result = await pool.query('DELETE FROM mantenimientos WHERE id = ?', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        if (mantRes.rows.length > 0) {
            const m = mantRes.rows[0];
            await registrarAuditoria(pool, req, 'MANTENIMIENTO_ELIMINAR',
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

const completarMantenimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_completado } = req.body;

        const mantRes = await pool.query(
            `SELECT m.*, eq.codigo, eq.nombre_equipo, eq.empresa_id
             FROM mantenimientos m
             JOIN equipos eq ON m.equipo_id = eq.id
             WHERE m.id = ?`, [id]
        );
        if (mantRes.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        const mant = mantRes.rows[0];
        if (mant.estado_mant !== 'activo')
            return res.status(400).json({ success: false, message: 'Solo se puede completar un mantenimiento activo' });

        await pool.query(
            `UPDATE mantenimientos
             SET estado_mant = 'completado', fecha_completado = NOW(), notas_completado = ?
             WHERE id = ?`,
            [notas_completado?.trim() || null, id]
        );
        const sel = await pool.query(`SELECT * FROM mantenimientos WHERE id = ?`, [id]);

        await registrarAuditoria(pool, req, 'MANTENIMIENTO_COMPLETAR',
            { id: mant.equipo_id, codigo: mant.codigo, nombre_equipo: mant.nombre_equipo, empresa_id: mant.empresa_id },
            `Mantenimiento marcado como completado. ${notas_completado ? 'Notas: ' + notas_completado : ''}`
        );

        res.json({ success: true, data: sel.rows[0], message: 'Mantenimiento marcado como completado' });
    } catch (error) {
        console.error('Error completarMantenimiento:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const aprobarMantenimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_aprobacion } = req.body;
        const usuarioId = req.usuario.id;

        const mantRes = await pool.query(
            `SELECT m.*, eq.codigo, eq.nombre_equipo, eq.empresa_id
             FROM mantenimientos m
             JOIN equipos eq ON m.equipo_id = eq.id
             WHERE m.id = ?`, [id]
        );
        if (mantRes.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        const mant = mantRes.rows[0];
        if (mant.estado_mant !== 'completado')
            return res.status(400).json({ success: false, message: 'Solo se puede aprobar un mantenimiento completado' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE mantenimientos
                 SET estado_mant = 'aprobado', fecha_aprobacion = NOW(),
                     notas_aprobacion = ?, aprobado_por = ?
                 WHERE id = ?`,
                [notas_aprobacion?.trim() || null, usuarioId, id]
            );

            // Restaurar estado anterior del equipo
            const estadoRestaurar = mant.estado_anterior || 'Disponible';
            await client.query(
                `UPDATE equipos SET estado = ? WHERE id = ?`,
                [estadoRestaurar, mant.equipo_id]
            );

            const sel = await client.query(`SELECT * FROM mantenimientos WHERE id = ?`, [id]);

            await client.query('COMMIT');

            await registrarAuditoria(pool, req, 'MANTENIMIENTO_APROBAR',
                { id: mant.equipo_id, codigo: mant.codigo, nombre_equipo: mant.nombre_equipo, empresa_id: mant.empresa_id },
                `Mantenimiento aprobado. Equipo restaurado a estado: ${estadoRestaurar}`
            );

            res.json({ success: true, data: sel.rows[0], message: `Mantenimiento aprobado. Equipo restaurado a "${estadoRestaurar}"` });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error aprobarMantenimiento:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const rechazarMantenimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_aprobacion } = req.body;
        const usuarioId = req.usuario.id;

        const mantRes = await pool.query(
            `SELECT m.*, eq.codigo, eq.nombre_equipo, eq.empresa_id
             FROM mantenimientos m
             JOIN equipos eq ON m.equipo_id = eq.id
             WHERE m.id = ?`, [id]
        );
        if (mantRes.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Mantenimiento no encontrado' });

        const mant = mantRes.rows[0];
        if (mant.estado_mant !== 'completado')
            return res.status(400).json({ success: false, message: 'Solo se puede rechazar un mantenimiento completado' });

        await pool.query(
            `UPDATE mantenimientos
             SET estado_mant = 'rechazado', fecha_aprobacion = NOW(),
                 notas_aprobacion = ?, aprobado_por = ?
             WHERE id = ?`,
            [notas_aprobacion?.trim() || null, usuarioId, id]
        );
        const sel = await pool.query(`SELECT * FROM mantenimientos WHERE id = ?`, [id]);

        await registrarAuditoria(pool, req, 'MANTENIMIENTO_RECHAZAR',
            { id: mant.equipo_id, codigo: mant.codigo, nombre_equipo: mant.nombre_equipo, empresa_id: mant.empresa_id },
            `Mantenimiento rechazado. Equipo permanece en estado Mantenimiento. ${notas_aprobacion ? 'Razón: ' + notas_aprobacion : ''}`
        );

        res.json({ success: true, data: sel.rows[0], message: 'Mantenimiento rechazado. El equipo permanece en estado Mantenimiento' });
    } catch (error) {
        console.error('Error rechazarMantenimiento:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento,
    completarMantenimiento, aprobarMantenimiento, rechazarMantenimiento
};
