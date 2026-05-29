const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET - Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, nombre, email, rol, empresa_id, estado 
      FROM usuarios 
      WHERE estado = 'activo'
    `);

    const usuarios = result.rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol || 'visualizador',
      empresas_ids: u.empresa_id ? [u.empresa_id] : [],
      empresas: []
    }));

    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error GET /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Crear usuario
router.post('/', async (req, res) => {
  console.log('📥 POST /usuarios - Body recibido:', req.body);

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
    const empresaId = empresas_ids && empresas_ids.length > 0 ? empresas_ids[0] : null;

    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id, empresa_id, estado, rol) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [nombre, email, hashedPassword, rolId, empresaId, 'activo', rolNombre]
    );

    console.log('✅ Usuario creado con ID:', result.rows[0].id);
    res.json({ success: true, message: 'Usuario creado exitosamente', id: result.rows[0].id });

  } catch (error) {
    console.error('❌ Error en POST /usuarios:', error.message);
    res.status(500).json({ success: false, message: 'Error al crear usuario: ' + error.message });
  }
});

// PUT - Actualizar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol, empresas_ids } = req.body;
  console.log('📥 PUT /usuarios/:id - Body:', req.body);

  try {
    const rolNombre = rol || 'visualizador';
    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);

    if (rolResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: `Rol "${rolNombre}" no existe` });
    }

    const rolId = rolResult.rows[0].id;
    const empresaId = empresas_ids && empresas_ids.length > 0 ? empresas_ids[0] : null;

    // ← fix: password vacío no se toma como cambio de contraseña
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE usuarios SET nombre=$1, email=$2, password_hash=$3, rol_id=$4, rol=$5, empresa_id=$6 
         WHERE id=$7`,
        [nombre, email, hashedPassword, rolId, rolNombre, empresaId, id]
      );
    } else {
      await db.query(
        `UPDATE usuarios SET nombre=$1, email=$2, rol_id=$3, rol=$4, empresa_id=$5 
         WHERE id=$6`,
        [nombre, email, rolId, rolNombre, empresaId, id]
      );
    }

    console.log('✅ Usuario actualizado:', id);
    res.json({ success: true, message: 'Usuario actualizado exitosamente' });

  } catch (error) {
    console.error('❌ Error PUT:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE - Soft delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE usuarios SET estado=$1 WHERE id=$2', ['inactivo', id]);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error DELETE:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;