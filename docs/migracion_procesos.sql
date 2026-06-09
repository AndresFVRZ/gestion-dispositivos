-- ============================================================
-- MIGRACIÓN: Tabla PROCESOS (áreas) + proceso_id en EQUIPOS
-- Sistema de Gestión de Equipos EMTRA
-- Fecha: 2026-06-09
--
-- IMPORTANTE: Ejecutar en orden. Hacer backup antes.
-- Compatible con PostgreSQL 13+
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PROCESOS (áreas organizacionales por empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS procesos (
    id          SERIAL PRIMARY KEY,
    empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre      VARCHAR(200) NOT NULL,
    descripcion TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_procesos_empresa_nombre UNIQUE (empresa_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_procesos_empresa ON procesos(empresa_id);


-- ============================================================
-- 2. EQUIPOS — agregar columna proceso_id
-- ============================================================
ALTER TABLE equipos
    ADD COLUMN IF NOT EXISTS proceso_id INTEGER REFERENCES procesos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipos_proceso ON equipos(proceso_id);


-- ============================================================
-- 3. MANTENIMIENTOS — agregar estado_anterior para trazabilidad
-- ============================================================
ALTER TABLE mantenimientos
    ADD COLUMN IF NOT EXISTS estado_anterior VARCHAR(50);


-- ============================================================
-- 4. SEMILLA: Áreas predeterminadas para todas las empresas existentes
-- ============================================================
INSERT INTO procesos (empresa_id, nombre)
SELECT e.id, a.nombre
FROM empresas e
CROSS JOIN (VALUES
    ('BAJA'),
    ('COMERCIAL'),
    ('CALIDAD'),
    ('DISPONIBLE'),
    ('FINANCIERA SCI'),
    ('GERENCIA'),
    ('GESTION HUMANA'),
    ('IT'),
    ('JURIDICA'),
    ('LOGISTICA'),
    ('PLANTA'),
    ('PRODUCCION'),
    ('SST'),
    ('TESORERIA'),
    ('TX')
) AS a(nombre)
ON CONFLICT (empresa_id, nombre) DO NOTHING;

COMMIT;
