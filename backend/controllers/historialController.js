const pool = require('../config/db');

const getHistorial = async (req, res) => {
    try {
        const { limite = 100, offset = 0, accion, fecha_desde, fecha_hasta } = req.query;
        const usuario = req.usuario;
        
        let query = `
            SELECT h.*,
                   CASE 
                       WHEN h.accion = 'CREAR' THEN 'Creación'
                       WHEN h.accion = 'EDITAR' THEN 'Edición'
                       WHEN h.accion = 'ELIMINAR' THEN 'Papelera'
                       WHEN h.accion = 'RESTAURAR' THEN 'Restauración'
                       WHEN h.accion = 'ELIMINAR_PERMANENTE' THEN 'Eliminación permanente'
                       ELSE h.accion
                   END as accion_texto
            FROM historial_acciones h
            WHERE 1=1
        `;
        
        let params = [];
        let paramCount = 1;
        
        if (usuario.rol !== 'super_admin') {
            const empresaIds = (usuario.empresas || []).map(e => e.id);
            if (empresaIds.length > 0) {
                query += ` AND h.empresa_id = ANY($${paramCount}::int[])`;
                params.push(empresaIds);
                paramCount++;
            }
        }
        
        if (accion && accion !== 'todos') {
            query += ` AND h.accion = $${paramCount}`;
            params.push(accion);
            paramCount++;
        }
        
        if (fecha_desde) {
            query += ` AND h.fecha >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }
        
        if (fecha_hasta) {
            query += ` AND h.fecha <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        query += ` ORDER BY h.fecha DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limite, offset);
        
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
        console.error('Error en getHistorial:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getHistorial };