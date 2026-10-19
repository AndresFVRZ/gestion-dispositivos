-- Migración: estado "Averiado", periféricos, hoja de vida (historial_asignaciones) y stock de partes por sede
-- Motor: MariaDB / MySQL (XAMPP). Ejecutar con:
--   mysql -u root --default-character-set=utf8mb4 lucoa < 004_estados_hoja_vida_stock.sql
-- Es seguro re-ejecutar.

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. Estados válidos de equipos
--    Requeridos: Asignado, Disponible, Averiado, Baja.
--    Se conservan los que ya usa la aplicación (préstamos, mantenimientos,
--    canibalización, importación desde Excel) para no romper esos flujos.
-- ------------------------------------------------------------
ALTER TABLE equipos MODIFY estado VARCHAR(50) DEFAULT 'Disponible';

ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipos_estado;
ALTER TABLE equipos ADD CONSTRAINT chk_equipos_estado CHECK (estado IN (
    'Asignado', 'Disponible', 'Averiado', 'Baja',
    'Préstamo', 'Mantenimiento', 'Dañado', 'Obsoleto', 'Canibalizar', 'Activo'
));

-- ------------------------------------------------------------
-- 2. Periféricos (1 equipo -> N periféricos)
--    Ya existe en schema_mariadb.sql; se deja aquí para entornos que no la tengan.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perifericos (
    id          INT NOT NULL AUTO_INCREMENT,
    equipo_id   INT NOT NULL,
    descripcion TEXT DEFAULT NULL,
    tipo_id     INT DEFAULT NULL,
    marca       VARCHAR(100) DEFAULT NULL,
    modelo      VARCHAR(100) DEFAULT NULL,
    serial      VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_perifericos_equipo (equipo_id),
    KEY perifericos_tipo_id_fkey (tipo_id),
    CONSTRAINT perifericos_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES equipos (id) ON DELETE CASCADE,
    CONSTRAINT perifericos_tipo_id_fkey   FOREIGN KEY (tipo_id)   REFERENCES tipo_dispositivo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Hoja de vida: cada movimiento de un equipo
--    Quién lo tenía antes, a quién pasó, quién hizo el cambio y cuándo.
--    Los nombres se guardan como copia para que la hoja de vida no cambie
--    si luego se edita o se desactiva el usuario.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_asignaciones (
    id                   INT NOT NULL AUTO_INCREMENT,
    equipo_id            INT NOT NULL,
    tipo_movimiento      VARCHAR(30) NOT NULL,
    asignado_anterior    VARCHAR(100) DEFAULT NULL,
    asignado_nuevo       VARCHAR(100) DEFAULT NULL,
    estado_anterior      VARCHAR(50) DEFAULT NULL,
    estado_nuevo         VARCHAR(50) DEFAULT NULL,
    sede_anterior_id     INT DEFAULT NULL,
    sede_nueva_id        INT DEFAULT NULL,
    empresa_id           INT DEFAULT NULL,
    realizado_por        INT DEFAULT NULL,
    realizado_por_nombre VARCHAR(100) DEFAULT NULL,
    fecha                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones        TEXT DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_hist_asig_equipo_fecha (equipo_id, fecha),
    KEY idx_hist_asig_empresa (empresa_id),
    CONSTRAINT hist_asig_equipo_fkey        FOREIGN KEY (equipo_id)        REFERENCES equipos (id)  ON DELETE CASCADE,
    CONSTRAINT hist_asig_sede_anterior_fkey FOREIGN KEY (sede_anterior_id) REFERENCES sedes (id)    ON DELETE SET NULL,
    CONSTRAINT hist_asig_sede_nueva_fkey    FOREIGN KEY (sede_nueva_id)    REFERENCES sedes (id)    ON DELETE SET NULL,
    CONSTRAINT hist_asig_empresa_fkey       FOREIGN KEY (empresa_id)       REFERENCES empresas (id) ON DELETE SET NULL,
    CONSTRAINT hist_asig_usuario_fkey       FOREIGN KEY (realizado_por)    REFERENCES usuarios (id) ON DELETE SET NULL,
    CONSTRAINT chk_hist_asig_tipo CHECK (tipo_movimiento IN (
        'ASIGNACION', 'DEVOLUCION', 'REASIGNACION', 'TRASLADO', 'PRESTAMO', 'CAMBIO_ESTADO', 'BAJA'
    ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Punto de partida de la hoja de vida: la asignación vigente de cada equipo
INSERT INTO historial_asignaciones
    (equipo_id, tipo_movimiento, asignado_nuevo, estado_nuevo, sede_nueva_id, empresa_id, fecha, observaciones)
SELECT e.id, 'ASIGNACION', e.asignado_a, e.estado, e.sede_id, e.empresa_id,
       COALESCE(e.fecha_asignacion, e.created_at, NOW()),
       'Registro inicial (migración 004): asignación vigente al crear la hoja de vida'
FROM equipos e
WHERE e.asignado_a IS NOT NULL AND TRIM(e.asignado_a) <> ''
  AND UPPER(TRIM(e.asignado_a)) <> 'DISPONIBLE'
  AND NOT EXISTS (SELECT 1 FROM historial_asignaciones h WHERE h.equipo_id = e.id);

-- ------------------------------------------------------------
-- 4. Stock de partes / repuestos por sede
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_partes (
    id           INT NOT NULL AUTO_INCREMENT,
    sede_id      INT NOT NULL,
    nombre       VARCHAR(150) NOT NULL,
    categoria    VARCHAR(50) DEFAULT NULL,
    marca        VARCHAR(100) NOT NULL DEFAULT '',
    modelo       VARCHAR(100) NOT NULL DEFAULT '',
    descripcion  TEXT DEFAULT NULL,
    cantidad     INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_stock_parte_sede (sede_id, nombre, marca, modelo),
    KEY idx_stock_sede (sede_id),
    CONSTRAINT stock_partes_sede_fkey FOREIGN KEY (sede_id) REFERENCES sedes (id),
    CONSTRAINT chk_stock_cantidad CHECK (cantidad >= 0),
    CONSTRAINT chk_stock_minimo   CHECK (stock_minimo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Verificar resultado
-- ------------------------------------------------------------
SELECT estado, COUNT(*) AS equipos FROM equipos GROUP BY estado;
SELECT COUNT(*) AS registros_hoja_vida FROM historial_asignaciones;
SHOW TABLES LIKE 'stock_partes';
