# Bitácora Técnica — Sistema de Gestión de Equipos EMTRA
**Última actualización:** 2026-07-01  
**Versión del sistema:** 1.0  
**Base de datos:** `lucoa` (PostgreSQL 13+)

---

## 1. Stack Tecnológico

### Backend
| Componente | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express 4.x |
| Base de datos | PostgreSQL 13+ (driver: `pg`) |
| Autenticación | JWT (`jsonwebtoken`) |
| Encriptado de contraseñas | `bcryptjs` (salt 10) |
| Correo electrónico | Nodemailer (SMTP) |
| Variables de entorno | `dotenv` |
| Dev server | Nodemon |

### Frontend
| Componente | Tecnología |
|---|---|
| Framework | React 19 (SPA) |
| Build tool | Vite 8 |
| Enrutamiento | React Router v7 |
| HTTP | Axios |
| Estilos | Tailwind CSS v4 + CSS modules en `src/styles/` |
| Notificaciones | `react-hot-toast` |
| Generación PDF | `jspdf` + `jspdf-autotable` |
| Exportación Excel | `xlsx` |
| Iconos | `react-icons` v5 |
| Tipografía | Inter (`@fontsource/inter`) |

---

## 2. Arquitectura del Sistema

```
gestion de equipos/
├── backend/
│   ├── config/
│   │   └── db.js              # Pool de conexión PostgreSQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── equiposController.js
│   │   ├── historialController.js
│   │   ├── mantenimientosController.js
│   │   ├── placasController.js
│   │   ├── procesosController.js
│   │   ├── sedesController.js
│   │   └── tipoDispositivoController.js
│   ├── middleware/
│   │   └── auth.js            # verificarToken / verificarRol
│   ├── migrations/
│   │   └── 002_nuevos_roles.sql
│   ├── routes/
│   │   ├── auth.js
│   │   ├── empresas.js
│   │   ├── equipos.js
│   │   ├── historial.js
│   │   ├── index.js
│   │   ├── mantenimientos.js
│   │   ├── placas.js
│   │   ├── procesos.js
│   │   ├── sedes.js
│   │   ├── tipoDispositivo.js
│   │   └── usuarios.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── tokenService.js
│   ├── utils/
│   │   └── helpers.js         # registrarHistorial()
│   ├── public/logos/          # Logos de empresas (PNG)
│   └── server.js              # Entry point — puerto 5000
│
├── frontend/
│   └── src/
│       ├── assets/            # Logos para el frontend
│       ├── components/
│       │   ├── Common/
│       │   │   ├── ConfirmModal.jsx
│       │   │   ├── ImportModal.jsx
│       │   │   └── LoadingOverlay.jsx
│       │   ├── Layout/
│       │   │   └── Sidebar.jsx
│       │   └── perfil/
│       │       └── ModalCambiarPassword.jsx
│       ├── context/
│       │   └── AuthContext.jsx  # Estado global de autenticación
│       ├── pages/             # Una página por ruta/rol
│       ├── services/          # Wrappers de Axios por módulo
│       ├── styles/            # CSS separado por componente
│       ├── utils/
│       │   ├── garantia.js
│       │   └── logos.js
│       ├── App.jsx            # Router + AuthProvider + layout
│       └── main.jsx
│
└── docs/
    ├── schema.sql             # Esquema completo (idempotente)
    ├── migracion.sql          # Migración v1 (2026-06-02)
    ├── migracion_procesos.sql # Migración v2 (2026-06-09)
    ├── migracion_tipos_dispositivo.sql
    ├── seed_tipos_dispositivo.sql
    ├── bitacora_tecnica.md    # Este archivo
    └── bitacora_proyecto.md
```

---

## 3. Esquema de Base de Datos

### Relaciones generales
```
empresas ─┬──< sedes
          ├──< procesos
          ├──< equipos
          ├──< placas
          └──< usuario_empresas >── usuarios

usuarios ──< usuario_empresas

equipos ─┬──< perifericos
         ├──< mantenimientos
         ├──< placas
         └──< historial_acciones

tipo_dispositivo ──< equipos (tipo_id)
tipo_dispositivo ──< perifericos (tipo_id)
```

---

### Tabla: `empresas`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `nombre` | VARCHAR(200) NOT NULL | |
| `logo` | TEXT | URL o base64 |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

