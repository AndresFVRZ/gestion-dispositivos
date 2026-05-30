const pool = require('../config/db');
const { registrarHistorial } = require('../utils/helpers');

const getEquipos = async (req, res) => {
    try {
        const usuario = req.usuario;
        
        if (!usuario) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }
        
        let query = `
            SELECT eq.*, e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.eliminado = FALSE
        `;
        
        let params = [];
        
        if (usuario.rol !== 'super_admin') {
            let empresaIds = [];
            
            if (usuario.empresas && usuario.empresas.length > 0) {
                empresaIds = usuario.empresas.map(e => e.id);
            } else if (usuario.empresa_id) {
                empresaIds = [usuario.empresa_id];
            }
            
            if (empresaIds.length > 0) {
                query += ` AND eq.empresa_id = ANY($1::int[])`;
                params.push(empresaIds);
            } else {
                return res.json({ success: true, data: [] });
            }
        }
        
        query += ` ORDER BY e.nombre, eq.tipo, eq.codigo`;
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getEquiposByEmpresa = async (req, res) => {
    try {
        const { empresaId } = req.params;
        const query = `
            SELECT eq.*, e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.empresa_id = $1 AND eq.eliminado = FALSE
            ORDER BY eq.tipo, eq.codigo
        `;
        const result = await pool.query(query, [empresaId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error en getEquiposByEmpresa:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// CREAR EQUIPO - CON HISTORIAL
// ==========================================
const crearEquipo = async (req, res) => {
    try {
        const {
            codigo,
            nombre_equipo,
            tipo,
            marca,
            modelo,
            serial,
            estado,
            ubicacion,
            asignado_a,
            fecha_asignacion,
            procesador,
            ram,
            disco_duro,
            sistema_operativo,
            garantia,
            especificaciones,
            empresa_id
        } = req.body;

        const result = await pool.query(
            `INSERT INTO equipos 
                (codigo, nombre_equipo, tipo, marca, modelo, serial, estado,
                 ubicacion, asignado_a, fecha_asignacion, procesador, ram, disco_duro,
                 sistema_operativo, garantia, especificaciones, empresa_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
             RETURNING *`,
            [
                codigo, nombre_equipo, tipo, marca, modelo, serial, estado,
                ubicacion, asignado_a, fecha_asignacion, procesador, ram, disco_duro,
                sistema_operativo, garantia, especificaciones, empresa_id
            ]
        );

        await registrarHistorial(pool, req, 'CREAR', result.rows[0], `Equipo creado: ${codigo}`);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error en crearEquipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ACTUALIZAR EQUIPO - CON HISTORIAL
// ==========================================
const actualizarEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            codigo,
            nombre_equipo,
            tipo,
            marca,
            modelo,
            serial,
            estado,
            ubicacion,
            asignado_a,
            fecha_asignacion,
            procesador,
            ram,
            disco_duro,
            sistema_operativo,
            garantia,
            especificaciones,
            empresa_id
        } = req.body;

        const result = await pool.query(
            `UPDATE equipos SET 
                codigo = $1, nombre_equipo = $2, tipo = $3, marca = $4, modelo = $5,
                serial = $6, estado = $7, ubicacion = $8, asignado_a = $9,
                fecha_asignacion = $10, procesador = $11, ram = $12, disco_duro = $13,
                sistema_operativo = $14, garantia = $15, especificaciones = $16, empresa_id = $17
             WHERE id = $18 AND eliminado = FALSE
             RETURNING *`,
            [
                codigo, nombre_equipo, tipo, marca, modelo, serial, estado,
                ubicacion, asignado_a, fecha_asignacion, procesador, ram, disco_duro,
                sistema_operativo, garantia, especificaciones, empresa_id, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
        }

        await registrarHistorial(pool, req, 'EDITAR', result.rows[0], `Equipo editado: ${codigo}`);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error en actualizarEquipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ELIMINAR EQUIPO (SOFT DELETE) - CON LOGS
// ==========================================
const eliminarEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        const result = await pool.query(
            `UPDATE equipos SET
                eliminado = TRUE,
                eliminado_en = NOW(),
                eliminado_por = $1
             WHERE id = $2 AND eliminado = FALSE
             RETURNING *`,
            [usuarioId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado o ya eliminado' });
        }

        await registrarHistorial(pool, req, 'ELIMINAR', result.rows[0], `Equipo movido a papelera`);

        res.json({ success: true, message: 'Equipo movido a papelera', data: result.rows[0] });
    } catch (error) {
        console.error('Error en eliminarEquipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// RESTAURAR EQUIPO - CON HISTORIAL
// ==========================================
const restaurarEquipo = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE equipos SET 
                eliminado = FALSE, 
                eliminado_en = NULL, 
                eliminado_por = NULL 
             WHERE id = $1 AND eliminado = TRUE
             RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado en papelera' });
        }

        await registrarHistorial(pool, req, 'RESTAURAR', result.rows[0], `Equipo restaurado desde papelera`);

        res.json({ success: true, message: 'Equipo restaurado correctamente', data: result.rows[0] });
    } catch (error) {
        console.error('Error en restaurarEquipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ELIMINAR PERMANENTEMENTE - CON HISTORIAL
// ==========================================
const eliminarPermanente = async (req, res) => {
    try {
        const { id } = req.params;

        const equipoAntes = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
        
        const result = await pool.query('DELETE FROM equipos WHERE id = $1 AND eliminado = TRUE RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado en la papelera' });
        }

        await registrarHistorial(pool, req, 'ELIMINAR_PERMANENTE', equipoAntes.rows[0], `Equipo eliminado permanentemente`);

        res.json({ success: true, message: 'Equipo eliminado permanentemente' });
    } catch (error) {
        console.error('Error en eliminarPermanente:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// OBTENER PAPELERA
// ==========================================
const getPapelera = async (req, res) => {
    try {
        const usuario = req.usuario;
        
        let empresaIds = [];
        
        if (usuario.rol === 'super_admin') {
            const result = await pool.query(
                `SELECT eq.*, u.nombre as eliminado_por_nombre
                 FROM equipos eq
                 LEFT JOIN usuarios u ON eq.eliminado_por = u.id
                 WHERE eq.eliminado = TRUE
                 ORDER BY eq.eliminado_en DESC`
            );
            return res.json({ success: true, data: result.rows });
        }
        
        if (usuario.empresas && usuario.empresas.length > 0) {
            empresaIds = usuario.empresas.map(e => e.id);
        } else if (usuario.empresa_id) {
            empresaIds = [usuario.empresa_id];
        } else {
            return res.json({ success: true, data: [] });
        }
        
        const result = await pool.query(
            `SELECT eq.*, u.nombre as eliminado_por_nombre
             FROM equipos eq
             LEFT JOIN usuarios u ON eq.eliminado_por = u.id
             WHERE eq.empresa_id = ANY($1::int[]) AND eq.eliminado = TRUE
             ORDER BY eq.eliminado_en DESC`,
            [empresaIds]
        );
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error en getPapelera:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getEquipos, 
    getEquiposByEmpresa, 
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    restaurarEquipo,
    eliminarPermanente,
    getPapelera
};