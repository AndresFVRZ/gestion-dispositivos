-- Migración: Segunda etapa — nuevos roles
-- Ejecutar en PostgreSQL con permisos de administrador

-- 1. Insertar nuevos roles
INSERT INTO roles (nombre) VALUES ('administrador') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO roles (nombre) VALUES ('logistica')     ON CONFLICT (nombre) DO NOTHING;
INSERT INTO roles (nombre) VALUES ('soporte')       ON CONFLICT (nombre) DO NOTHING;
INSERT INTO roles (nombre) VALUES ('financiera')    ON CONFLICT (nombre) DO NOTHING;
INSERT INTO roles (nombre) VALUES ('gerencia')      ON CONFLICT (nombre) DO NOTHING;

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