---

### Tabla: `roles`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `nombre` | VARCHAR(50) UNIQUE | |
| `descripcion` | TEXT | |
| `created_at` | TIMESTAMP | |

**Valores actuales:**
`super_admin`, `administrador`, `logistica`, `soporte`, `gerencia`, `financiera`, `gestion`, `visualizador`

---

### Tabla: `usuarios`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `nombre` | VARCHAR(200) | |
| `email` | VARCHAR(200) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt |
| `rol_id` | INTEGER FK → roles | |
| `empresa_id` | INTEGER FK → empresas | (legacy) |
| `estado` | VARCHAR(20) | `pendiente` / `activo` / `inactivo` |
| `reset_token` | VARCHAR(255) | recuperación de contraseña |
| `reset_token_expires_at` | TIMESTAMP | |
| `invitation_token` | VARCHAR(255) | activación de cuenta |
| `invitation_expires_at` | TIMESTAMP | expira en 24h |
| `created_at` | TIMESTAMP | |

---

### Tabla: `usuario_empresas` (pivote N:N)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL | |
| `usuario_id` | INTEGER FK → usuarios | PK compuesta |
| `empresa_id` | INTEGER FK → empresas | PK compuesta |
| `created_at` | TIMESTAMP | |

---

### Tabla: `sedes`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `empresa_id` | INTEGER FK → empresas | CASCADE DELETE |
| `nombre` | VARCHAR(200) | |
| `ubicacion` | VARCHAR(300) | |
| `created_at` | TIMESTAMP | |

---

### Tabla: `tipo_dispositivo`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `nombre` | VARCHAR(100) | |
| `categoria` | VARCHAR(20) | CHECK: `equipo` / `periferico` |
| `descripcion` | TEXT | |
| `created_at` | TIMESTAMP | |

**Valores de equipos:** Desktop, Portátil, Todo en uno, Servidor, Tablet, Workstation  
**Valores de periféricos:** Mouse, Teclado, Monitor, Audífonos, Cámara web, Impresora, UPS, Otro

---

### Tabla: `procesos` (áreas organizacionales)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `empresa_id` | INTEGER FK → empresas | CASCADE DELETE |
| `nombre` | VARCHAR(200) | UNIQUE por empresa |
| `descripcion` | TEXT | |
| `created_at` | TIMESTAMP | |

**Constraint:** `UNIQUE(empresa_id, nombre)`  
**Áreas predeterminadas:** BAJA, COMERCIAL, CALIDAD, DISPONIBLE, FINANCIERA SCI, GERENCIA, GESTION HUMANA, IT, JURIDICA, LOGISTICA, PLANTA, PRODUCCION, SST, TESORERIA, TX

---

### Tabla: `equipos`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `empresa_id` | INTEGER FK → empresas | |
| `sede_id` | INTEGER FK → sedes | |
| `proceso_id` | INTEGER FK → procesos | SET NULL on delete |
| `asignado_usuario_id` | INTEGER FK → usuarios | |
| `codigo` | VARCHAR(100) | |
| `nombre_equipo` | VARCHAR(200) NOT NULL | |
| `tipo_id` | INTEGER FK → tipo_dispositivo | solo categoría `equipo` |
| `marca` | VARCHAR(100) | |
| `modelo` | VARCHAR(100) | |
| `serial` | VARCHAR(100) | |
| `estado` | VARCHAR(50) | |
| `ubicacion` | VARCHAR(200) | |
| `asignado_a` | VARCHAR(200) | nombre libre |
| `fecha_asignacion` | DATE | |
| `numero_placa` | VARCHAR(100) | |
| `sede` | VARCHAR(200) | (legacy texto) |
| `prestado_a_empresa_id` | INTEGER FK → empresas | préstamos inter-empresa |
| `procesador` | VARCHAR(200) | |
| `ram` | VARCHAR(100) | |
| `disco_duro` | VARCHAR(100) | |
| `sistema_operativo` | VARCHAR(200) | |
| `garantia` | INTEGER | días totales de garantía |
| `especificaciones` | TEXT | campos extra (JSON o texto) |
| `eliminado` | BOOLEAN | DEFAULT FALSE (soft delete) |
| `eliminado_en` | TIMESTAMP | |
| `eliminado_por` | INTEGER FK → usuarios | |
| `created_at` | TIMESTAMP | |

