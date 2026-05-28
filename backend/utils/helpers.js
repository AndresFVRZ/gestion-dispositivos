// utils/helpers.js

// ==========================================
// FUNCIÓN PARA CALCULAR FECHA FIN DE GARANTÍA
// ==========================================
const calcularFechaFinGarantia = (fechaAsignacion, garantiaTexto) => {
    if (!fechaAsignacion || !garantiaTexto) return null;
    
    const match = garantiaTexto.match(/\d+/);
    if (!match) return null;
    
    const meses = parseInt(match[0]);
    if (isNaN(meses) || meses <= 0) return null;
    
    const fecha = new Date(fechaAsignacion);
    fecha.setMonth(fecha.getMonth() + meses);
    return fecha.toISOString().split('T')[0];
};

// ==========================================
// FUNCIÓN PARA REGISTRAR HISTORIAL DE ACCIONES
// ==========================================
const registrarHistorial = async (pool, req, accion, equipo, detalles = '') => {
    try {
        const usuario = req.usuario;
        if (!usuario) {
            console.log('⚠️ No hay usuario en la petición, no se registra historial');
            return;
        }
        
        await pool.query(
            `INSERT INTO historial_acciones 
             (usuario_id, usuario_nombre, usuario_email, usuario_rol, accion, 
              equipo_id, equipo_codigo, equipo_nombre, detalles, ip_address, empresa_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                usuario.id,
                usuario.nombre || 'Desconocido',
                usuario.email || 'sin-email',
                usuario.rol || 'sin-rol',
                accion,
                equipo?.id || null,
                equipo?.codigo || null,
                equipo?.nombre_equipo || null,
                detalles || '',
                req.ip || req.connection?.remoteAddress || '0.0.0.0',
                equipo?.empresa_id || usuario.empresa_id || null
            ]
        );
        console.log(`📝 Historial: ${accion} - ${equipo?.codigo || 'N/A'} por ${usuario.nombre}`);
    } catch (error) {
        console.error('❌ Error al registrar historial:', error.message);
    }
};

// ==========================================
// FUNCIÓN PARA FORMATEAR FECHAS
// ==========================================
const formatearFecha = (fecha, formato = 'DD/MM/YYYY') => {
    if (!fecha) return null;
    
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return null;
    
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    
    if (formato === 'DD/MM/YYYY') {
        return `${dia}/${mes}/${anio}`;
    } else if (formato === 'YYYY-MM-DD') {
        return `${anio}-${mes}-${dia}`;
    }
    
    return `${dia}/${mes}/${anio}`;
};

// ==========================================
// EXPORTAR TODAS LAS FUNCIONES
// ==========================================
module.exports = {
    calcularFechaFinGarantia,
    registrarHistorial,
    formatearFecha
};