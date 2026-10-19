const pool = require('../config/db');
const { registrarAuditoria } = require('../utils/helpers');
const {
    GARANTIAS,
    DIAS_GARANTIA_VALIDOS,
    ESTADOS_GARANTIA,
    GARANTIA_FIN_SQL,
    GARANTIA_ESTADO_SQL,
    ESTADOS,
    ESTADOS_VALIDOS,
    ESTADOS_CON_OBSERVACIONES,
    RAM_ESTANDAR_GB,
    ramGb,
    normalizarRam,
    FAMILIAS_PROCESADOR,
    normalizarProcesador,
    familiaProcesador,
} = require('../utils/catalogos');

// Columnas calculadas de garantía que acompañan a cada equipo
const GARANTIA_COLUMNAS = `
    DATE_FORMAT(${GARANTIA_FIN_SQL}, '%Y-%m-%d') AS garantia_fecha_fin,
    ${GARANTIA_ESTADO_SQL} AS garantia_estado`;

// "1,2,3" o ["1","2"] → ['1','2','3']
const parseLista = (valor) => {
    if (valor === undefined || valor === null || valor === '') return [];
    const partes = Array.isArray(valor) ? valor : String(valor).split(',');
    return partes.map(v => String(v).trim()).filter(Boolean);
};

// Campos derivados de RAM y procesador para filtros y tarjetas de la UI
const enriquecerEquipos = (rows) => {
    for (const r of rows) {
        r.ram_gb = ramGb(r.ram);
        r.procesador_familia = familiaProcesador(r.procesador);
    }
    return rows;
};

// Valida estado y garantía y normaliza RAM / procesador antes de guardar.
// `garantiaActual` permite conservar garantías antiguas fuera de catálogo al editar.
const prepararCamposEquipo = (body, { garantiaActual = null } = {}) => {
    const advertencias = [];

    if (body.estado && !ESTADOS_VALIDOS.includes(body.estado))
        return { error: `Estado no válido: "${body.estado}". Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` };

    let garantia = body.garantia === '' || body.garantia === undefined ? null : body.garantia;
    if (garantia !== null) {
        const dias = Number(garantia);
        const esAntigua = garantiaActual !== null && dias === Number(garantiaActual);
        if (!DIAS_GARANTIA_VALIDOS.includes(dias) && !esAntigua) {
            if (!body.es_importacion)
                return { error: `Garantía no válida. Opciones: ${GARANTIAS.map(g => `${g.label} (${g.dias} días)`).join(', ')}` };
            advertencias.push(`Garantía "${garantia}" no reconocida: se guardó sin garantía`);
            garantia = null;
        } else {
            garantia = dias;
        }
    }

    return {
        garantia,
        ram: normalizarRam(body.ram),
        procesador: normalizarProcesador(body.procesador),
        advertencias,
    };
};

// Adjunta el arreglo `perifericos` a uno o varios equipos con una sola consulta.
// Reemplaza al json_agg/json_build_object de PostgreSQL (no está en MariaDB 10.4).
// `runner` puede ser el pool o un client de transacción.
const attachPerifericos = async (rows, runner = pool) => {
    if (!rows.length) return rows;
    const ids = rows.map(r => r.id);
    const { rows: peris } = await runner.query(
        `SELECT p.equipo_id,
                p.id, p.tipo_id, td.nombre AS tipo_nombre,
                p.marca, p.modelo, p.serial, p.descripcion
         FROM perifericos p
         LEFT JOIN tipo_dispositivo td ON td.id = p.tipo_id
         WHERE p.equipo_id IN (?)
         ORDER BY p.id`,
        [ids]
    );
    const map = new Map();
    for (const p of peris) {
        if (!map.has(p.equipo_id)) map.set(p.equipo_id, []);
        map.get(p.equipo_id).push({
            id: p.id,
            tipo_id: p.tipo_id,
            tipo_nombre: p.tipo_nombre,
            marca: p.marca,
            modelo: p.modelo,
            serial: p.serial,
            descripcion: p.descripcion,
        });
    }
    for (const r of rows) r.perifericos = map.get(r.id) || [];
    return rows;
};

// Guarda (borra y re-inserta) los periféricos de un equipo.
// Solo acepta tipo_id cuya categoria='periferico' en tipo_dispositivo.
const guardarPerifericos = async (client, equipoId, perifericos) => {
    if (!Array.isArray(perifericos)) return;

    await client.query('DELETE FROM perifericos WHERE equipo_id = ?', [equipoId]);

    const tiposIds = [...new Set(perifericos.map(p => p?.tipo_id).filter(Boolean))];
    let tiposValidos = new Set();
    if (tiposIds.length > 0) {
        const check = await client.query(
            `SELECT id FROM tipo_dispositivo WHERE id IN (?) AND categoria = 'periferico'`,
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
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [equipoId, tipo_id, marca, modelo, serial, descripcion]
            );
        }
    }
};

