const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

const SECRET_KEY = process.env.SECRET_KEY || 'EMTRA_SECRET_KEY_2024';

// Generar token de recuperación
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Obtener fecha de expiración (1 hora)
const getTokenExpiry = () => {
    return new Date(Date.now() + 60 * 60 * 1000);
};

// Adjunta a cada usuario su arreglo `empresas` [{id, nombre}] con una sola consulta.
// Reemplaza al json_agg/json_build_object de PostgreSQL (no disponible en MariaDB 10.4).
const attachEmpresas = async (usuarios) => {
    if (!usuarios.length) return usuarios;
    const ids = usuarios.map(u => u.id);
    const { rows } = await pool.query(
        `SELECT ue.usuario_id, e.id, e.nombre
         FROM usuario_empresas ue
         JOIN empresas e ON ue.empresa_id = e.id
         WHERE ue.usuario_id IN (?)
         ORDER BY e.nombre`,
        [ids]
    );
    const map = new Map();
    for (const r of rows) {
        if (!map.has(r.usuario_id)) map.set(r.usuario_id, []);
        map.get(r.usuario_id).push({ id: r.id, nombre: r.nombre });
    }
    for (const u of usuarios) u.empresas = map.get(u.id) || [];
    return usuarios;
};

// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT u.*, r.nombre as rol_nombre
             FROM usuarios u
             JOIN roles r ON u.rol_id = r.id
             WHERE u.email = ? AND u.estado = 'activo'`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        let empresasAsignadas = [];
        if (usuario.rol_nombre !== 'super_admin') {
            const empresasResult = await pool.query(
                `SELECT e.id, e.nombre, e.logo
                 FROM usuario_empresas ue
                 JOIN empresas e ON ue.empresa_id = e.id
                 WHERE ue.usuario_id = ?`,
                [usuario.id]
            );
            empresasAsignadas = empresasResult.rows;
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol_nombre,
                rol_id: usuario.rol_id,
                empresas: empresasAsignadas
            },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol_nombre,
                rol_id: usuario.rol_id,
                empresas: empresasAsignadas
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// ==========================================
// VERIFICAR TOKEN
// ==========================================
const verifyToken = async (req, res) => {
    res.json({ success: true, usuario: req.usuario });
};

// ==========================================
// OLVIDÉ MI CONTRASEÑA - ENVIAR EMAIL
// ==========================================
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT id, email FROM usuarios WHERE email = ?', [email]);

        if (user.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Si el email está registrado, recibirás un enlace de recuperación.'
            });
        }

        const resetToken = generateResetToken();
        const expiresAt = getTokenExpiry();

        await pool.query(
            'UPDATE usuarios SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?',
            [resetToken, expiresAt, user.rows[0].id]
        );

        const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Recuperación de Contraseña</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #0a1b3d; text-align: center;">Recuperación de Contraseña</h2>
                    <p style="color: #333;">Hola,</p>
                    <p style="color: #333;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #f39200; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p style="color: #666; font-size: 12px;">Este enlace expirará en <strong>1 hora</strong>.</p>
                    <p style="color: #666; font-size: 12px;">Si no solicitaste este cambio, ignora este mensaje.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 11px; text-align: center;">Sistema de Gestión de Equipos</p>
                </div>
            </body>
            </html>
        `;

        await sendEmail(email, 'Recuperación de Contraseña', html);

        res.json({
            success: true,
            message: 'Si el email está registrado, recibirás un enlace de recuperación.'
        });
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
    }
};

// ==========================================
// RESTABLECER CONTRASEÑA - VALIDAR TOKEN
// ==========================================
const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        const user = await pool.query(
            'SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expires_at > NOW()',
            [token]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El enlace ha expirado o es inválido. Solicita un nuevo restablecimiento.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?',
            [hashedPassword, user.rows[0].id]
        );

        res.json({
            success: true,
            message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
        });
    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
    }
};

// ==========================================
// CAMBIAR CONTRASEÑA (DESDE PERFIL)
// ==========================================
const cambiarPassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verificar que el usuario solo pueda cambiar su propia contraseña
    if (parseInt(id) !== req.usuario.id) {
        return res.status(403).json({
            success: false,
            message: 'No puedes cambiar la contraseña de otro usuario'
        });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        // Obtener el usuario actual
        const result = await pool.query(
            'SELECT password_hash FROM usuarios WHERE id = ?',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar la contraseña actual
        const passwordValida = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hashear y guardar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE usuarios SET password_hash = ? WHERE id = ?',
            [hashedPassword, id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.error('Error en cambiarPassword:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// OBTENER TODOS LOS USUARIOS
// ==========================================
const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.nombre, u.email, u.estado, u.created_at,
                   r.id as rol_id, r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id
        `);

        await attachEmpresas(result.rows);
        res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// OBTENER USUARIO POR ID
// ==========================================
const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT u.id, u.nombre, u.email, u.estado, u.created_at,
                   r.id as rol_id, r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id = ?
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        await attachEmpresas(result.rows);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error en getUsuarioById:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// CREAR USUARIO
// ==========================================
const crearUsuario = async (req, res) => {
    const { nombre, email, password, rol_id, empresas_ids } = req.body;

    try {
        if (!nombre || !email || !password || !rol_id) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        const existe = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const rolResult = await pool.query('SELECT nombre FROM roles WHERE id = ?', [rol_id]);
        const rolNombre = rolResult.rows[0]?.nombre;

        const hashedPassword = await bcrypt.hash(password, 10);

        const ins = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol_id, estado, created_at)
             VALUES (?, ?, ?, ?, 'activo', NOW())`,
            [nombre, email, hashedPassword, rol_id]
        );

        const sel = await pool.query(
            `SELECT id, nombre, email, rol_id, estado, created_at FROM usuarios WHERE id = ?`,
            [ins.insertId]
        );
        const nuevoUsuario = sel.rows[0];

        if (empresas_ids && empresas_ids.length > 0 && rolNombre !== 'super_admin') {
            for (const empresaId of empresas_ids) {
                await pool.query(
                    `INSERT INTO usuario_empresas (usuario_id, empresa_id) VALUES (?, ?)`,
                    [nuevoUsuario.id, empresaId]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: nuevoUsuario
        });
    } catch (error) {
        console.error('Error en crearUsuario:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// ACTUALIZAR USUARIO
// ==========================================
const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, email, rol_id, estado, empresas_ids } = req.body;

    try {
        const existe = await pool.query('SELECT id FROM usuarios WHERE id = ?', [id]);
        if (existe.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        await pool.query(
            `UPDATE usuarios
             SET nombre = ?, email = ?, rol_id = ?, estado = ?
             WHERE id = ?`,
            [nombre, email, rol_id, estado, id]
        );

        if (empresas_ids !== undefined) {
            await pool.query('DELETE FROM usuario_empresas WHERE usuario_id = ?', [id]);
            for (const empresaId of empresas_ids) {
                await pool.query(
                    `INSERT INTO usuario_empresas (usuario_id, empresa_id) VALUES (?, ?)`,
                    [id, empresaId]
                );
            }
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error en actualizarUsuario:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// ELIMINAR USUARIO
// ==========================================
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const existe = await pool.query('SELECT id FROM usuarios WHERE id = ?', [id]);
        if (existe.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        await pool.query('DELETE FROM usuario_empresas WHERE usuario_id = ?', [id]);
        await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', ['inactivo', id]);

        res.json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('Error en eliminarUsuario:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    login,
    verifyToken,
    forgotPassword,
    resetPassword,
    cambiarPassword,
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
