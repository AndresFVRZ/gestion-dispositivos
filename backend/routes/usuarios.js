const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Mapa de nombre de empresa → archivo de logo en /public/logos/
const LOGO_MAP = {
  'accesalud':        'Accesalud.png',
  'emtra':            'Emtra.png',
  'emtrasur':         'EmtraSur.png',
  'inprosalud plus':  'InprosaludPlus.png',
  'inprosalud':       'InprosaludPlus.png',
  'sertti':           'Sertti.png',
  'sci':              'solucionescorp.png',
  'si madrid':        'simadrid.png',
};

const getLogoUrl = (nombreEmpresa) => {
  const key = (nombreEmpresa || '').toLowerCase().trim();
  const archivo = LOGO_MAP[key] || Object.entries(LOGO_MAP).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  return archivo ? `${process.env.APP_URL_BACKEND || 'http://localhost:5000'}/public/logos/${archivo}` : null;
};

// Todos los logos para mostrar en emails y páginas
const TODOS_LOGOS = [
  { archivo: 'Accesalud.png',      nombre: 'Accesalud' },
  { archivo: 'Emtra.png',          nombre: 'EMTRA' },
  { archivo: 'EmtraSur.png',       nombre: 'EMTRASUR' },
  { archivo: 'InprosaludPlus.png', nombre: 'Inprosalud Plus' },
  { archivo: 'Sertti.png',         nombre: 'Sertti' },
  { archivo: 'solucionescorp.png', nombre: 'SCI' },
  { archivo: 'simadrid.png',       nombre: 'SI MADRID' },
];

const LOGOS_DIR = path.join(__dirname, '..', 'public', 'logos');

// Convierte un archivo PNG a base64 data URL
const logoBase64 = (archivo) => {
  try {
    const filePath = path.join(LOGOS_DIR, archivo);
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (_) {
    return null;
  }
};

const logosGridHtml = () => {
  const COLS = 3;
  const filas = [];
  for (let i = 0; i < TODOS_LOGOS.length; i += COLS) {
    const grupo = TODOS_LOGOS.slice(i, i + COLS);
    const row = Math.floor(i / COLS);
    const celdas = grupo.map(({ archivo, nombre }, colIdx) => {
      const esOscuro = (colIdx + row) % 2 === 0;
      const bg = esOscuro ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)';
      const src = logoBase64(archivo);
      if (!src) return '';
      return `
        <td style="padding:5px;text-align:center;vertical-align:middle;">
          <div style="background:${bg};border-radius:8px;padding:8px 6px;width:100px;height:54px;display:inline-block;text-align:center;line-height:38px;">
            <img src="${src}" alt="${nombre}"
                 style="max-width:88px;max-height:38px;object-fit:contain;filter:brightness(0) invert(1);vertical-align:middle;" />
          </div>
        </td>
      `;
    }).join('');
    filas.push(`<tr>${celdas}</tr>`);
  }

  return `
    <div style="margin-top:20px;">
      <p style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:1px;text-align:center;margin:0 0 10px;">Empresas del sistema</p>
      <table style="margin:0 auto;border-collapse:separate;border-spacing:0;">
        ${filas.join('')}
      </table>
    </div>
  `;
};

const enviarInvitacion = async (nombre, email, token, empresas_ids = []) => {
  const url = `${process.env.APP_URL}/activar?token=${token}`;

  await transporter.sendMail({
    from: `"Sistema EMTRA" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Bienvenido al Sistema de Gestión — Activa tu cuenta',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#0f2b5c,#2563eb);border-radius:10px;padding:28px 24px;text-align:center;margin-bottom:24px;">
          <h1 style="color:white;font-size:22px;margin:0 0 4px;">Sistema de Gestión de Equipos</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0 0 0;">Inventario tecnológico corporativo</p>
          ${logosGridHtml()}
        </div>
        <div style="background:white;border-radius:10px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 12px;">Hola, <strong>${nombre}</strong></h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            Has sido agregado al sistema de gestión de equipos.<br>
            Haz clic en el botón para crear tu contraseña y activar tu cuenta.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${url}" style="background:#2563eb;color:white;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
              Activar mi cuenta
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            Este enlace expira en <strong>24 horas</strong>.<br>
            Si no esperabas este correo, puedes ignorarlo.
          </p>
        </div>
      </div>
    `,
  });
};

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
      WHERE u.estado != 'inactivo'
      ORDER BY u.id
    `);

    const usuarios = result.rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol || 'visualizador',
      estado: u.estado,
      empresas: u.empresas || [],
      empresas_ids: (u.empresas || []).map(e => e.id)
    }));

    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error GET /usuarios:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Crear usuario y enviar invitación por correo
router.post('/', async (req, res) => {
  const { nombre, email, rol, empresas_ids } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y email son requeridos' });
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

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id, rol, estado, invitation_token, invitation_expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pendiente', $6, $7)
       RETURNING id`,
      [nombre, email, '', rolId, rolNombre, invitationToken, invitationExpires]
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

    await enviarInvitacion(nombre, email, invitationToken, empresas_ids || []);

    res.json({ success: true, message: 'Usuario creado. Invitación enviada por correo.', id: userId });
  } catch (error) {
    console.error('Error en POST /usuarios:', error.message);
    res.status(500).json({ success: false, message: 'Error al crear usuario: ' + error.message });
  }
});

// POST - Reenviar invitación
router.post('/:id/reenviar-invitacion', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const usuario = userResult.rows[0];
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `UPDATE usuarios SET invitation_token=$1, invitation_expires_at=$2, estado='pendiente' WHERE id=$3`,
      [invitationToken, invitationExpires, id]
    );

    const empResult = await db.query(
      'SELECT empresa_id FROM usuario_empresas WHERE usuario_id = $1 LIMIT 5', [id]
    );
    const empIds = empResult.rows.map(r => r.empresa_id);
    await enviarInvitacion(usuario.nombre, usuario.email, invitationToken, empIds);

    res.json({ success: true, message: 'Invitación reenviada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
