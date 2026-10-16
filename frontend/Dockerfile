# Frontend (Vite + React) - imagen de desarrollo con HMR
FROM node:22-bookworm-slim

RUN corepack enable

WORKDIR /app

COPY package.json ./
RUN pnpm install

COPY . .

EXPOSE 5180

# "dev" = vite ; puerto 5180 y host 0.0.0.0 se fuerzan desde vite.config.js
CMD ["pnpm", "dev"]
