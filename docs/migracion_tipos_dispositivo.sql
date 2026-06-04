-- ============================================================
-- MIGRACIÓN: Unificar tipos de dispositivo
-- Sistema de Gestión de Equipos EMTRA
-- Fecha: 2026-06-04
--
-- Cambios:
--   1. Inserta tipos periféricos en tipo_dispositivo (categoria='periferico')
--   2. Agrega tipo_id FK en equipos → tipo_dispositivo
--   3. Migra perifericos.tipo_id de tipo_periferico → tipo_dispositivo
--   4. Elimina columna tipo VARCHAR de equipos
--   5. Elimina tabla tipo_periferico
--
-- HACER BACKUP ANTES DE EJECUTAR
-- Compatible con PostgreSQL 13+
-- ============================================================

BEGIN;

-- ============================================================
-- 1a. Insertar tipos de EQUIPO en tipo_dispositivo
--     categoria = 'equipo' para el selector del formulario de equipos
-- ============================================================
INSERT INTO tipo_dispositivo (nombre, categoria, descripcion)
SELECT v.nombre, v.categoria, v.descripcion
FROM (VALUES
    ('Desktop',      'equipo', 'Computadora de escritorio'),
    ('Portátil',     'equipo', 'Computadora portátil / laptop'),
    ('Todo en uno',  'equipo', 'Computadora todo en uno (AIO)'),
    ('Servidor',     'equipo', 'Servidor'),
    ('Tablet',       'equipo', 'Tableta'),
    ('Workstation',  'equipo', 'Estación de trabajo')
) AS v(nombre, categoria, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM tipo_dispositivo td
    WHERE LOWER(td.nombre) = LOWER(v.nombre) AND td.categoria = 'equipo'
);


-- ============================================================
-- 1b. Insertar tipos PERIFÉRICOS en tipo_dispositivo
--     categoria = 'periferico' para el selector de periféricos
-- ============================================================
INSERT INTO tipo_dispositivo (nombre, categoria, descripcion)
SELECT v.nombre, v.categoria, v.descripcion
FROM (VALUES
    ('Mouse',       'periferico', 'Dispositivo señalador'),
    ('Teclado',     'periferico', 'Dispositivo de entrada de texto'),
    ('Monitor',     'periferico', 'Pantalla de visualización'),
    ('Audífonos',   'periferico', 'Dispositivo de audio'),
    ('Cámara web',  'periferico', 'Cámara para videoconferencias'),
    ('Impresora',   'periferico', 'Dispositivo de impresión'),
    ('UPS',         'periferico', 'Sistema de alimentación ininterrumpida'),
    ('Otro',        'periferico', 'Otro dispositivo periférico')
) AS v(nombre, categoria, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM tipo_dispositivo td
    WHERE LOWER(td.nombre) = LOWER(v.nombre) AND td.categoria = 'periferico'
);


-- ============================================================
-- 2. Agregar tipo_id FK en equipos (si no existe)
--    Reemplaza la columna tipo VARCHAR
-- ============================================================
ALTER TABLE equipos
    ADD COLUMN IF NOT EXISTS tipo_id INTEGER REFERENCES tipo_dispositivo(id);

CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos(tipo_id);


-- ============================================================
-- 3. Migrar perifericos.tipo_id de tipo_periferico → tipo_dispositivo
-- ============================================================

-- 3a. Columna temporal para el nuevo FK
ALTER TABLE perifericos
    ADD COLUMN IF NOT EXISTS nuevo_tipo_id INTEGER;

-- 3b. Mapear por nombre (usando LOWER para tolerancia a mayúsculas)
UPDATE perifericos p
SET nuevo_tipo_id = td.id
FROM tipo_periferico tp
JOIN tipo_dispositivo td
    ON LOWER(td.nombre) = LOWER(tp.nombre)
   AND td.categoria = 'periferico'
WHERE p.tipo_id = tp.id;

-- 3c. Eliminar columna antigua (borra también su FK constraint automáticamente)
ALTER TABLE perifericos DROP COLUMN IF EXISTS tipo_id;

-- 3d. Renombrar columna temporal
ALTER TABLE perifericos RENAME COLUMN nuevo_tipo_id TO tipo_id;

-- 3e. Agregar FK constraint
ALTER TABLE perifericos
    ADD CONSTRAINT perifericos_tipo_id_fkey
    FOREIGN KEY (tipo_id) REFERENCES tipo_dispositivo(id);


-- ============================================================
-- 4. Eliminar columna tipo VARCHAR de equipos
-- ============================================================
ALTER TABLE equipos DROP COLUMN IF EXISTS tipo;


-- ============================================================
-- 5. Eliminar tabla tipo_periferico (datos ya migrados)
-- ============================================================
DROP TABLE IF EXISTS tipo_periferico;


COMMIT;