---

### Tabla: `perifericos`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `equipo_id` | INTEGER FK → equipos | CASCADE DELETE |
| `tipo_id` | INTEGER FK → tipo_dispositivo | solo categoría `periferico` |
| `marca` | VARCHAR(100) | |
| `modelo` | VARCHAR(100) | |
| `serial` | VARCHAR(100) | |
| `descripcion` | TEXT | |

---

### Tabla: `mantenimientos`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `equipo_id` | INTEGER FK → equipos | CASCADE DELETE |
| `fecha_mantenimiento` | DATE NOT NULL | |
| `tipo` | VARCHAR(50) | preventivo / correctivo |
| `descripcion` | TEXT | |
| `tecnico` | VARCHAR(200) | |
| `costo` | NUMERIC(10,2) | |
| `estado_anterior` | VARCHAR(50) | para trazabilidad |
| `created_at` | TIMESTAMP | |

---

### Tabla: `placas` (activos fijos / asset tags)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `equipo_id` | INTEGER FK → equipos | CASCADE DELETE |
| `empresa_id` | INTEGER FK → empresas | NOT NULL |
| `numero` | VARCHAR(100) NOT NULL | número de placa |
| `fecha_asignacion` | DATE | |
| `estado` | VARCHAR(50) | `activa` / `inactiva` / `perdida` |
| `notas` | TEXT | |
| `asignado_por` | INTEGER FK → usuarios | |
| `created_at` | TIMESTAMP | |

---

### Tabla: `historial_acciones`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `usuario_id` | INTEGER FK → usuarios | |
| `empresa_id` | INTEGER FK → empresas | |
| `equipo_id` | INTEGER FK → equipos | SET NULL on delete |
| `accion` | VARCHAR(50) NOT NULL | ver tipos abajo |
| `descripcion` | TEXT | detalles de la acción |
| `ip` | VARCHAR(45) | IP del cliente |
| `fecha` | TIMESTAMP | DEFAULT NOW() |

**Tipos de acción:** `CREAR`, `EDITAR`, `MANTENIMIENTO_CREAR`, `MANTENIMIENTO_EDITAR`, `MANTENIMIENTO_ELIMINAR`, `MANTENIMIENTO_COMPLETAR`, `MANTENIMIENTO_APROBAR`, `MANTENIMIENTO_RECHAZAR`

---

## 4. Índices de Base de Datos

```sql
idx_procesos_empresa        ON procesos(empresa_id)
idx_equipos_empresa         ON equipos(empresa_id)
idx_equipos_sede            ON equipos(sede_id)
idx_equipos_proceso         ON equipos(proceso_id)
idx_equipos_usuario         ON equipos(asignado_usuario_id)
idx_equipos_tipo            ON equipos(tipo_id)
idx_perifericos_equipo      ON perifericos(equipo_id)
idx_mantenimientos_equipo   ON mantenimientos(equipo_id)
idx_sedes_empresa           ON sedes(empresa_id)
idx_placas_equipo           ON placas(equipo_id)
idx_placas_empresa          ON placas(empresa_id)
idx_historial_equipo        ON historial_acciones(equipo_id)
idx_historial_usuario       ON historial_acciones(usuario_id)
idx_historial_fecha         ON historial_acciones(fecha)
```

---

## 5. API REST — Endpoints

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <JWT>` en todos los endpoints protegidos  
**JWT expira:** 8 horas

### /auth
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/auth/logo-sistema` | No | Logo EMTRA para la pantalla de login |
| POST | `/auth/login` | No | Login → devuelve JWT |
| GET | `/auth/activar/:token` | No | Verifica token de invitación |
| POST | `/auth/activar` | No | Activa cuenta con token + contraseña |
| PUT | `/auth/password/:id` | No | Cambia contraseña |
| POST | `/auth/forgot-password` | No | Envía email de recuperación |
| POST | `/auth/reset-password` | No | Restablece contraseña con token |

### /equipos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/equipos` | Sí | Todos los equipos (filtrado por rol/empresas) |
| GET | `/equipos/:id` | Sí | Equipo por ID con periféricos |
| GET | `/equipos/empresa/:empresaId` | Sí | Equipos por empresa |
| POST | `/equipos` | Sí | Crear equipo |
| PUT | `/equipos/:id` | Sí | Actualizar equipo |
| POST | `/equipos/:id/reasignar-perifericos` | Sí | Mueve periféricos a otro equipo |

