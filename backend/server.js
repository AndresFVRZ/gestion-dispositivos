require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Sin SECRET_KEY cualquiera podría firmar tokens válidos: no arrancar.
if (!process.env.SECRET_KEY) {
    console.error('❌ Falta SECRET_KEY en el entorno (.env). El servidor no puede arrancar.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5080;

// En producción el backend va detrás de nginx: confiar en un salto de proxy
// para que el rate-limit vea la IP real del cliente.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Orígenes permitidos para CORS (lista separada por comas). Por defecto, el frontend.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || process.env.APP_URL || 'http://localhost:5180')
    .split(',').map(o => o.trim()).filter(Boolean);

// Los logos de /public se cargan desde el frontend (otro origen) y desde los correos.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: '10mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Importar rutas
const authRoutes = require('./routes/auth');
const empresaRoutes = require('./routes/empresas');
const equipoRoutes = require('./routes/equipos');
const auditoriaRoutes = require('./routes/auditoria');
const usuariosRoutes = require('./routes/usuarios');
const sedesRoutes = require('./routes/sedes');
const placasRoutes = require('./routes/placas');
const tipoDispositivoRoutes = require('./routes/tipoDispositivo');
const mantenimientosRoutes = require('./routes/mantenimientos');
const procesosRoutes = require('./routes/procesos');
const stockRoutes = require('./routes/stock');

app.get('/', (req, res) => {
    res.json({ message: 'API funcionando', version: '1.0.0' });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sedes', sedesRoutes);
app.use('/api/placas', placasRoutes);
app.use('/api/tipo-dispositivo', tipoDispositivoRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/procesos', procesosRoutes);
app.use('/api/stock', stockRoutes);

// Solo escuchar al ejecutarse directamente (los tests importan `app`)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log('✅ Listo para usar\n');
    });
}

module.exports = app;
