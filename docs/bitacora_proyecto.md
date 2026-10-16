# Bitácora del Proyecto — Sistema de Gestión de Equipos EMTRA
**Última actualización:** 2026-07-01  
**Repositorio:** Branch activo: `prueba` | Branch principal: `main`  
**Desarrollador:** AndresFVRZ

---

## 1. Descripción General

Sistema web multi-empresa para gestión de inventario tecnológico. Permite registrar, consultar y auditar equipos de cómputo, periféricos, mantenimientos y activos fijos (placas) para las empresas del grupo EMTRA.

**Empresas del sistema:**
- Accesalud
- EMTRA
- EMTRASUR
- Inprosalud Plus
- Sertti
- SCI (Soluciones Corporativas)
- SI MADRID

---

## 2. Módulos Implementados

### 2.1 Autenticación
- Login con JWT (expira en 8 horas)
- Activación de cuenta por invitación por correo (token de 24h)
- Recuperación de contraseña por email (token en memoria, 1h)
- Cambio de contraseña desde perfil

### 2.2 Gestión de Usuarios
- CRUD completo de usuarios
- Asignación de rol y empresas por usuario
- Reenvío de invitación de activación
- Soft delete (estado → `inactivo`)
- Restricción: rol `financiera` solo puede tener 1 empresa asignada

### 2.3 Gestión de Empresas
- CRUD de empresas con logo
- Selector de empresa en dashboards y en el módulo de Equipos

### 2.4 Gestión de Equipos (módulo central)
- Registro completo: código, tipo, marca, modelo, serial, estado, ubicación
- Asignación a: sede, proceso/área, usuario, persona (nombre libre)
- Campos técnicos: procesador, RAM, disco duro, sistema operativo, garantía
- Campos adicionales personalizados (especificaciones JSON)
- Periféricos adjuntos por equipo (Mouse, Teclado, Monitor, etc.)
- Préstamos inter-empresa (`prestado_a_empresa_id`)
- Importación masiva por archivo Excel/CSV
- Filtros: empresa, tipo, estado, búsqueda por texto
- Paginación configurable
- Soft delete (baja de equipo)
- Selección múltiple para operaciones en lote
- Stepper de creación en pasos (datos generales → técnicos → garantía → periféricos)

### 2.5 Gestión de Mantenimientos
- Registro de mantenimientos preventivos y correctivos por equipo
- Campos: fecha, tipo, descripción, técnico, costo, estado anterior
- Historial de mantenimientos por equipo
- Flujo de aprobación (crear → completar → aprobar/rechazar)
- Alertas de garantía en dashboards

### 2.6 Placas (Activos Fijos / Asset Tags)
- CRUD de placas vinculadas a equipos
- Estados: `activa`, `inactiva`, `perdida`
- Filtros por empresa, estado y texto libre

### 2.7 Procesos (Áreas Organizacionales)
- CRUD de áreas por empresa
- Áreas predeterminadas: IT, GERENCIA, LOGISTICA, COMERCIAL, CALIDAD, BAJA, etc.
- Relación con equipos (a qué área está asignado cada equipo)

### 2.8 Sedes
- CRUD de sedes por empresa
- Vinculación de equipos a sede específica

### 2.9 Historial de Acciones
- Registro automático de todas las acciones sobre equipos
- Filtros: tipo de acción, rango de fechas
- Exportación a PDF (jsPDF, con agrupación por tipo), CSV y TXT
- Acceso: Super Admin y roles con permiso

### 2.10 Dashboards por Rol
Cada rol tiene su propio dashboard con KPIs y vistas relevantes:

| Rol | Dashboard | Acceso a módulos |
|---|---|---|
| `super_admin` | SuperAdminDashboard | Todo: equipos, usuarios, empresas, historial, mantenimientos |
| `administrador` | AdministradorDashboard | Equipos, usuarios, historial |
| `logistica` | LogisticaDashboard | Equipos, historial |
| `soporte` | SoporteDashboard | Equipos, mantenimientos, historial |
| `gerencia` | GerenciaDashboard | Equipos (Baja/Canibalizar), historial |
| `financiera` | FinancieraDashboard | Solo lectura de equipos |
| `gestion` / `visualizador` | GestionDashboard | Vista de equipos por empresa |

---

## 3. Historial de Migraciones de Base de Datos

### v0 — Estado inicial
- Tablas base: `empresas`, `roles`, `usuarios`, `usuario_empresas`, `equipos`, `historial_acciones`
- Roles originales: solo `super_admin`, `gestion`, `visualizador`

