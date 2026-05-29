const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los equipos (no eliminados)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipos WHERE eliminado = false ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtener equipos por empresa
router.get('/empresa/:empresaId', async (req, res) => {
  const { empresaId } = req.params;
  try {
    const result = await db.query('SELECT * FROM equipos WHERE empresa_id = $1 AND eliminado = false', [empresaId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Crear equipo
router.post('/', async (req, res) => {
  const {
    codigo, nombre_equipo, tipo, marca, modelo, serial, estado, ubicacion,
    asignado_a, procesador, ram, disco_duro, sistema_operativo,
    fecha_asignacion, garantia, empresa_id
  } = req.body;
  
  try {
    const result = await db.query(
      `INSERT INTO equipos (codigo, nombre_equipo, tipo, marca, modelo, serial, estado, 
        ubicacion, asignado_a, procesador, ram, disco_duro, sistema_operativo, 
        fecha_asignacion, garantia, empresa_id, eliminado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, false)
       RETURNING id`,
      [codigo, nombre_equipo, tipo, marca, modelo, serial, estado || 'disponible',
       ubicacion, asignado_a, procesador, ram, disco_duro, sistema_operativo,
       fecha_asignacion, garantia, empresa_id]
    );
    
    res.json({ success: true, message: 'Equipo creado exitosamente', id: result.rows[0].id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Actualizar equipo
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    codigo, nombre_equipo, tipo, marca, modelo, serial, estado, ubicacion,
    asignado_a, procesador, ram, disco_duro, sistema_operativo,
    fecha_asignacion, garantia, empresa_id
  } = req.body;
  
  try {
    await db.query(
      `UPDATE equipos SET codigo=$1, nombre_equipo=$2, tipo=$3, marca=$4, modelo=$5, 
        serial=$6, estado=$7, ubicacion=$8, asignado_a=$9, procesador=$10, 
        ram=$11, disco_duro=$12, sistema_operativo=$13, fecha_asignacion=$14, 
        garantia=$15, empresa_id=$16 WHERE id=$17`,
      [codigo, nombre_equipo, tipo, marca, modelo, serial, estado, ubicacion,
       asignado_a, procesador, ram, disco_duro, sistema_operativo,
       fecha_asignacion, garantia, empresa_id, id]
    );
    
    res.json({ success: true, message: 'Equipo actualizado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar equipo (soft delete - mover a papelera)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('UPDATE equipos SET eliminado = true, eliminado_en = NOW() WHERE id = $1', [id]);
    res.json({ success: true, message: 'Equipo movido a papelera' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtener papelera (equipos eliminados)
router.get('/papelera', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipos WHERE eliminado = true ORDER BY eliminado_en DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Restaurar equipo desde papelera
router.post('/:id/restaurar', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('UPDATE equipos SET eliminado = false, eliminado_en = NULL WHERE id = $1', [id]);
    res.json({ success: true, message: 'Equipo restaurado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar equipo permanentemente
router.delete('/:id/permanente', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('DELETE FROM equipos WHERE id = $1', [id]);
    res.json({ success: true, message: 'Equipo eliminado permanentemente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;