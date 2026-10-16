import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Puertos propios de este proyecto para no chocar con otros dev servers en localhost:
//   frontend 5180 · backend 5080
// El navegador llama a la API por VITE_API_URL (http://localhost:5080/api);
// el proxy /api de abajo solo se usa si algún fetch relativo lo necesita.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true, // si 5180 está ocupado, falla en vez de saltar a otro puerto
    host: true, // escuchar en 0.0.0.0 (necesario dentro de Docker; inofensivo en local)
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:5080',
        changeOrigin: true,
      }
    },
    // En Docker el watch de archivos por inotify no cruza el bind-mount de Windows:
    // VITE_USE_POLLING=true activa el sondeo.
    watch: process.env.VITE_USE_POLLING ? { usePolling: true, interval: 120 } : undefined,
  }
})
