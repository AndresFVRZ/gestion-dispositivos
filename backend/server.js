require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require('./routes/auth');
const empresaRoutes = require('./routes/empresas');
const equipoRoutes = require('./routes/equipos');
const historialRoutes = require('./routes/historial');
const usuariosRoutes = require('./routes/usuarios');

app.get('/', (req, res) => {
    res.json({ message: 'API funcionando', version: '1.0.0' });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('✅ Listo para usar\n');
});