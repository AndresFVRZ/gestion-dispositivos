# Backend (Express + mysql2) - imagen de desarrollo con hot-reload (nodemon)
FROM node:22-bookworm-slim

# pnpm vía corepack (mismo gestor que el resto del proyecto)
RUN corepack enable

WORKDIR /app

# Instala dependencias en una capa aparte para aprovechar la caché de Docker
COPY package.json ./
RUN pnpm install

# El código se monta como volumen en docker-compose; esta copia es el fallback
COPY . .

EXPOSE 5080

# "dev" = nodemon server.js (escucha en el PORT de backend/.env = 5080)
CMD ["pnpm", "dev"]
