-- Migración: usuario super_admin para Andres Felipe Ramos Gonzalez (responsable del proyecto)
-- Motor: MariaDB / MySQL (XAMPP). Ejecutar con: mysql -u root lucoa < 003_usuario_andres_ramos.sql
-- Se crea ya activo (sin invitación por correo, el SMTP no está configurado en desarrollo).
-- La contraseña temporal se entrega por fuera del repositorio: cambiarla en el primer ingreso.

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol_id, rol, estado)
VALUES (
  'Andres Felipe Ramos Gonzalez',
  'andres.ramos@emtra.com.co',
  '$2a$10$LKpRA2TSf.MPBTTRDNQBlerbq0oox8lczx6x7bk83bCFOGxJ..5j.',
  (SELECT id FROM roles WHERE nombre = 'super_admin'),
  'super_admin',
  'activo'
);

-- Verificar resultado
SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.estado
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id
WHERE u.email = 'andres.ramos@emtra.com.co';
