-- ============================================================
-- SCHEMA COMPLETO — Sistema de Gestión de Equipos EMTRA
-- Base de datos: lucoa (PostgreSQL 13+)
--
-- Ejecutar en una DB vacía o sobre una existente
-- (todos los CREATE usan IF NOT EXISTS — es idempotente)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EMPRESAS
-- ============================================================
CREATE TABLE IF NOT EXISTS empresas (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(200) NOT NULL,
    logo       TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 2. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion) VALUES
    ('super_admin',  'Acceso total a todas las empresas'),
    ('gestion',      'Puede crear, editar y eliminar equipos en sus empresas'),
    ('visualizador', 'Solo lectura')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================================
-- 3. USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id                     SERIAL PRIMARY KEY,
    nombre                 VARCHAR(200) NOT NULL,
    email                  VARCHAR(200) NOT NULL UNIQUE,
    password_hash          VARCHAR(255),
    rol_id                 INTEGER REFERENCES roles(id),
    empresa_id             INTEGER REFERENCES empresas(id),
    estado                 VARCHAR(20)  DEFAULT 'pendiente',
    created_at             TIMESTAMP    DEFAULT NOW(),
    reset_token            VARCHAR(255),
    reset_token_expires_at TIMESTAMP
);


-- ============================================================
-- 4. USUARIO_EMPRESAS  (pivote N:N usuario–empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario_empresas (
    id         SERIAL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, empresa_id)
);


-- ============================================================
-- 5. SEDES
-- ============================================================
CREATE TABLE IF NOT EXISTS sedes (
    id         SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre     VARCHAR(200) NOT NULL,
    ubicacion  VARCHAR(300),
    created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 6. TIPO_DISPOSITIVO  (catálogo unificado equipo + periférico)
-- ============================================================
CREATE TABLE IF NOT EXISTS tipo_dispositivo (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    categoria   VARCHAR(20)  NOT NULL CHECK (categoria IN ('equipo', 'periferico')),
    descripcion TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO tipo_dispositivo (nombre, categoria, descripcion)
SELECT v.nombre, v.categoria, v.descripcion
FROM (VALUES
    ('Desktop',      'equipo',     'Computadora de escritorio'),
    ('Portátil',     'equipo',     'Computadora portátil / laptop'),
    ('Todo en uno',  'equipo',     'Computadora todo en uno (AIO)'),
    ('Servidor',     'equipo',     'Servidor'),
    ('Tablet',       'equipo',     'Tableta'),
    ('Workstation',  'equipo',     'Estación de trabajo'),
    ('Mouse',        'periferico', 'Dispositivo señalador'),
    ('Teclado',      'periferico', 'Dispositivo de entrada de texto'),
    ('Monitor',      'periferico', 'Pantalla de visualización'),
    ('Audífonos',    'periferico', 'Dispositivo de audio'),
    ('Cámara web',   'periferico', 'Cámara para videoconferencias'),
    ('Impresora',    'periferico', 'Dispositivo de impresión'),
    ('UPS',          'periferico', 'Sistema de alimentación ininterrumpida'),
    ('Otro',         'periferico', 'Otro dispositivo periférico')
) AS v(nombre, categoria, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM tipo_dispositivo td
    WHERE LOWER(td.nombre) = LOWER(v.nombre) AND td.categoria = v.categoria
);


-- ============================================================
-- 7. EQUIPOS
-- ============================================================
CREATE TABLE IF NOT EXISTS equipos (
    id                    SERIAL PRIMARY KEY,
    empresa_id            INTEGER REFERENCES empresas(id),
    sede_id               INTEGER REFERENCES sedes(id),
    asignado_usuario_id   INTEGER REFERENCES usuarios(id),
    codigo                VARCHAR(100),
    nombre_equipo         VARCHAR(200) NOT NULL,
    tipo_id               INTEGER REFERENCES tipo_dispositivo(id),
    marca                 VARCHAR(100),
    modelo                VARCHAR(100),
    serial                VARCHAR(100),
    estado                VARCHAR(50),
    ubicacion             VARCHAR(200),
    asignado_a            VARCHAR(200),
    fecha_asignacion      DATE,
    numero_placa          VARCHAR(100),
    sede                  VARCHAR(200),
    prestado_a_empresa_id INTEGER REFERENCES empresas(id),
    procesador            VARCHAR(200),
    ram                   VARCHAR(100),
    disco_duro            VARCHAR(100),
    sistema_operativo     VARCHAR(200),
    garantia              INTEGER,         -- días totales de garantía
    especificaciones      TEXT,
    eliminado             BOOLEAN   DEFAULT FALSE,
    eliminado_en          TIMESTAMP,
    eliminado_por         INTEGER REFERENCES usuarios(id),
    created_at            TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 8. PERIFERICOS
-- ============================================================
CREATE TABLE IF NOT EXISTS perifericos (
    id          SERIAL PRIMARY KEY,
    equipo_id   INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tipo_id     INTEGER REFERENCES tipo_dispositivo(id),
    marca       VARCHAR(100),
    modelo      VARCHAR(100),
    serial      VARCHAR(100),
    descripcion TEXT
);


-- ============================================================
-- 9. MANTENIMIENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS mantenimientos (
    id                  SERIAL PRIMARY KEY,
    equipo_id           INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    fecha_mantenimiento DATE    NOT NULL,
    tipo                VARCHAR(50),
    descripcion         TEXT,
    tecnico             VARCHAR(200),
    costo               NUMERIC(10, 2),
    created_at          TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 10. PLACAS  (activos fijos / asset tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS placas (
    id               SERIAL PRIMARY KEY,
    equipo_id        INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
    empresa_id       INTEGER NOT NULL REFERENCES empresas(id),
    numero           VARCHAR(100) NOT NULL,
    fecha_asignacion DATE,
    estado           VARCHAR(50) DEFAULT 'activa',   -- activa | inactiva | perdida
    notas            TEXT,
    asignado_por     INTEGER REFERENCES usuarios(id),
    created_at       TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 11. HISTORIAL_ACCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_acciones (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER REFERENCES usuarios(id),
    empresa_id  INTEGER REFERENCES empresas(id),
    equipo_id   INTEGER REFERENCES equipos(id) ON DELETE SET NULL,
    accion      VARCHAR(50) NOT NULL,
    descripcion TEXT,
    ip          VARCHAR(45),
    fecha       TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_equipos_empresa        ON equipos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_equipos_sede           ON equipos(sede_id);
CREATE INDEX IF NOT EXISTS idx_equipos_usuario        ON equipos(asignado_usuario_id);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo           ON equipos(tipo_id);
CREATE INDEX IF NOT EXISTS idx_perifericos_equipo     ON perifericos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo  ON mantenimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_sedes_empresa          ON sedes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_placas_equipo          ON placas(equipo_id);
CREATE INDEX IF NOT EXISTS idx_placas_empresa         ON placas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historial_equipo       ON historial_acciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario      ON historial_acciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha        ON historial_acciones(fecha);


COMMIT;