### /usuarios
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/usuarios` | Sí | Todos los usuarios activos |
| POST | `/usuarios` | Sí | Crear usuario + enviar invitación |
| POST | `/usuarios/:id/reenviar-invitacion` | Sí | Reenviar email de activación |
| PUT | `/usuarios/:id` | Sí | Actualizar usuario |
| DELETE | `/usuarios/:id` | Sí | Soft delete (estado → inactivo) |

### /empresas
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/empresas` | Sí | Todas las empresas |
| POST | `/empresas` | Sí | Crear empresa |
| PUT | `/empresas/:id` | Sí | Actualizar empresa |
| DELETE | `/empresas/:id` | Sí | Eliminar empresa |

### /mantenimientos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/mantenimientos` | Sí | Todos los mantenimientos |
| POST | `/mantenimientos` | Sí | Registrar mantenimiento |
| PUT | `/mantenimientos/:id` | Sí | Editar mantenimiento |
| DELETE | `/mantenimientos/:id` | Sí | Eliminar mantenimiento |

### /placas
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/placas` | Sí | Todas las placas |
| POST | `/placas` | Sí | Crear placa |
| PUT | `/placas/:id` | Sí | Actualizar placa |
| DELETE | `/placas/:id` | Sí | Eliminar placa |

### /sedes
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/sedes` | Sí | Todas las sedes |
| POST | `/sedes` | Sí | Crear sede |
| PUT | `/sedes/:id` | Sí | Actualizar sede |
| DELETE | `/sedes/:id` | Sí | Eliminar sede |

### /procesos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/procesos` | Sí | Todos los procesos/áreas |
| POST | `/procesos` | Sí | Crear proceso |
| PUT | `/procesos/:id` | Sí | Actualizar proceso |
| DELETE | `/procesos/:id` | Sí | Eliminar proceso |

### /tipo-dispositivo
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/tipo-dispositivo` | Sí | Todos los tipos |
| POST | `/tipo-dispositivo` | Sí | Crear tipo |
| PUT | `/tipo-dispositivo/:id` | Sí | Actualizar tipo |
| DELETE | `/tipo-dispositivo/:id` | Sí | Eliminar tipo |

### /historial
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/historial` | Sí | Historial con filtros (`accion`, `fecha_desde`, `fecha_hasta`, `sin_limite`) |

---

## 6. Autenticación y JWT

El token JWT incluye:
```json
{
  "id": 1,
  "email": "usuario@empresa.com",
  "nombre": "Nombre Apellido",
  "rol": "logistica",
  "empresas": [{ "id": 2, "nombre": "EMTRA" }]
}
```

- El servidor valida el JWT en cada request vía middleware global (`server.js`) y lo adjunta en `req.user`.
- El middleware `verificarToken` en `middleware/auth.js` también popula `req.usuario` para los controladores.
- Los tokens de recuperación de contraseña se guardan **en memoria** (`Map`), no en base de datos. Se pierden si el servidor reinicia.

---

## 7. Servicio de Email (Nodemailer)

Variables de entorno requeridas:
```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
APP_URL=          # URL del frontend (para enlaces de activación)
APP_URL_BACKEND=  # URL del backend (para logos en emails)
```

Emails enviados:
- **Invitación de cuenta:** al crear usuario (`POST /usuarios`), enlace expira en 24h
- **Reenvío de invitación:** `POST /usuarios/:id/reenviar-invitacion`
- **Recuperación de contraseña:** `POST /auth/forgot-password`, enlace expira en 1h

---

## 8. Seguridad de Equipos — Soft Delete

Los equipos no se eliminan físicamente. Se marcan con:
```sql
eliminado = TRUE
eliminado_en = NOW()
eliminado_por = <usuario_id>
```
Las queries del sistema filtran `WHERE eliminado = FALSE` por defecto.

---

## 9. Variables de Entorno del Backend (`.env`)

```
PORT=5000
DB_HOST=
DB_PORT=5432
DB_NAME=lucoa
DB_USER=
DB_PASSWORD=
SECRET_KEY=        # clave para firmar JWT
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
APP_URL=           # https://tu-frontend.com
APP_URL_BACKEND=   # https://tu-backend.com
```