// GET /api/equipos
// Filtros opcionales por query string (los de lista aceptan varios valores separados por coma):
//   tipo_id, estado, empresa_id, sede_id, proceso_id, garantia (vigente|proxima|critica|vencida|sin_garantia),
//   ram (GB: "8" o "8 GB"), procesador_familia ("Intel Core i5"), procesador (texto), q (búsqueda libre)
const getEquipos = async (req, res) => {
    try {
        const usuario = req.usuario;

        if (!usuario) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        const f = req.query;
        const tipos      = parseLista(f.tipo_id);
        const estados    = parseLista(f.estado);
        const empresas   = parseLista(f.empresa_id);
        const sedes      = parseLista(f.sede_id);
        const procesos   = parseLista(f.proceso_id);
        const garantias  = parseLista(f.garantia);
        const rams       = parseLista(f.ram).map(ramGb).filter(Boolean);
        const familias   = parseLista(f.procesador_familia).map(v => v.toLowerCase());

        const estadosInvalidos = estados.filter(e => !ESTADOS_VALIDOS.includes(e));
        if (estadosInvalidos.length)
            return res.status(400).json({ success: false, message: `Estado no válido: ${estadosInvalidos.join(', ')}` });
        const codigosGarantia = ESTADOS_GARANTIA.map(g => g.codigo);
        const garantiasInvalidas = garantias.filter(g => !codigosGarantia.includes(g));
        if (garantiasInvalidas.length)
            return res.status(400).json({ success: false, message: `Filtro de garantía no válido: ${garantiasInvalidas.join(', ')}. Opciones: ${codigosGarantia.join(', ')}` });

        let query = `
            SELECT eq.*, e.nombre as empresa_nombre,
                   td.nombre as tipo_nombre,
                   ep.nombre as prestado_a_nombre,
                   pr.nombre as proceso_nombre,
                   ${GARANTIA_COLUMNAS}
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
                    eq.empresa_id IN (?)
                    OR
                    (eq.prestado_a_empresa_id IS NOT NULL AND eq.prestado_a_empresa_id IN (?))
                  )`;
                params.push(empresaIds, empresaIds);
            } else {
                return res.json({ success: true, data: [] });
            }
        }

        if (tipos.length)    { query += ` AND eq.tipo_id IN (?)`;    params.push(tipos); }
        if (estados.length)  { query += ` AND eq.estado IN (?)`;     params.push(estados); }
        if (sedes.length)    { query += ` AND eq.sede_id IN (?)`;    params.push(sedes); }
        if (procesos.length) { query += ` AND eq.proceso_id IN (?)`; params.push(procesos); }
        if (empresas.length) {
            // Igual que la vista por empresa del frontend: propios + prestados a esa empresa
            query += ` AND (eq.empresa_id IN (?) OR eq.prestado_a_empresa_id IN (?))`;
            params.push(empresas, empresas);
        }
        if (garantias.length) { query += ` AND (${GARANTIA_ESTADO_SQL}) IN (?)`; params.push(garantias); }
        if (f.procesador?.trim()) {
            query += ` AND eq.procesador LIKE ?`;
            params.push(`%${normalizarProcesador(f.procesador)}%`);
        }
        if (f.q?.trim()) {
            const like = `%${f.q.trim()}%`;
            query += ` AND (eq.codigo LIKE ? OR eq.nombre_equipo LIKE ? OR eq.serial LIKE ?
                           OR eq.asignado_a LIKE ? OR eq.numero_placa LIKE ? OR eq.marca LIKE ? OR eq.modelo LIKE ?)`;
            params.push(like, like, like, like, like, like, like);
        }

        query += ` ORDER BY e.nombre, td.nombre, eq.codigo`;
        const result = await pool.query(query, params);
        let equipos = enriquecerEquipos(result.rows);

        // RAM y familia de procesador son texto libre en la BD: se filtran ya normalizados
        if (rams.length)     equipos = equipos.filter(eq => rams.includes(eq.ram_gb));
        if (familias.length) equipos = equipos.filter(eq => familias.includes((eq.procesador_familia || '').toLowerCase()));

        await attachPerifericos(equipos);
        res.json({ success: true, data: equipos, total: equipos.length });
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
                   ${GARANTIA_COLUMNAS}
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
            LEFT JOIN procesos pr ON eq.proceso_id = pr.id
            WHERE eq.empresa_id = ? AND eq.eliminado = FALSE
            ORDER BY td.nombre, eq.nombre_equipo
        `;
        const result = await pool.query(query, [empresaId]);
        enriquecerEquipos(result.rows);
        await attachPerifericos(result.rows);
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

        if (!req.body.es_importacion && ESTADOS_CON_OBSERVACIONES.includes(estado) && !observaciones?.trim())
            return res.status(400).json({ success: false, message: `El campo Observaciones es obligatorio cuando el estado es "${estado}"` });

        const campos = prepararCamposEquipo(req.body);
        if (campos.error) return res.status(400).json({ success: false, message: campos.error });

        if (tipo_id) {
            const tipoCheck = await pool.query(
                `SELECT categoria FROM tipo_dispositivo WHERE id = ?`, [tipo_id]
            );
            if (tipoCheck.rows.length === 0 || tipoCheck.rows[0].categoria !== 'equipo') {
                return res.status(400).json({ success: false, message: 'El tipo seleccionado no es válido para equipos' });
            }
        }

        // Solo super_admin puede asignar proceso y persona al crear
        const procesoIdCrear   = req.usuario?.rol === 'super_admin' ? (proceso_id || null) : null;
        const asignadoACrear   = req.usuario?.rol === 'super_admin' ? (asignado_a  || '')   : '';

        const fechaGar  = fecha_garantia || null;
        const garantiaVal = campos.garantia;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const ins = await client.query(
                `INSERT INTO equipos
                    (codigo, nombre_equipo, tipo_id, marca, modelo, serial, estado,
                     ubicacion, piso, modulo, asignado_a, fecha_garantia, procesador, ram, disco_duro,
                     sistema_operativo, garantia, especificaciones, observaciones,
                     empresa_id, numero_placa, sede, prestado_a_empresa_id, proceso_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    req.body.codigo || null, nombre_equipo, tipo_id || null, marca, modelo, serial, estado,
                    ubicacion, piso || null, modulo || null, asignadoACrear, fechaGar, campos.procesador, campos.ram, disco_duro,
                    sistema_operativo, garantiaVal, especificaciones, observaciones || null,
                    empresa_id, numero_placa || null, sede || null, prestado_a_empresa_id || null, procesoIdCrear
                ]
            );
            const sel = await client.query(`SELECT * FROM equipos WHERE id = ?`, [ins.insertId]);
            const equipo = sel.rows[0];
            await guardarPerifericos(client, equipo.id, perifericos);
            await client.query('COMMIT');
            await registrarAuditoria(pool, req, 'CREAR', equipo, `Equipo creado: ${serial || nombre_equipo}`);
            res.status(201).json({ success: true, data: enriquecerEquipos([equipo])[0], advertencias: campos.advertencias });
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

        if (!req.body.es_importacion && ESTADOS_CON_OBSERVACIONES.includes(estado) && !observaciones?.trim())
            return res.status(400).json({ success: false, message: `El campo Observaciones es obligatorio cuando el estado es "${estado}"` });

        const actual = await pool.query('SELECT garantia FROM equipos WHERE id = ? AND eliminado = FALSE', [id]);
        const campos = prepararCamposEquipo(req.body, { garantiaActual: actual.rows[0]?.garantia ?? null });
        if (campos.error) return res.status(400).json({ success: false, message: campos.error });

        // Solo super_admin y soporte pueden modificar proceso y persona asignada
        const ROLES_ASIGNAR = ['super_admin', 'soporte'];
        let procesoIdFinal = proceso_id || null;
        let asignadoAFinal = asignado_a || '';
        if (!ROLES_ASIGNAR.includes(req.usuario?.rol)) {
            const curr = await pool.query(
                'SELECT proceso_id, asignado_a FROM equipos WHERE id = ? AND eliminado = FALSE', [id]
            );
            if (curr.rows.length > 0) {
                procesoIdFinal = curr.rows[0].proceso_id;
                asignadoAFinal = curr.rows[0].asignado_a || '';
            }
        }

        if (tipo_id) {
            const tipoCheck = await pool.query(
                `SELECT categoria FROM tipo_dispositivo WHERE id = ?`, [tipo_id]
            );
            if (tipoCheck.rows.length === 0 || tipoCheck.rows[0].categoria !== 'equipo') {
                return res.status(400).json({ success: false, message: 'El tipo seleccionado no es válido para equipos' });
            }
        }

        const fechaGar  = fecha_garantia || null;
        const garantiaVal = campos.garantia;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE equipos SET
                    codigo = ?, nombre_equipo = ?, tipo_id = ?, marca = ?, modelo = ?,
                    serial = ?, estado = ?, ubicacion = ?, piso = ?, modulo = ?,
                    asignado_a = ?, fecha_garantia = ?, procesador = ?, ram = ?,
                    disco_duro = ?, sistema_operativo = ?, garantia = ?,
                    especificaciones = ?, observaciones = ?, empresa_id = ?,
                    numero_placa = ?, sede = ?, prestado_a_empresa_id = ?, proceso_id = ?
                 WHERE id = ? AND eliminado = FALSE`,
                [
                    req.body.codigo || null, nombre_equipo, tipo_id || null, marca, modelo, serial, estado,
                    ubicacion, piso || null, modulo || null, asignadoAFinal, fechaGar, campos.procesador, campos.ram,
                    disco_duro, sistema_operativo, garantiaVal, especificaciones, observaciones || null,
                    empresa_id, numero_placa || null, sede || null, prestado_a_empresa_id || null,
                    procesoIdFinal, id
                ]
            );
            const sel = await client.query(`SELECT * FROM equipos WHERE id = ? AND eliminado = FALSE`, [id]);
            if (sel.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
            }
            const equipo = sel.rows[0];
            await guardarPerifericos(client, id, perifericos);
            await client.query('COMMIT');
            await registrarAuditoria(pool, req, 'EDITAR', equipo, `Equipo editado: ${serial || nombre_equipo}`);
            res.json({ success: true, data: enriquecerEquipos([equipo])[0], advertencias: campos.advertencias });
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
// OPCIONES PARA FORMULARIOS Y FILTROS
// GET /api/equipos/opciones
// ==========================================
const getOpciones = async (req, res) => {
    try {
        const [tipos, rams, procesadores] = await Promise.all([
            pool.query(`SELECT id, nombre, categoria, descripcion FROM tipo_dispositivo ORDER BY nombre`),
            pool.query(`SELECT DISTINCT ram FROM equipos WHERE eliminado = FALSE AND ram IS NOT NULL AND ram <> ''`),
            pool.query(`SELECT DISTINCT procesador FROM equipos WHERE eliminado = FALSE AND procesador IS NOT NULL AND procesador <> ''`),
        ]);

        // RAM: estándar + lo que exista en los equipos, ya normalizado y sin repetir
        const gbSet = new Set(RAM_ESTANDAR_GB);
        for (const r of rams.rows) {
            const gb = ramGb(r.ram);
            if (gb) gbSet.add(gb);
        }
        const ram = [...gbSet].sort((a, b) => a - b).map(gb => ({ gb, label: `${gb} GB` }));

        // Procesador: familias conocidas + las detectadas, y valores existentes para autocompletar
        const valoresProc = [...new Set(procesadores.rows.map(p => normalizarProcesador(p.procesador)))].sort();
        const familias = new Set(FAMILIAS_PROCESADOR);
        for (const p of valoresProc) familias.add(familiaProcesador(p));

        res.json({
            success: true,
            data: {
                garantias: GARANTIAS,
                estados_garantia: ESTADOS_GARANTIA,
                estados: ESTADOS,
                tipos: {
                    equipo:     tipos.rows.filter(t => t.categoria === 'equipo'),
                    periferico: tipos.rows.filter(t => t.categoria === 'periferico'),
                },
                ram,
                procesador: {
                    familias: [...familias],
                    valores: valoresProc,
                },
            },
        });
    } catch (error) {
        console.error('Error en getOpciones:', error);
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
                    ${GARANTIA_COLUMNAS}
             FROM equipos eq
             JOIN empresas e ON eq.empresa_id = e.id
             LEFT JOIN tipo_dispositivo td ON eq.tipo_id = td.id
             LEFT JOIN procesos pr ON eq.proceso_id = pr.id
             WHERE eq.id = ? AND eq.eliminado = FALSE`,
            [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
        enriquecerEquipos(result.rows);
        await attachPerifericos(result.rows);
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
            'SELECT id FROM equipos WHERE id = ? AND eliminado = FALSE', [destino_equipo_id]
        );
        if (destCheck.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Equipo destino no encontrado' });

        let result;
        if (Array.isArray(perifericos_ids) && perifericos_ids.length > 0) {
            result = await pool.query(
                `UPDATE perifericos SET equipo_id = ?
                 WHERE equipo_id = ? AND id IN (?)`,
                [destino_equipo_id, id, perifericos_ids]
            );
        } else {
            result = await pool.query(
                `UPDATE perifericos SET equipo_id = ? WHERE equipo_id = ?`,
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
    getOpciones,
    getEquiposByEmpresa,
    getEquipoById,
    crearEquipo,
    actualizarEquipo,
    reasignarPerifericos
};
