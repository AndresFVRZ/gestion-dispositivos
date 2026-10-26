const pool = require('../config/db');

const CATEGORIAS_VALIDAS = ['equipo', 'periferico'];

const getTipos = async (req, res) => {
    try {
        const { categoria } = req.query;
        const query = categoria
            ? `SELECT * FROM tipo_dispositivo WHERE categoria = ? ORDER BY nombre`
            : `SELECT * FROM tipo_dispositivo ORDER BY categoria, nombre`;
        const params = categoria ? [categoria] : [];
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const crearTipo = async (req, res) => {
    try {
        const { nombre, categoria, descripcion } = req.body;
        if (!nombre?.trim() || !categoria)
            return res.status(400).json({ success: false, message: 'Nombre y categoría son requeridos' });
        if (!CATEGORIAS_VALIDAS.includes(categoria))
            return res.status(400).json({ success: false, message: `Categoría debe ser: ${CATEGORIAS_VALIDAS.join(' o ')}` });

        const ins = await pool.query(
            `INSERT INTO tipo_dispositivo (nombre, categoria, descripcion) VALUES (?, ?, ?)`,
            [nombre.trim(), categoria, descripcion || null]
        );
        const sel = await pool.query('SELECT * FROM tipo_dispositivo WHERE id = ?', [ins.insertId]);
        res.status(201).json({ success: true, data: sel.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const eliminarTipo = async (req, res) => {
    try {
        const { id } = req.params;

        const enUso = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM equipos    WHERE tipo_id = ?) +
                (SELECT COUNT(*) FROM perifericos WHERE tipo_id = ?) AS total`,
            [id, id]
        );
        if (Number(enUso.rows[0].total) > 0)
            return res.status(409).json({ success: false, message: 'No se puede eliminar: el tipo está en uso por equipos o periféricos' });

        const result = await pool.query('DELETE FROM tipo_dispositivo WHERE id = ?', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, message: 'Tipo no encontrado' });

        res.json({ success: true, message: 'Tipo eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = { getTipos, crearTipo, eliminarTipo };
