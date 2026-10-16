-- Migración: Segunda etapa — nuevos roles
-- Motor: MariaDB / MySQL (XAMPP). Ejecutar con: mysql -u root lucoa < 002_nuevos_roles.sql
-- Nota: el volcado inicial (data_mariadb.sql) ya incluye estos roles; este script
-- queda como referencia / para entornos que partan de un esquema vacío.

-- 1. Insertar nuevos roles
INSERT IGNORE INTO roles (nombre) VALUES ('administrador');
INSERT IGNORE INTO roles (nombre) VALUES ('logistica');
INSERT IGNORE INTO roles (nombre) VALUES ('soporte');
INSERT IGNORE INTO roles (nombre) VALUES ('financiera');
INSERT IGNORE INTO roles (nombre) VALUES ('gerencia');

-- 2. Migrar usuarios con roles antiguos a los nuevos equivalentes
UPDATE usuarios
  SET rol    = 'logistica',
      rol_id = (SELECT id FROM roles WHERE nombre = 'logistica')
  WHERE rol = 'gestion';

UPDATE usuarios
  SET rol    = 'financiera',
      rol_id = (SELECT id FROM roles WHERE nombre = 'financiera')
  WHERE rol = 'visualizador';

-- 3. Eliminar roles antiguos (solo si ya no quedan usuarios con ellos)
DELETE FROM roles WHERE nombre = 'gestion'      AND NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'gestion');
DELETE FROM roles WHERE nombre = 'visualizador' AND NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'visualizador');

-- 4. Verificar resultado
SELECT id, nombre FROM roles ORDER BY id;
SELECT rol, COUNT(*) FROM usuarios GROUP BY rol ORDER BY rol;