### v1 — 2026-06-02 (`docs/migracion.sql`)
Cambios aplicados:
- `empresas`: agregar columnas `logo`, `created_at`
- `roles`: agregar `descripcion`, `created_at`
- `usuarios`: agregar `empresa_id`, `created_at`, `reset_token`, `reset_token_expires_at`
- `usuario_empresas`: agregar `id` serial y `created_at`
- Nueva tabla: `sedes`
- `equipos`: agregar `sede_id`, `asignado_usuario_id`, `numero_placa`
- Nueva tabla: `tipo_periferico` (reemplazada luego por `tipo_dispositivo`)
- Nueva tabla: `perifericos`
- Nueva tabla: `mantenimientos`
- `historial_acciones`: renombrar columna `created_at` → `fecha`
- Nueva tabla: `placas`
- Nuevos índices de rendimiento

### v2 — 2026-06-09 (`docs/migracion_procesos.sql`)
Cambios aplicados:
- Nueva tabla: `procesos` (áreas organizacionales por empresa)
  - Constraint UNIQUE por `(empresa_id, nombre)`
- `equipos`: agregar `proceso_id`
- `mantenimientos`: agregar `estado_anterior`
- Semilla de 15 áreas predeterminadas para todas las empresas existentes

### v3 — `docs/migracion_tipos_dispositivo.sql` + `docs/seed_tipos_dispositivo.sql`
- Unificación de catálogo: `tipo_periferico` reemplazado por `tipo_dispositivo`
  - Nueva columna `categoria`: `equipo` | `periferico`
  - Tipos de equipos (Desktop, Portátil, Servidor, Tablet, Workstation, Todo en uno)
  - Tipos de periféricos (Mouse, Teclado, Monitor, Audífonos, Cámara web, Impresora, UPS, Otro)

### v4 — `backend/migrations/002_nuevos_roles.sql`
Cambios aplicados:
- Nuevos roles: `administrador`, `logistica`, `soporte`, `financiera`, `gerencia`
- Migración de datos: usuarios con rol `gestion` → `logistica`
- Migración de datos: usuarios con rol `visualizador` → `financiera`
- Eliminación de roles obsoletos: `gestion`, `visualizador` (si no hay usuarios con ellos)

---

## 4. Sistema de Roles y Permisos

### Roles activos
| Rol | Nivel | Descripción |
|---|---|---|
| `super_admin` | 0 — Máximo | Acceso total a todas las empresas y módulos |
| `administrador` | 1 | Gestión completa de equipos y usuarios en sus empresas |
| `logistica` | 2 | Inventario de equipos, sin gestión de usuarios |
| `soporte` | 3 | Mantenimientos, asignación de proceso y persona |
| `gerencia` | 4 | Autoriza bajas y canibalizaciones |
| `financiera` | 5 | Solo lectura; una sola empresa asignada |
| `gestion` | Legacy | Equivale a logistica (en desuso) |
| `visualizador` | Legacy | Equivale a financiera (en desuso) |

### Reglas de filtrado de datos
- `super_admin`: ve todas las empresas sin restricción
- Cualquier otro rol: ve solo las empresas asignadas en `usuario_empresas`
- Rol `financiera`: solo puede tener 1 empresa asignada

---

## 5. Flujos Principales del Sistema

### Alta de usuario nuevo
1. Super Admin o Administrador crea usuario desde `/usuarios`
2. Backend genera `invitation_token` (24h) y envía email con link
3. Usuario accede a `/activar?token=<token>`
4. Frontend verifica el token con `GET /auth/activar/:token`
5. Usuario ingresa y confirma contraseña
6. Backend activa la cuenta: `estado → activo`, borra el token de invitación

### Registro de equipo nuevo
1. Usuario accede a `/equipos` y hace clic en "Nuevo equipo"
2. Stepper de 4 pasos:
   - **Paso 1:** Datos generales (nombre, código, tipo, marca, modelo, serial, estado, sede, proceso)
   - **Paso 2:** Datos técnicos (procesador, RAM, disco, SO)
   - **Paso 3:** Garantía y placa
   - **Paso 4:** Periféricos adjuntos
3. Backend crea el equipo y sus periféricos
4. Se registra automáticamente en `historial_acciones` con acción `CREAR`

### Recuperación de contraseña
1. Usuario accede a `/forgot-password` e ingresa su email
2. Backend genera token (in-memory) con expiración de 1 hora
3. Usuario accede al link `APP_URL/reset-password?token=<token>`
4. Ingresa nueva contraseña → backend actualiza y elimina el token

