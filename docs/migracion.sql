-- ============================================================
-- MIGRACIÓN: Nuevo modelo de datos
-- Sistema de Gestión de Equipos EMTRA
-- Fecha: 2026-06-02
--
-- IMPORTANTE: Ejecutar en orden. Hacer backup antes de correr.
-- Compatible con PostgreSQL 13+
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EMPRESAS — agregar logo y created_at
-- ============================================================
ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS logo       TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- ============================================================
-- 2. ROLES — agregar descripcion y created_at
-- ============================================================
ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP DEFAULT NOW();


-- ============================================================
-- 3. USUARIOS — agregar empresa_id, reset_token, timestamps
-- ============================================================
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS empresa_id             INTEGER REFERENCES empresas(id),
    ADD COLUMN IF NOT EXISTS created_at             TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reset_token            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;


-- ============================================================
-- 4. USUARIO_EMPRESAS — agregar id PK y created_at
--    La tabla actual tiene PK compuesto (usuario_id, empresa_id).
--    Agregamos id serial y created_at sin romper la unicidad.
-- ============================================================
ALTER TABLE usuario_empresas
    ADD COLUMN IF NOT EXISTS id         SERIAL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- ============================================================
-- 5. SEDES — tabla nueva
-- ============================================================
CREATE TABLE IF NOT EXISTS sedes (
    id          SERIAL PRIMARY KEY,
    empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre      VARCHAR(200) NOT NULL,
    ubicacion   VARCHAR(300),
    created_at  TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 6. EQUIPOS — agregar sede_id, asignado_usuario_id y numero_placa
--    Los campos técnicos (procesador, ram, etc.) se conservan
--    durante la transición hasta migrar los datos a PERIFERICOS.
-- ============================================================
ALTER TABLE equipos
    ADD COLUMN IF NOT EXISTS sede_id             INTEGER REFERENCES sedes(id),
    ADD COLUMN IF NOT EXISTS asignado_usuario_id INTEGER REFERENCES usuarios(id),
    ADD COLUMN IF NOT EXISTS numero_placa        VARCHAR(100);


-- ============================================================
-- 7. TIPO_PERIFERICO — tabla nueva
-- ============================================================
CREATE TABLE IF NOT EXISTS tipo_periferico (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO tipo_periferico (nombre, descripcion) VALUES
    ('Mouse',      'Dispositivo señalador'),
    ('Teclado',    'Dispositivo de entrada de texto'),
    ('Monitor',    'Pantalla de visualización'),
    ('Audífonos',  'Dispositivo de audio'),
    ('Cámara web', 'Cámara para videoconferencias'),
    ('Impresora',  'Dispositivo de impresión'),
    ('UPS',        'Sistema de alimentación ininterrumpida'),
    ('Otro',       'Otro dispositivo periférico')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 8. PERIFERICOS — tabla nueva
-- ============================================================
CREATE TABLE IF NOT EXISTS perifericos (
    id          SERIAL PRIMARY KEY,
    equipo_id   INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tipo_id     INTEGER REFERENCES tipo_periferico(id),
    marca       VARCHAR(100),
    modelo      VARCHAR(100),
    serial      VARCHAR(100),
    descripcion TEXT
);


-- ============================================================
-- 9. MANTENIMIENTOS — tabla nueva
-- ============================================================
CREATE TABLE IF NOT EXISTS mantenimientos (
    id                   SERIAL PRIMARY KEY,
    equipo_id            INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    fecha_mantenimiento  DATE NOT NULL,
    tipo                 VARCHAR(50),
    descripcion          TEXT,
    tecnico              VARCHAR(200),
    costo                NUMERIC(10, 2),
    created_at           TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 10. HISTORIAL_ACCIONES — renombrar created_at → fecha
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'historial_acciones' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE historial_acciones RENAME COLUMN created_at TO fecha;
    END IF;
END $$;


-- ============================================================
-- 11. PLACAS — tabla nueva (activos fijos / asset tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS placas (
    id               SERIAL PRIMARY KEY,
    equipo_id        INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
    empresa_id       INTEGER NOT NULL REFERENCES empresas(id),
    numero           VARCHAR(100) NOT NULL,
    fecha_asignacion DATE,
    estado           VARCHAR(50)  DEFAULT 'activa',   -- activa | inactiva | perdida
    notas            TEXT,
    asignado_por     INTEGER REFERENCES usuarios(id),
    created_at       TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 12. ÍNDICES recomendados para rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_equipos_empresa      ON equipos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_equipos_sede         ON equipos(sede_id);
CREATE INDEX IF NOT EXISTS idx_equipos_usuario      ON equipos(asignado_usuario_id);
CREATE INDEX IF NOT EXISTS idx_perifericos_equipo   ON perifericos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo ON mantenimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_sedes_empresa        ON sedes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historial_equipo     ON historial_acciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario    ON historial_acciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha      ON historial_acciones(fecha);
CREATE INDEX IF NOT EXISTS idx_placas_equipo        ON placas(equipo_id);
CREATE INDEX IF NOT EXISTS idx_placas_empresa       ON placas(empresa_id);


COMMIT;

-- ============================================================
-- PASO OPCIONAL (DESPUÉS de migrar datos):
-- Eliminar columnas técnicas antiguas de EQUIPOS
-- Solo ejecutar cuando los datos ya estén en PERIFERICOS
-- ============================================================
-- ALTER TABLE equipos
--     DROP COLUMN IF EXISTS procesador,
--     DROP COLUMN IF EXISTS ram,
--     DROP COLUMN IF EXISTS disco_duro,
--     DROP COLUMN IF EXISTS sistema_operativo,
--     DROP COLUMN IF EXISTS garantia,
--     DROP COLUMN IF EXISTS especificaciones,
--     DROP COLUMN IF EXISTS asignado_a;
