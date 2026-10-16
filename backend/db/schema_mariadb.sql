-- ============================================================
--  Esquema MariaDB / MySQL (XAMPP)  -  Sistema de gestion de equipos
--  Migrado desde PostgreSQL (lucoa).  Motor: InnoDB, charset utf8mb4.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS historial_acciones;
DROP TABLE IF EXISTS mantenimientos;
DROP TABLE IF EXISTS placas;
DROP TABLE IF EXISTS perifericos;
DROP TABLE IF EXISTS equipos;
DROP TABLE IF EXISTS procesos;
DROP TABLE IF EXISTS sedes;
DROP TABLE IF EXISTS usuario_empresas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS tipo_dispositivo;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS empresas;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
--  empresas
-- ------------------------------------------------------------
CREATE TABLE empresas (
    id         INT NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(100) NOT NULL,
    logo       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  roles
-- ------------------------------------------------------------
CREATE TABLE roles (
    id          INT NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(50) NOT NULL,
    descripcion TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY roles_nombre_key (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  tipo_dispositivo
-- ------------------------------------------------------------
CREATE TABLE tipo_dispositivo (
    id          INT NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100) NOT NULL,
    categoria   VARCHAR(20)  NOT NULL,
    descripcion TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  usuarios
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id                     INT NOT NULL AUTO_INCREMENT,
    nombre                 VARCHAR(100) NOT NULL,
    email                  VARCHAR(100) NOT NULL,
    password_hash          VARCHAR(255) NOT NULL,
    rol_id                 INT NOT NULL,
    empresa_id             INT,
    estado                 VARCHAR(20) DEFAULT 'activo',
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    reset_token            VARCHAR(255),
    reset_token_expires_at DATETIME NULL DEFAULT NULL,
    rol                    VARCHAR(50) DEFAULT 'visualizador',
    invitation_token       VARCHAR(64),
    invitation_expires_at  DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY usuarios_email_key (email),
    KEY usuarios_rol_id_fkey (rol_id),
    KEY usuarios_empresa_id_fkey (empresa_id),
    CONSTRAINT usuarios_rol_id_fkey     FOREIGN KEY (rol_id)     REFERENCES roles (id),
    CONSTRAINT usuarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  usuario_empresas  (N:M usuarios <-> empresas)
-- ------------------------------------------------------------
CREATE TABLE usuario_empresas (
    id         INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    empresa_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY usuario_empresas_usuario_id_empresa_id_key (usuario_id, empresa_id),
    KEY idx_usuario_empresas_empresa (empresa_id),
    KEY idx_usuario_empresas_usuario (usuario_id),
    CONSTRAINT usuario_empresas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT usuario_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  sedes
-- ------------------------------------------------------------
CREATE TABLE sedes (
    id         INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre     VARCHAR(200) NOT NULL,
    ubicacion  VARCHAR(300),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sedes_empresa (empresa_id),
    CONSTRAINT sedes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  procesos  (areas)
-- ------------------------------------------------------------
CREATE TABLE procesos (
    id          INT NOT NULL AUTO_INCREMENT,
    empresa_id  INT NOT NULL,
    nombre      VARCHAR(200) NOT NULL,
    descripcion TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_procesos_empresa_nombre (empresa_id, nombre),
    KEY idx_procesos_empresa (empresa_id),
    CONSTRAINT procesos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  equipos
-- ------------------------------------------------------------
CREATE TABLE equipos (
    id                    INT NOT NULL AUTO_INCREMENT,
    codigo                VARCHAR(50),
    nombre_equipo         VARCHAR(100),
    marca                 VARCHAR(100),
    modelo                VARCHAR(100),
    `serial`              VARCHAR(100),
    estado                VARCHAR(50),
    ubicacion             VARCHAR(100),
    asignado_a            VARCHAR(100),
    fecha_asignacion      DATE,
    procesador            VARCHAR(100),
    ram                   VARCHAR(50),
    disco_duro            VARCHAR(100),
    sistema_operativo     VARCHAR(100),
    garantia              INT,
    fecha_fin_garantia    DATE,
    especificaciones      TEXT,
    empresa_id            INT,
    eliminado             TINYINT(1) NOT NULL DEFAULT 0,
    eliminado_en          DATETIME NULL DEFAULT NULL,
    eliminado_por         INT,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    numero_placa          VARCHAR(100),
    sede                  VARCHAR(200),
    prestado_a_empresa_id INT,
    tipo_id               INT,
    sede_id               INT,
    asignado_usuario_id   INT,
    observaciones         TEXT,
    piso                  VARCHAR(50),
    modulo                VARCHAR(50),
    proceso_id            INT,
    fecha_garantia        DATE,
    PRIMARY KEY (id),
    KEY idx_equipos_eliminado (eliminado),
    KEY idx_equipos_empresa (empresa_id),
    KEY idx_equipos_proceso (proceso_id),
    KEY idx_equipos_sede (sede_id),
    KEY idx_equipos_tipo (tipo_id),
    KEY idx_equipos_usuario (asignado_usuario_id),
    KEY equipos_eliminado_por_fkey (eliminado_por),
    KEY equipos_prestado_a_empresa_id_fkey (prestado_a_empresa_id),
    CONSTRAINT equipos_empresa_id_fkey            FOREIGN KEY (empresa_id)            REFERENCES empresas (id),
    CONSTRAINT equipos_prestado_a_empresa_id_fkey FOREIGN KEY (prestado_a_empresa_id) REFERENCES empresas (id),
    CONSTRAINT equipos_tipo_id_fkey               FOREIGN KEY (tipo_id)               REFERENCES tipo_dispositivo (id),
    CONSTRAINT equipos_sede_id_fkey               FOREIGN KEY (sede_id)               REFERENCES sedes (id),
    CONSTRAINT equipos_asignado_usuario_id_fkey   FOREIGN KEY (asignado_usuario_id)   REFERENCES usuarios (id),
    CONSTRAINT equipos_eliminado_por_fkey         FOREIGN KEY (eliminado_por)         REFERENCES usuarios (id),
    CONSTRAINT equipos_proceso_id_fkey            FOREIGN KEY (proceso_id)            REFERENCES procesos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  perifericos
-- ------------------------------------------------------------
CREATE TABLE perifericos (
    id          INT NOT NULL AUTO_INCREMENT,
    equipo_id   INT NOT NULL,
    descripcion TEXT,
    tipo_id     INT,
    marca       VARCHAR(100),
    modelo      VARCHAR(100),
    `serial`    VARCHAR(100),
    PRIMARY KEY (id),
    KEY idx_perifericos_equipo (equipo_id),
    KEY perifericos_tipo_id_fkey (tipo_id),
    CONSTRAINT perifericos_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES equipos (id) ON DELETE CASCADE,
    CONSTRAINT perifericos_tipo_id_fkey   FOREIGN KEY (tipo_id)   REFERENCES tipo_dispositivo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  placas
-- ------------------------------------------------------------
CREATE TABLE placas (
    id               INT NOT NULL AUTO_INCREMENT,
    equipo_id        INT,
    empresa_id       INT NOT NULL,
    numero           VARCHAR(100) NOT NULL,
    fecha_asignacion DATE,
    estado           VARCHAR(50) DEFAULT 'activa',
    notas            TEXT,
    asignado_por     INT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_placas_empresa (empresa_id),
    KEY idx_placas_equipo (equipo_id),
    KEY placas_asignado_por_fkey (asignado_por),
    CONSTRAINT placas_equipo_id_fkey    FOREIGN KEY (equipo_id)    REFERENCES equipos (id) ON DELETE CASCADE,
    CONSTRAINT placas_empresa_id_fkey   FOREIGN KEY (empresa_id)   REFERENCES empresas (id),
    CONSTRAINT placas_asignado_por_fkey FOREIGN KEY (asignado_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  mantenimientos
-- ------------------------------------------------------------
CREATE TABLE mantenimientos (
    id                  INT NOT NULL AUTO_INCREMENT,
    equipo_id           INT,
    fecha_mantenimiento DATE,
    tipo                VARCHAR(50),
    descripcion         TEXT,
    tecnico             VARCHAR(100),
    costo               DECIMAL(10,2),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_anterior     VARCHAR(50),
    estado_mant         VARCHAR(20) DEFAULT 'activo',
    fecha_completado    DATETIME NULL DEFAULT NULL,
    notas_completado    TEXT,
    fecha_aprobacion    DATETIME NULL DEFAULT NULL,
    notas_aprobacion    TEXT,
    aprobado_por        INT,
    PRIMARY KEY (id),
    KEY idx_mantenimientos_equipo (equipo_id),
    KEY mantenimientos_aprobado_por_fkey (aprobado_por),
    CONSTRAINT mantenimientos_equipo_id_fkey    FOREIGN KEY (equipo_id)    REFERENCES equipos (id) ON DELETE CASCADE,
    CONSTRAINT mantenimientos_aprobado_por_fkey FOREIGN KEY (aprobado_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  historial_acciones  (auditoria)
-- ------------------------------------------------------------
CREATE TABLE historial_acciones (
    id             INT NOT NULL AUTO_INCREMENT,
    usuario_id     INT,
    usuario_nombre VARCHAR(100),
    usuario_email  VARCHAR(100),
    usuario_rol    VARCHAR(50),
    accion         VARCHAR(50),
    equipo_id      INT,
    equipo_codigo  VARCHAR(50),
    equipo_nombre  VARCHAR(100),
    detalles       TEXT,
    ip_address     VARCHAR(50),
    empresa_id     INT,
    fecha          DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_historial_empresa (empresa_id),
    KEY idx_historial_equipo (equipo_id),
    KEY idx_historial_fecha (fecha),
    KEY idx_historial_usuario (usuario_id),
    CONSTRAINT historial_acciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
