const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.nombre, u.email, u.estado, r.nombre as rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.estado = 'activo'
    `);
    
    const usuarios = result.rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol || 'visualizador',
      empresas_ids: [],
      empresas: []
    }));
    
    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error GET /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  const { nombre, email, password, rol, empresas_ids } = req.body;
  
  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Obtener rol_id según el nombre del rol
    let rolId = 3;
    if (rol === 'super_admin') rolId = 1;
    else if (rol === 'gestion') rolId = 2;
    else if (rol === 'visualizador') rolId = 3;
    
    const empresaId = (empresas_ids && empresas_ids.length > 0) ? empresas_ids[0] : null;
    
    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id, empresa_id, estado) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nombre, email, hashedPassword, rolId, empresaId, 'activo']
    );
    
    const usuarioId = result.rows[0].id;
    
    res.json({ success: true, message: 'Usuario creado exitosamente', id: usuarioId });
  } catch (error) {
    console.error('Error en POST /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol, empresas_ids } = req.body;
  
  try {
    // Obtener rol_id según el nombre del rol
    let rolId = 3;
    if (rol === 'super_admin') rolId = 1;
    else if (rol === 'gestion') rolId = 2;
    else if (rol === 'visualizador') rolId = 3;
    
    const empresaId = (empresas_ids && empresas_ids.length > 0) ? empresas_ids[0] : null;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE usuarios SET nombre = $1, email = $2, password_hash = $3, rol_id = $4, empresa_id = $5 
         WHERE id = $6`,
        [nombre, email, hashedPassword, rolId, empresaId, id]
      );
    } else {
      await db.query(
        `UPDATE usuarios SET nombre = $1, email = $2, rol_id = $3, empresa_id = $4 
         WHERE id = $5`,
        [nombre, email, rolId, empresaId, id]
      );
    }
    
    res.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error PUT:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar usuario (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('UPDATE usuarios SET estado = $1 WHERE id = $2', ['inactivo', id]);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error DELETE:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;