const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'EMTRA_SECRET_KEY_2024';

const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }
        
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ 
                success: false, 
                message: `Acceso denegado. Roles requeridos: ${rolesPermitidos.join(', ')}`
            });
        }
        
        next();
    };
};

module.exports = { verificarToken, verificarRol };