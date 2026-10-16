# Ejecución en contenedores (Docker)

Stack: **db** (MariaDB 10.4) · **backend** (Express + mysql2) · **frontend** (Vite + React).
Definido en [`docker-compose.yml`](../docker-compose.yml). Es un entorno de **desarrollo**: el
código se monta en vivo y hay hot-reload en backend (nodemon) y frontend (HMR).

## 1. Requisito: instalar Docker Desktop

En esta máquina **Docker no está instalado**. Pasos (Windows 10 Pro):

1. Descargar **Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/
2. En el instalador dejar marcado **"Use WSL 2 instead of Hyper-V"**.
3. Si pide habilitar características de Windows, abrir **PowerShell como Administrador** y ejecutar:
   ```powershell
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   wsl --install
   ```
4. **Reiniciar** el equipo.
5. Abrir Docker Desktop una vez y aceptar los términos. Verificar en una terminal:
   ```bash
   docker version
   docker compose version
   ```

## 2. Levantar todo

Desde la raíz del proyecto:

```bash
docker compose up --build
```

- Primer arranque: construye las imágenes e **importa** `backend/db/schema_mariadb.sql` y
  `backend/db/data_mariadb.sql` en la BD `lucoa` (solo la primera vez, mientras el volumen
  `db_data` esté vacío).
- Frontend: http://localhost:5180
- Backend:  http://localhost:5080
- MariaDB:  `localhost:3307` (usuario `root`, sin contraseña) — puerto 3307 para no chocar
  con el MySQL de XAMPP.

Puertos propios de este proyecto (5080 / 5180) para no chocar con otros proyectos que
también usen `localhost:5173` o `localhost:5000`.

Parar: `Ctrl+C`, o desde otra terminal `docker compose down`.

## 3. Comandos útiles

| Acción | Comando |
|---|---|
| Levantar en segundo plano | `docker compose up -d --build` |
| Ver logs | `docker compose logs -f backend` |
| Parar y borrar contenedores | `docker compose down` |
| Parar y **borrar los datos** de la BD (re-importa el volcado) | `docker compose down -v` |
| Reconstruir solo una imagen | `docker compose build backend` |
| Abrir shell en un contenedor | `docker compose exec backend sh` |
| Cliente MySQL de la BD | `docker compose exec db mysql -uroot lucoa` |
| Reinstalar dependencias tras cambiar package.json | `docker compose build backend && docker compose up -d backend` |

## 4. Notas

- **`.env`**: el backend usa `backend/.env` (`env_file`) para `SECRET_KEY`, `SMTP_*`, `APP_URL`…
  Las variables `DB_*` las fija `docker-compose.yml` (`DB_HOST=db`) y tienen prioridad sobre el `.env`.
- **node_modules**: viven en volúmenes de Docker (`backend_node_modules`, `frontend_node_modules`),
  no se mezclan con los del host. Si algo raro pasa con dependencias: `docker compose down -v` y
  `docker compose up --build`.
- **Puerto 5180 ocupado**: en `docker-compose.yml`, servicio `frontend`, cambiar `"5180:5180"`
  por `"5181:5180"` y entrar por http://localhost:5181. Igual para el backend con `"5081:5080"`.
- **XAMPP**: con Docker no hace falta tener XAMPP encendido. Si lo dejas encendido no molesta
  porque la BD del contenedor va por el puerto 3307 del host.

---

## 5. Producción

Archivos aparte: [`docker-compose.prod.yml`](../docker-compose.prod.yml),
`backend/Dockerfile.prod`, `frontend/Dockerfile.prod`, `frontend/nginx.conf`.

Diferencias con el de desarrollo:

| | Desarrollo | Producción |
|---|---|---|
| Backend | `nodemon`, código montado | `node server.js`, código copiado en la imagen, sin devDependencies |
| Frontend | servidor de Vite (HMR) | `vite build` → estáticos servidos por **nginx** |
| API | el navegador pega a `localhost:5080` | el navegador pega a `/api` (relativo) y **nginx** lo reenvía al backend |
| Puertos | back 5080 + front 5180 al host | solo **un** puerto al host: `WEB_PORT` (8090) → nginx |
| BD | `MYSQL_ALLOW_EMPTY_PASSWORD` | contraseña real (`DB_ROOT_PASSWORD` en `.env.prod`) |

### Levantar

```bash
cp .env.prod.example .env.prod        # y rellenar contraseñas reales
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

App en **http://localhost:8090** (o el `WEB_PORT` que pongas).
`.env.prod` está en `.gitignore` — no se sube nunca.

### Comandos

```bash
# ver estado / logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f

# parar
docker compose -f docker-compose.prod.yml down

# parar + borrar datos de la BD (re-importa el volcado al volver a subir)
docker compose -f docker-compose.prod.yml down -v

# recompilar tras cambios de código
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### Notas de producción

- **`APP_URL` / `APP_URL_BACKEND`** deben ser la URL pública real (dominio + https) para que
  los enlaces de los correos (recuperar contraseña, invitación) y las imágenes de logo en los
  emails funcionen fuera de la máquina. En local, `http://localhost:8090` sirve para probar.
- El backend y la BD **no** se publican al host (solo `WEB_PORT`). Para depurar, descomentar
  las líneas `ports:` en `docker-compose.prod.yml`.
- Si al primer arranque nginx da **502**, es que el backend aún no estaba listo:
  `docker compose -f docker-compose.prod.yml restart frontend`.
- Para HTTPS real: poner un reverse proxy delante (Caddy / Traefik / nginx del host) que
  termine TLS y reenvíe a `WEB_PORT`.
