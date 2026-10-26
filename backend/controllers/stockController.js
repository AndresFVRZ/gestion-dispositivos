const pool = require('../config/db');

// Empresas que puede ver el usuario (null = todas, super_admin)
const empresasVisibles = (usuario) =>
    usuario.rol === 'super_admin' ? null : (usuario.empresas || []).map(e => Number(e.id));

// Verifica que la sede exista y sea visible para el usuario
const sedePermitida = async (usuario, sedeId) => {
    const r = await pool.query('SELECT id, empresa_id FROM sedes WHERE id = ?', [sedeId]);
    if (r.rows.length === 0) return { error: 'Sede no encontrada', status: 404 };
    const visibles = empresasVisibles(usuario);
    if (visibles && !visibles.includes(r.rows[0].empresa_id))
        return { error: 'No tienes acceso a esta sede', status: 403 };
    return { sede: r.rows[0] };
};

const SELECT_STOCK = `
    SELECT sp.*, s.nombre AS sede_nombre, s.empresa_id, e.nombre AS empresa_nombre,
           (sp.cantidad <= sp.stock_minimo) AS bajo_minimo
    FROM stock_partes sp
    JOIN sedes s ON s.id = sp.sede_id
    JOIN empresas e ON e.id = s.empresa_id`;

const getParteVisible = async (usuario, id) => {
    const r = await pool.query(`${SELECT_STOCK} WHERE sp.id = ?`, [id]);
    if (r.rows.length === 0) return { error: 'Parte no encontrada', status: 404 };
    const visibles = empresasVisibles(usuario);
    if (visibles && !visibles.includes(r.rows[0].empresa_id))
        return { error: 'No tienes acceso a esta parte', status: 403 };
    return { parte: r.rows[0] };
};

const enteroNoNegativo = (v) => Number.isInteger(Number(v)) && Number(v) >= 0;

