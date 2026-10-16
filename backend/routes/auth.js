const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Almacén temporal de tokens de recuperación { token -> { userId, email, expiry } }
const resetTokens = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Logo del sistema (público — sin token)
router.get('/logo-sistema', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT logo FROM empresas WHERE LOWER(nombre) LIKE '%emtra%' AND logo IS NOT NULL LIMIT 1`
    );
    res.json({ success: true, logo: result.rows[0]?.logo || null });
  } catch {
    res.json({ success: true, logo: null });
  }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await db.query(`
            SELECT u.*, r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.email = ?
        `, [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        let empresasAsignadas = [];
        if (user.rol_nombre !== 'super_admin') {
            const empresasResult = await db.query(
                `SELECT e.id, e.nombre
                 FROM usuario_empresas ue
                 JOIN empresas e ON ue.empresa_id = e.id
                 WHERE ue.usuario_id = ?`,
                [user.id]
            );
            empresasAsignadas = empresasResult.rows;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol_nombre, empresas: empresasAsignadas },
            process.env.SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol_nombre,
                empresas: empresasAsignadas
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Activar cuenta con token de invitación
router.post('/activar', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token y contraseña son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const result = await db.query(
      `SELECT id, nombre, email FROM usuarios
       WHERE invitation_token = ? AND invitation_expires_at > NOW() AND estado = 'pendiente'`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El enlace no es válido o ya expiró.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE usuarios
       SET password_hash=?, estado='activo', invitation_token=NULL, invitation_expires_at=NULL
       WHERE id=?`,
      [hashedPassword, result.rows[0].id]
    );

    res.json({ success: true, message: 'Cuenta activada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verificar que un token de invitación es válido (para mostrar nombre en la página)
router.get('/activar/:token', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT nombre, email FROM usuarios
       WHERE invitation_token = ? AND invitation_expires_at > NOW() AND estado = 'pendiente'`,
      [req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Enlace inválido o expirado.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cambiar contraseña
router.put('/password/:id', async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hashedPassword, id]);
        
        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar la contraseña' });
    }
});

// Recuperar contraseña - envía email con enlace
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'El email es requerido' });
  }

  try {
    const result = await db.query(
      'SELECT id, nombre, email FROM usuarios WHERE email = ? AND estado = ?',
      [email, 'activo']
    );

    // Siempre responder éxito para no revelar si el email existe
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'Si el email existe, recibirás un enlace de recuperación' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hora

    resetTokens.set(token, { userId: user.id, email: user.email, expiry });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Sistema EMTRA" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Recuperación de contraseña - EMTRA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Recuperar contraseña</h2>
          <p>Hola <strong>${user.nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; margin: 16px 0;">
            Restablecer contraseña
          </a>
          <p style="color: #6b7280; font-size: 13px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Si el email existe, recibirás un enlace de recuperación' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
});

// Restablecer contraseña con token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token y contraseña son requeridos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const tokenData = resetTokens.get(token);

  if (!tokenData) {
    return res.status(400).json({ success: false, message: 'Enlace inválido o ya fue usado' });
  }

  if (Date.now() > tokenData.expiry) {
    resetTokens.delete(token);
    return res.status(400).json({ success: false, message: 'El enlace ha expirado. Solicita uno nuevo' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [hashedPassword, tokenData.userId]
    );

    resetTokens.delete(token);
    res.json({ success: true, message: 'Contraseña restablecida exitosamente. Redirigiendo al inicio...' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
});

module.exports = router;