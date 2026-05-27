const jwt = require('jsonwebtoken');

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó token de autenticación'
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Formato de token inválido'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_secreto_super_seguro');
        req.usuario = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Middleware para verificar rol de administrador
const verificarAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }
    
    if (req.usuario.id_rol !== 1 && req.usuario.nombre_rol !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador'
        });
    }
    
    next();
};

// Middleware para verificar rol específico
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }
        
        if (!rolesPermitidos.includes(req.usuario.id_rol) && 
            !rolesPermitidos.includes(req.usuario.nombre_rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No tienes permisos suficientes'
            });
        }
        
        next();
    };
};

module.exports = {
    verificarToken,
    verificarAdmin,
    verificarRol
};