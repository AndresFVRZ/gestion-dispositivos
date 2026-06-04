const pool = require('../config/db');
const { registrarHistorial } = require('../utils/helpers');

// Subquery reutilizable para incluir periféricos con su tipo
const PERIFERICOS_SUBQUERY = `
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id',          p.id,
            'tipo_id',     p.tipo_id,
            'tipo_nombre', td.nombre,
            'marca',       p.marca,
            'modelo',      p.modelo,
            'serial',      p.serial,
            'descripcion', p.descripcion
         ) ORDER BY p.id)
         FROM perifericos p
         LEFT JOIN tipo_dispositivo td ON td.id = p.tipo_id
         WHERE p.equipo_id = eq.id),
        '[]'::json
    ) AS perifericos
`;

// Guarda (borra y re-inserta) los periféricos de un equipo.
// Solo acepta tipo_id cuya categoria='periferico' en tipo_dispositivo.
const guardarPerifericos = async (equipoId, perifericos) => {
    await pool.query('DELETE FROM perifericos WHERE equipo_id = $1', [equipoId]);
    if (!Array.isArray(perifericos)) return;

    const tiposIds = [...new Set(perifericos.map(p => p?.tipo_id).filter(Boolean))];
    let tiposValidos = new Set();
    if (tiposIds.length > 0) {
        const check = await pool.query(
            `SELECT id FROM tipo_dispositivo WHERE id = ANY($1::int[]) AND categoria = 'periferico'`,
            [tiposIds]
        );
        tiposValidos = new Set(check.rows.map(r => r.id));
    }

    for (const p of perifericos) {
        const rawId = p?.tipo_id ? Number(p.tipo_id) : null;
        const tipo_id    = rawId && tiposValidos.has(rawId) ? rawId : null;
        const marca      = typeof p === 'object' ? (p?.marca      || '').trim() || null : null;
        const modelo     = typeof p === 'object' ? (p?.modelo     || '').trim() || null : null;
        const serial     = typeof p === 'object' ? (p?.serial     || '').trim() || null : null;
        const descripcion = (typeof p === 'string' ? p : p?.descripcion || '').trim() || null;
        if (tipo_id || marca || modelo || serial || descripcion) {
            await pool.query(
                `INSERT INTO perifericos (equipo_id, tipo_id, marca, modelo, serial, descripcion)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [equipoId, tipo_id, marca, modelo, serial, descripcion]
            );
        }
    }
};

const getEquipos = async (req, res) => {
    try {
        const usuario = req.usuario;

        if (!usuario) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        let query = `
            SELECT eq.*, e.nombre as empresa_nombre,
                   td.nombre as tipo_nombre, ${PERIFERICOS_SUBQUERY}
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
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

        query += ` ORDER BY e.nombre, td.nombre, eq.codigo`;
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
            SELECT eq.*, e.nombre as empresa_nombre,
                   td.nombre as tipo_nombre, ${PERIFERICOS_SUBQUERY}
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
            WHERE eq.empresa_id = $1 AND eq.eliminado = FALSE
            ORDER BY td.nombre, eq.nombre_equipo
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
            nombre_equipo,
            tipo_id,
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
            empresa_id,
            numero_placa,
            sede,
            prestado_a_empresa_id,
            perifericos
        } = req.body;

        if (tipo_id) {
            const tipoCheck = await pool.query(
                `SELECT categoria FROM tipo_dispositivo WHERE id = $1`, [tipo_id]
            );
            if (tipoCheck.rows.length === 0 || tipoCheck.rows[0].categoria !== 'equipo') {
                return res.status(400).json({ success: false, message: 'El tipo seleccionado no es válido para equipos' });
            }
        }

        const fechaAsig = fecha_asignacion || null;
        const garantiaVal = garantia || null;

        const result = await pool.query(
            `INSERT INTO equipos
                (nombre_equipo, tipo_id, marca, modelo, serial, estado,
                 ubicacion, asignado_a, fecha_asignacion, procesador, ram, disco_duro,
                 sistema_operativo, garantia, especificaciones, empresa_id, numero_placa, sede,
                 prestado_a_empresa_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
             RETURNING *`,
            [
                nombre_equipo, tipo_id || null, marca, modelo, serial, estado,
                ubicacion, asignado_a, fechaAsig, procesador, ram, disco_duro,
                sistema_operativo, garantiaVal, especificaciones, empresa_id,
                numero_placa || null, sede || null, prestado_a_empresa_id || null
            ]
        );

        await guardarPerifericos(result.rows[0].id, perifericos);
        await registrarHistorial(pool, req, 'CREAR', result.rows[0], `Equipo creado: ${serial || nombre_equipo}`);

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
            nombre_equipo,
            tipo_id,
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
            empresa_id,
            numero_placa,
            sede,
            prestado_a_empresa_id,
            perifericos
        } = req.body;

        if (tipo_id) {
            const tipoCheck = await pool.query(
                `SELECT categoria FROM tipo_dispositivo WHERE id = $1`, [tipo_id]
            );
            if (tipoCheck.rows.length === 0 || tipoCheck.rows[0].categoria !== 'equipo') {
                return res.status(400).json({ success: false, message: 'El tipo seleccionado no es válido para equipos' });
            }
        }

        const fechaAsig = fecha_asignacion || null;
        const garantiaVal = garantia || null;

        const result = await pool.query(
            `UPDATE equipos SET
                nombre_equipo = $1, tipo_id = $2, marca = $3, modelo = $4,
                serial = $5, estado = $6, ubicacion = $7, asignado_a = $8,
                fecha_asignacion = $9, procesador = $10, ram = $11, disco_duro = $12,
                sistema_operativo = $13, garantia = $14, especificaciones = $15,
                empresa_id = $16, numero_placa = $17, sede = $18,
                prestado_a_empresa_id = $19
             WHERE id = $20 AND eliminado = FALSE
             RETURNING *`,
            [
                nombre_equipo, tipo_id || null, marca, modelo, serial, estado,
                ubicacion, asignado_a, fechaAsig, procesador, ram, disco_duro,
                sistema_operativo, garantiaVal, especificaciones, empresa_id,
                numero_placa || null, sede || null,
                prestado_a_empresa_id || null, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
        }

        await guardarPerifericos(id, perifericos);
        await registrarHistorial(pool, req, 'EDITAR', result.rows[0], `Equipo editado: ${serial || nombre_equipo}`);

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