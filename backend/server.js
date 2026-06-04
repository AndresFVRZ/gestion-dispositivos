require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/public', require('express').static(require('path').join(__dirname, 'public')));

// Middleware de autenticación para obtener el usuario de la sesión
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;
      console.log('🔐 Usuario autenticado:', req.user?.email);
    } catch (error) {
      console.error('Token inválido:', error.message);
    }
  }
  next();
});

// Importar rutas
const authRoutes = require('./routes/auth');
const empresaRoutes = require('./routes/empresas');
const equipoRoutes = require('./routes/equipos');
const historialRoutes = require('./routes/historial');
const usuariosRoutes = require('./routes/usuarios');
const sedesRoutes = require('./routes/sedes');
const placasRoutes = require('./routes/placas');
const tipoDispositivoRoutes = require('./routes/tipoDispositivo');

app.get('/', (req, res) => {
    res.json({ message: 'API funcionando', version: '1.0.0' });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sedes', sedesRoutes);
app.use('/api/placas', placasRoutes);
app.use('/api/tipo-dispositivo', tipoDispositivoRoutes);

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('✅ Listo para usar\n');
});