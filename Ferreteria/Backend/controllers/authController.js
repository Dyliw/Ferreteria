const authModel = require('../models/authModel');
const jwt = require('jsonwebtoken');

class AuthController {
    
    // Login
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }
            
            const usuario = await authModel.verificarCredenciales(username, password);
            
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario o contraseña incorrectos'
                });
            }
            
            // Actualizar último acceso
            await authModel.actualizarUltimoAcceso(usuario.id_usuario);
            
            const token = jwt.sign(
                { 
                    id_usuario: usuario.id_usuario,
                    id_persona: usuario.id_persona,
                    username: usuario.username,
                    id_rol: usuario.id_rol,
                    nombre_rol: usuario.nombre_rol,
                    nombre_completo: usuario.nombre_completo,
                    id_empleado: usuario.id_empleado
                },
                process.env.JWT_SECRET || 'mi_secreto_super_seguro',
                { expiresIn: '8h' }
            );
            
            delete usuario.password;
            
            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    usuario,
                    token,
                    expires_in: 28800
                }
            });
            
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
    
    // Verificar token
    async verificarToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_secreto_super_seguro');
            
            const usuario = await authModel.obtenerPorId(decoded.id_usuario);
            
            if (!usuario || !usuario.activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Sesión inválida'
                });
            }
            
            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    usuario,
                    expira_en: decoded.exp
                }
            });
            
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al verificar token'
            });
        }
    }
    
    // Logout
    async logout(req, res) {
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    }
    
    // Obtener perfil
    async obtenerPerfil(req, res) {
        try {
            const usuario = await authModel.obtenerPorId(req.usuario.id_usuario);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: usuario
            });
            
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil'
            });
        }
    }
}

module.exports = new AuthController();