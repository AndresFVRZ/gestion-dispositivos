const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET - Obtener todos los usuarios con sus empresas asignadas
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.nombre, u.email, u.estado,
             r.nombre as rol,
             COALESCE(
                 (SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre))
                  FROM usuario_empresas ue
                  JOIN empresas e ON ue.empresa_id = e.id
                  WHERE ue.usuario_id = u.id), '[]'
             ) as empresas
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.estado = 'activo'
      ORDER BY u.id
    `);

    const usuarios = result.rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol || 'visualizador',
      empresas: u.empresas || [],
      empresas_ids: (u.empresas || []).map(e => e.id)
    }));

    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error GET /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Crear usuario
router.post('/', async (req, res) => {
  const { nombre, email, password, rol, empresas_ids } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const emailCheck = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const rolNombre = rol || 'visualizador';
    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: `Rol "${rolNombre}" no existe` });
    }
    const rolId = rolResult.rows[0].id;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id, rol, estado)
       VALUES ($1, $2, $3, $4, $5, 'activo')
       RETURNING id`,
      [nombre, email, hashedPassword, rolId, rolNombre]
    );

    const userId = result.rows[0].id;

    if (empresas_ids && empresas_ids.length > 0 && rolNombre !== 'super_admin') {
      for (const empresaId of empresas_ids) {
        await db.query(
          `INSERT INTO usuario_empresas (usuario_id, empresa_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, empresaId]
        );
      }
    }

    res.json({ success: true, message: 'Usuario creado exitosamente', id: userId });
  } catch (error) {
    console.error('Error en POST /usuarios:', error.message);
    res.status(500).json({ success: false, message: 'Error al crear usuario: ' + error.message });
  }
});

// PUT - Actualizar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol, empresas_ids } = req.body;

  try {
    const rolNombre = rol || 'visualizador';
    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: `Rol "${rolNombre}" no existe` });
    }
    const rolId = rolResult.rows[0].id;

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE usuarios SET nombre=$1, email=$2, password_hash=$3, rol_id=$4, rol=$5 WHERE id=$6`,
        [nombre, email, hashedPassword, rolId, rolNombre, id]
      );
    } else {
      await db.query(
        `UPDATE usuarios SET nombre=$1, email=$2, rol_id=$3, rol=$4 WHERE id=$5`,
        [nombre, email, rolId, rolNombre, id]
      );
    }

    if (empresas_ids !== undefined) {
      await db.query('DELETE FROM usuario_empresas WHERE usuario_id = $1', [id]);
      if (rolNombre !== 'super_admin' && empresas_ids.length > 0) {
        for (const empresaId of empresas_ids) {
          await db.query(
            `INSERT INTO usuario_empresas (usuario_id, empresa_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, empresaId]
          );
        }
      }
    }

    res.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error PUT /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE - Soft delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM usuario_empresas WHERE usuario_id = $1', [id]);
    await db.query('UPDATE usuarios SET estado=$1 WHERE id=$2', ['inactivo', id]);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error DELETE /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
