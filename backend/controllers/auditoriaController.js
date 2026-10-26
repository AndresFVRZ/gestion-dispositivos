const pool = require('../config/db');

const getAuditoria = async (req, res) => {
    try {
        const { limite = 100, offset = 0, accion, fecha_desde, fecha_hasta, sin_limite } = req.query;
        const usuario = req.usuario;

        let query = `
            SELECT h.*,
                   CASE
                       WHEN h.accion = 'CREAR'                  THEN 'Creación'
                       WHEN h.accion = 'EDITAR'                 THEN 'Edición'
                       WHEN h.accion = 'ELIMINAR'               THEN 'Papelera'
                       WHEN h.accion = 'RESTAURAR'              THEN 'Restauración'
                       WHEN h.accion = 'ELIMINAR_PERMANENTE'    THEN 'Eliminación permanente'
                       WHEN h.accion = 'MANTENIMIENTO_CREAR'      THEN 'Mantenimiento registrado'
                       WHEN h.accion = 'MANTENIMIENTO_EDITAR'     THEN 'Mantenimiento editado'
                       WHEN h.accion = 'MANTENIMIENTO_ELIMINAR'   THEN 'Mantenimiento eliminado'
                       WHEN h.accion = 'MANTENIMIENTO_COMPLETAR'  THEN 'Mantenimiento completado'
                       WHEN h.accion = 'MANTENIMIENTO_APROBAR'    THEN 'Mantenimiento aprobado'
                       WHEN h.accion = 'MANTENIMIENTO_RECHAZAR'   THEN 'Mantenimiento rechazado'
                       ELSE h.accion
                   END as accion_texto
            FROM historial_acciones h
            WHERE 1=1
        `;

        let params = [];

        if (usuario.rol !== 'super_admin') {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length > 0) {
                query += ` AND h.empresa_id IN (?)`;
                params.push(empresaIds);
            }
        }

        if (accion && accion !== 'todos') {
            query += ` AND h.accion = ?`;
            params.push(accion);
        }

        if (fecha_desde) {
            query += ` AND h.fecha >= ?`;
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ` AND h.fecha <= ?`;
            params.push(fecha_hasta);
        }

        if (sin_limite === 'true') {
            query += ` ORDER BY h.fecha DESC`;
        } else {
            query += ` ORDER BY h.fecha DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limite, 10) || 100, parseInt(offset, 10) || 0);
        }

        const result = await pool.query(query, params);

        const totalResult = await pool.query('SELECT COUNT(*) as total FROM historial_acciones');

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(totalResult.rows[0].total),
            limite: parseInt(limite),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error en getAuditoria:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = { getAuditoria };