// ==========================================
// GET /api/stock?sede_id=&empresa_id=&categoria=&q=&bajo_minimo=1
// ==========================================
const getStock = async (req, res) => {
    try {
        const { sede_id, empresa_id, categoria, q, bajo_minimo } = req.query;
        let query = `${SELECT_STOCK} WHERE 1=1`;
        const params = [];

        const visibles = empresasVisibles(req.usuario);
        if (visibles) {
            if (visibles.length === 0) return res.json({ success: true, data: [] });
            query += ' AND s.empresa_id IN (?)';
            params.push(visibles);
        }
        if (sede_id)    { query += ' AND sp.sede_id = ?';    params.push(sede_id); }
        if (empresa_id) { query += ' AND s.empresa_id = ?';  params.push(empresa_id); }
        if (categoria)  { query += ' AND sp.categoria = ?';  params.push(categoria); }
        if (bajo_minimo === '1' || bajo_minimo === 'true') query += ' AND sp.cantidad <= sp.stock_minimo';
        if (q?.trim()) {
            const like = `%${q.trim()}%`;
            query += ' AND (sp.nombre LIKE ? OR sp.marca LIKE ? OR sp.modelo LIKE ? OR sp.descripcion LIKE ?)';
            params.push(like, like, like, like);
        }
        query += ' ORDER BY e.nombre, s.nombre, sp.categoria, sp.nombre';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error getStock:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// POST /api/stock
// ==========================================
const crearParte = async (req, res) => {
    try {
        const { sede_id, nombre, categoria, marca, modelo, descripcion, cantidad = 0, stock_minimo = 0 } = req.body;
        if (!sede_id || !nombre?.trim())
            return res.status(400).json({ success: false, message: 'Sede y nombre son requeridos' });
        if (!enteroNoNegativo(cantidad) || !enteroNoNegativo(stock_minimo))
            return res.status(400).json({ success: false, message: 'Cantidad y stock mínimo deben ser enteros mayores o iguales a 0' });

        const sede = await sedePermitida(req.usuario, sede_id);
        if (sede.error) return res.status(sede.status).json({ success: false, message: sede.error });

        const ins = await pool.query(
            `INSERT INTO stock_partes (sede_id, nombre, categoria, marca, modelo, descripcion, cantidad, stock_minimo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sede_id, nombre.trim(), categoria?.trim() || null, marca?.trim() || '', modelo?.trim() || '',
             descripcion?.trim() || null, Number(cantidad), Number(stock_minimo)]
        );
        const { parte } = await getParteVisible(req.usuario, ins.insertId);
        res.status(201).json({ success: true, data: parte });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ success: false, message: 'Ya existe esa parte (mismo nombre, marca y modelo) en la sede' });
        console.error('Error crearParte:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// PUT /api/stock/:id  — datos de la parte (la cantidad se cambia con /ajustar)
// ==========================================
const actualizarParte = async (req, res) => {
    try {
        const { id } = req.params;
        const actual = await getParteVisible(req.usuario, id);
        if (actual.error) return res.status(actual.status).json({ success: false, message: actual.error });

        const p = actual.parte;
        const { sede_id = p.sede_id, nombre = p.nombre, categoria = p.categoria, marca = p.marca,
                modelo = p.modelo, descripcion = p.descripcion, stock_minimo = p.stock_minimo } = req.body;

        if (!nombre?.trim())
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        if (!enteroNoNegativo(stock_minimo))
            return res.status(400).json({ success: false, message: 'El stock mínimo debe ser un entero mayor o igual a 0' });
        if (Number(sede_id) !== p.sede_id) {
            const sede = await sedePermitida(req.usuario, sede_id);
            if (sede.error) return res.status(sede.status).json({ success: false, message: sede.error });
        }

        await pool.query(
            `UPDATE stock_partes SET sede_id = ?, nombre = ?, categoria = ?, marca = ?, modelo = ?,
                                     descripcion = ?, stock_minimo = ?
             WHERE id = ?`,
            [sede_id, nombre.trim(), categoria?.trim() || null, marca?.trim() || '', modelo?.trim() || '',
             descripcion?.trim() || null, Number(stock_minimo), id]
        );
        const { parte } = await getParteVisible(req.usuario, id);
        res.json({ success: true, data: parte });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ success: false, message: 'Ya existe esa parte (mismo nombre, marca y modelo) en la sede' });
        console.error('Error actualizarParte:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// PATCH /api/stock/:id/ajustar  { cantidad: +n | -n }
// Suma o resta de forma atómica; nunca deja la cantidad en negativo.
// ==========================================
const ajustarCantidad = async (req, res) => {
    try {
        const { id } = req.params;
        const delta = Number(req.body.cantidad);
        if (!Number.isInteger(delta) || delta === 0)
            return res.status(400).json({ success: false, message: 'La cantidad a ajustar debe ser un entero distinto de 0' });

        const actual = await getParteVisible(req.usuario, id);
        if (actual.error) return res.status(actual.status).json({ success: false, message: actual.error });

        const upd = await pool.query(
            'UPDATE stock_partes SET cantidad = cantidad + ? WHERE id = ? AND cantidad + ? >= 0',
            [delta, id, delta]
        );
        if (upd.rowCount === 0)
            return res.status(400).json({ success: false, message: `Stock insuficiente: hay ${actual.parte.cantidad} unidad(es)` });

        const { parte } = await getParteVisible(req.usuario, id);
        res.json({ success: true, data: parte });
    } catch (error) {
        console.error('Error ajustarCantidad:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// DELETE /api/stock/:id
// ==========================================
const eliminarParte = async (req, res) => {
    try {
        const actual = await getParteVisible(req.usuario, req.params.id);
        if (actual.error) return res.status(actual.status).json({ success: false, message: actual.error });
        await pool.query('DELETE FROM stock_partes WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Parte eliminada' });
    } catch (error) {
        console.error('Error eliminarParte:', error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = { getStock, crearParte, actualizarParte, ajustarCantidad, eliminarParte };
