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
const guardarPerifericos = async (client, equipoId, perifericos) => {
    if (!Array.isArray(perifericos)) return;

    await client.query('DELETE FROM perifericos WHERE equipo_id = $1', [equipoId]);

    const tiposIds = [...new Set(perifericos.map(p => p?.tipo_id).filter(Boolean))];
    let tiposValidos = new Set();
    if (tiposIds.length > 0) {
        const check = await client.query(
            `SELECT id FROM tipo_dispositivo WHERE id = ANY($1::int[]) AND categoria = 'periferico'`,
            [tiposIds]
        );
        tiposValidos = new Set(check.rows.map(r => r.id));
    }

    for (const p of perifericos) {
        const rawId = p?.tipo_id ? Number(p.tipo_id) : null;
        const tipo_id     = rawId && tiposValidos.has(rawId) ? rawId : null;
        const marca       = typeof p === 'object' ? (p?.marca      || '').trim() || null : null;
        const modelo      = typeof p === 'object' ? (p?.modelo     || '').trim() || null : null;
        const serial      = typeof p === 'object' ? (p?.serial     || '').trim() || null : null;
        const descripcion = (typeof p === 'string' ? p : p?.descripcion || '').trim() || null;
        if (tipo_id || marca || modelo || serial || descripcion) {
            await client.query(
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
                   td.nombre as tipo_nombre,
                   ep.nombre as prestado_a_nombre,
                   pr.nombre as proceso_nombre,
                   ${PERIFERICOS_SUBQUERY}
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
            LEFT JOIN empresas ep ON eq.prestado_a_empresa_id = ep.id
            LEFT JOIN procesos pr ON eq.proceso_id = pr.id
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
                query += `
                  AND (
                    eq.empresa_id = ANY($1::int[])
                    OR
                    (eq.prestado_a_empresa_id IS NOT NULL AND eq.prestado_a_empresa_id = ANY($1::int[]))
                  )`;
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
                   td.nombre as tipo_nombre,
                   pr.nombre as proceso_nombre,
                   ${PERIFERICOS_SUBQUERY}
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
            LEFT JOIN procesos pr ON eq.proceso_id = pr.id
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
            fecha_garantia,
            procesador,
            ram,
            disco_duro,
            sistema_operativo,
            garantia,
            especificaciones,
            observaciones,
            piso,
            modulo,
            empresa_id,
            numero_placa,
            sede,
            prestado_a_empresa_id,
            proceso_id,
            perifericos
        } = req.body;

        if (!req.body.es_importacion && ['Dañado', 'Mantenimiento', 'Baja'].includes(estado) && !observaciones?.trim())
            return res.status(400).json({ success: false, message: `El campo Observaciones es obligatorio cuando el estado es "${estado}"` });

        if (tipo_id) {
            const tipoCheck = await pool.query(
                `SELECT categoria FROM tipo_dispositivo WHERE id = $1`, [tipo_id]
            );
            if (tipoCheck.rows.length === 0 || tipoCheck.rows[0].categoria !== 'equipo') {
                return res.status(400).json({ success: false, message: 'El tipo seleccionado no es válido para equipos' });
            }
        }

        // Solo super_admin puede asignar proceso y persona al crear
        const procesoIdCrear   = req.usuario?.rol === 'super_admin' ? (proceso_id || null) : null;
        const asignadoACrear   = req.usuario?.rol === 'super_admin' ? (asignado_a  || '')   : '';

        const fechaGar  = fecha_garantia || null;
        const garantiaVal = garantia || null;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO equipos
                    (codigo, nombre_equipo, tipo_id, marca, modelo, serial, estado,
                     ubicacion, piso, modulo, asignado_a, fecha_garantia, procesador, ram, disco_duro,
                     sistema_operativo, garantia, especificaciones, observaciones,
                     empresa_id, numero_placa, sede, prestado_a_empresa_id, proceso_id, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW())
                 RETURNING *`,
                [
                    req.body.codigo || null, nombre_equipo, tipo_id || null, marca, modelo, serial, estado,
                    ubicacion, piso || null, modulo || null, asignadoACrear, fechaGar, procesador, ram, disco_duro,
                    sistema_operativo, garantiaVal, especificaciones, observaciones || null,
                    empresa_id, numero_placa || null, sede || null, prestado_a_empresa_id || null, procesoIdCrear
                ]
            );
            await guardarPerifericos(client, result.rows[0].id, perifericos);
            await client.query('COMMIT');
            await registrarHistorial(pool, req, 'CREAR', result.rows[0], `Equipo creado: ${serial || nombre_equipo}`);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error en crearEquipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ACTUALIZAR EQUIPO - CON HISTORIAL
// ==========================================
const ESTADOS_BAJA = ['Baja', 'Canibalizar'];
const ROLES_BAJA   = ['super_admin', 'gerencia'];
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
            fecha_garantia,
            procesador,
            ram,
            disco_duro,
            sistema_operativo,
            garantia,
            especificaciones,
            observaciones,
            piso,
            modulo,
            empresa_id,
            numero_placa,
            sede,
            prestado_a_empresa_id,
            proceso_id,
            perifericos
        } = req.body;

        if (!ROLES_BAJA.includes(req.usuario?.rol) && ESTADOS_BAJA.includes(estado))
            return res.status(403).json({ success: false, message: 'Solo el perfil Gerencia puede poner equipos en Baja o Canibalizar' });

        if (!req.body.es_importacion && ['Dañado', 'Mantenimiento', 'Baja', 'Canibalizar'].includes(estado) && !observaciones?.trim())
            return res.status(400).json({ success: false, message: `El campo Observaciones es obligatorio cuando el estado es "${estado}"` });

        // Solo super_admin y soporte pueden modificar proceso y persona asignada
        const ROLES_ASIGNAR = ['super_admin', 'soporte'];
        let procesoIdFinal = proceso_id || null;
        let asignadoAFinal = asignado_a || '';
        if (!ROLES_ASIGNAR.includes(req.usuario?.rol)) {
            const curr = await pool.query(
                'SELECT proceso_id, asignado_a FROM equipos WHERE id = $1 AND eliminado = FALSE', [id]
            );
            if (curr.rows.length > 0) {
                procesoIdFinal = curr.rows[0].proceso_id;
                asignadoAFinal = curr.rows[0].asignado_a || '';
            }
        }

        if (tipo_id) {
            const tipoCheck = await pool.query(
                `SELECT categoria FROM tipo_dispositivo WHERE id = $1`, [tipo_id]
            );
            if (tipoCheck.rows.length === 0 || tipoCheck.rows[0].categoria !== 'equipo') {
                return res.status(400).json({ success: false, message: 'El tipo seleccionado no es válido para equipos' });
            }
        }

        const fechaGar  = fecha_garantia || null;
        const garantiaVal = garantia || null;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `UPDATE equipos SET
                    codigo = $1, nombre_equipo = $2, tipo_id = $3, marca = $4, modelo = $5,
                    serial = $6, estado = $7, ubicacion = $8, piso = $9, modulo = $10,
                    asignado_a = $11, fecha_garantia = $12, procesador = $13, ram = $14,
                    disco_duro = $15, sistema_operativo = $16, garantia = $17,
                    especificaciones = $18, observaciones = $19, empresa_id = $20,
                    numero_placa = $21, sede = $22, prestado_a_empresa_id = $23, proceso_id = $24
                 WHERE id = $25 AND eliminado = FALSE
                 RETURNING *`,
                [
                    req.body.codigo || null, nombre_equipo, tipo_id || null, marca, modelo, serial, estado,
                    ubicacion, piso || null, modulo || null, asignadoAFinal, fechaGar, procesador, ram,
                    disco_duro, sistema_operativo, garantiaVal, especificaciones, observaciones || null,
                    empresa_id, numero_placa || null, sede || null, prestado_a_empresa_id || null,
                    procesoIdFinal, id
                ]
            );
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
            }
            await guardarPerifericos(client, id, perifericos);
            await client.query('COMMIT');
            await registrarHistorial(pool, req, 'EDITAR', result.rows[0], `Equipo editado: ${serial || nombre_equipo}`);
            res.json({ success: true, data: result.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error en actualizarEquipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// OBTENER EQUIPO POR ID (con periféricos)
// ==========================================
const getEquipoById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT eq.*, e.nombre as empresa_nombre,
                    td.nombre as tipo_nombre,
                    pr.nombre as proceso_nombre,
                    ${PERIFERICOS_SUBQUERY}
             FROM equipos eq
             JOIN empresas e ON eq.empresa_id = e.id
             LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
             LEFT JOIN procesos pr ON eq.proceso_id = pr.id
             WHERE eq.id = $1 AND eq.eliminado = FALSE`,
            [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// REASIGNAR PERIFÉRICOS AL DAR DE BAJA
// ==========================================
const reasignarPerifericos = async (req, res) => {
    try {
        const { id } = req.params;
        const { destino_equipo_id, perifericos_ids } = req.body;

        if (!destino_equipo_id)
            return res.status(400).json({ success: false, message: 'El equipo destino es requerido' });
        if (String(id) === String(destino_equipo_id))
            return res.status(400).json({ success: false, message: 'El equipo destino debe ser diferente al origen' });

        const destCheck = await pool.query(
            'SELECT id FROM equipos WHERE id = $1 AND eliminado = FALSE', [destino_equipo_id]
        );
        if (destCheck.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Equipo destino no encontrado' });

        let result;
        if (Array.isArray(perifericos_ids) && perifericos_ids.length > 0) {
            result = await pool.query(
                `UPDATE perifericos SET equipo_id = $1
                 WHERE equipo_id = $2 AND id = ANY($3::int[]) RETURNING id`,
                [destino_equipo_id, id, perifericos_ids]
            );
        } else {
            result = await pool.query(
                `UPDATE perifericos SET equipo_id = $1 WHERE equipo_id = $2 RETURNING id`,
                [destino_equipo_id, id]
            );
        }

        res.json({ success: true, message: `${result.rowCount} periférico(s) reasignado(s) correctamente` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getEquipos,
    getEquiposByEmpresa,
    getEquipoById,
    crearEquipo,
    actualizarEquipo,
    reasignarPerifericos
};