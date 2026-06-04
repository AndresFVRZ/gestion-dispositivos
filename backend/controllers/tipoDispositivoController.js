const pool = require('../config/db');

const CATEGORIAS_VALIDAS = ['equipo', 'periferico'];

const getTipos = async (req, res) => {
    try {
        const { categoria } = req.query;
        const query = categoria
            ? `SELECT * FROM tipo_dispositivo WHERE categoria = $1 ORDER BY nombre`
            : `SELECT * FROM tipo_dispositivo ORDER BY categoria, nombre`;
        const params = categoria ? [categoria] : [];
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const crearTipo = async (req, res) => {
    try {
        const { nombre, categoria, descripcion } = req.body;
        if (!nombre?.trim() || !categoria)
            return res.status(400).json({ success: false, message: 'Nombre y categoría son requeridos' });
        if (!CATEGORIAS_VALIDAS.includes(categoria))
            return res.status(400).json({ success: false, message: `Categoría debe ser: ${CATEGORIAS_VALIDAS.join(' o ')}` });

        const result = await pool.query(
            `INSERT INTO tipo_dispositivo (nombre, categoria, descripcion) VALUES ($1, $2, $3) RETURNING *`,
            [nombre.trim(), categoria, descripcion || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const eliminarTipo = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tipo_dispositivo WHERE id = $1', [id]);
        res.json({ success: true, message: 'Tipo eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getTipos, crearTipo, eliminarTipo };