### Importación masiva de equipos
1. Usuario descarga plantilla desde el módulo de Equipos
2. Completa el archivo Excel y lo sube
3. Frontend valida y muestra barra de progreso (ImportModal)
4. Se muestran resumen de éxitos/errores al finalizar

---

## 6. Estructura de Rutas del Frontend

Las rutas son dinámicas según el rol del usuario autenticado:

```
/login                     Pública
/forgot-password           Pública
/reset-password            Pública
/activar                   Pública (con ?token=)

— super_admin —
/super-admin               SuperAdminDashboard
/equipos                   Equipos
/usuarios                  Usuarios
/empresas                  Empresas
/historial                 Historial
/mantenimientos            Mantenimientos

— administrador —
/dashboard                 AdministradorDashboard
/equipos                   Equipos
/usuarios                  Usuarios
/historial                 Historial

— logistica —
/dashboard                 LogisticaDashboard
/equipos                   Equipos
/historial                 Historial

— soporte —
/dashboard                 SoporteDashboard
/equipos                   Equipos
/mantenimientos            Mantenimientos
/historial                 Historial

— gerencia —
/dashboard                 GerenciaDashboard
/equipos                   Equipos
/historial                 Historial

— financiera —
/dashboard                 FinancieraDashboard
/equipos                   Equipos (solo lectura)
```

---

## 7. Servicios Frontend (src/services/)

Cada servicio es un wrapper de Axios con la URL base configurada en `api.js`:

| Archivo | Módulo |
|---|---|
| `api.js` | Instancia base de Axios + interceptor de token |
| `authService.js` | Login, cambio de contraseña |
| `equiposService.js` | CRUD de equipos |
| `usuariosService.js` | CRUD de usuarios |
| `empresasService.js` | CRUD de empresas |
| `mantenimientosService.js` | CRUD de mantenimientos |
| `placasService.js` | CRUD de placas |
| `procesosService.js` | CRUD de procesos/áreas |
| `sedesService.js` | CRUD de sedes |
| `tipoDispositivoService.js` | Catálogo de tipos |
| `historialService.js` | Consulta de historial |

---

## 8. Estado Actual del Frontend (al 2026-07-01)

### Separación de estilos (en progreso)
Todos los componentes tenían sus CSS inyectados mediante `document.createElement('style')` en el módulo. Se está migrando a archivos CSS dedicados en `src/styles/`:

**CSS creados (18/20):**
- `App.css` — Splash screen y layout principal
- `Login.css` — Página de inicio de sesión
- `Sidebar.css` — Barra lateral de navegación
- `Auth.css` — ForgotPassword y ResetPassword (compartido)
- `SuperAdminDashboard.css`
- `AdministradorDashboard.css`
- `LogisticaDashboard.css`
- `SoporteDashboard.css`
- `GerenciaDashboard.css`
- `FinancieraDashboard.css`
- `VisualizadorDashboard.css`
- `GestionDashboard.css`
- `ConfirmModal.css`
- `ModalCambiarPassword.css`
- `ImportModal.css`
- `ActivarCuenta.css`
- `Historial.css`
- `Placas.css`

**Pendiente:**
- `Equipos.css` — extracción del bloque CSS del componente
- `Usuarios.css` — extracción del bloque CSS del componente
- Actualizar todos los `.jsx` para importar su CSS y eliminar el bloque `document.createElement('style')`
- Reescribir JSX de `ActivarCuenta`, `Historial`, `ConfirmModal`, `ImportModal` para usar `className` en lugar de `style={}`

---

## 9. Notas y Decisiones Técnicas

- **Reset tokens en memoria:** Los tokens de recuperación de contraseña se almacenan en un `Map` del proceso Node. Si el servidor se reinicia, los tokens activos se pierden. Para producción se recomienda persistirlos en base de datos.
- **Dual rol campo `rol`:** La tabla `usuarios` tiene tanto `rol` (VARCHAR) como `rol_id` (FK). Ambos se actualizan en sincronía desde el backend.
- **Campos técnicos de equipos:** Los campos `procesador`, `ram`, `disco_duro`, `sistema_operativo` siguen en la tabla `equipos` por compatibilidad. El plan original era migrarlos a `perifericos`, pero se mantienen como campos directos porque así los usa la UI.
- **CORS abierto:** El servidor tiene `cors()` sin restricción de origen. Acotar a los dominios permitidos antes de producción.
- **JWT sin lista negra:** No hay revocación de tokens. Al eliminar un usuario, su token sigue válido hasta expirar (8 horas).
- **Logo del sistema:** Se sirve dinámicamente desde la base de datos. Si no hay logo, la pantalla de login no lo muestra.
