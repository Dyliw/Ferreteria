const usuarioModel = require('../models/usuarioModel');
const empleadoModel = require('../models/empleadoModel');

class UsuarioController {

    async obtenerRoles(req, res) {
        try {
            const roles = await usuarioModel.obtenerRoles();
            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            console.error('Error al obtener roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener roles'
            });
        }
    }

    async obtenerEmpleadosSinUsuario(req, res) {
        try {
            const empleados = await usuarioModel.obtenerEmpleadosSinUsuario();
            res.json({
                success: true,
                data: empleados
            });
        } catch (error) {
            console.error('Error al obtener empleados sin usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados sin usuario'
            });
        }
    }

    async crear(req, res) {
        try {
            const { id_empleado, username, password, id_rol } = req.body;

            if (!id_empleado || !username || !password || !id_rol) {
                return res.status(400).json({
                    success: false,
                    message: 'id_empleado, username, password e id_rol son requeridos'
                });
            }
            const empleado = await empleadoModel.obtenerPorId(id_empleado);
            if (!empleado) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            const usuarioExistente = await usuarioModel.obtenerPorPersona(empleado.id_persona);
            if (usuarioExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'Este empleado ya tiene un usuario asignado'
                });
            }

            const id_usuario = await usuarioModel.crear({
                id_persona: empleado.id_persona,
                username,
                password,
                id_rol
            });

            const nuevoUsuario = await usuarioModel.obtenerPorId(id_usuario);

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });

        } catch (error) {
            console.error('Error al crear usuario:', error);

            if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al crear usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async listar(req, res) {
        try {
            const filtros = req.query;
            const usuarios = await usuarioModel.listar(filtros);

            res.json({
                success: true,
                data: usuarios,
                total: usuarios.length
            });

        } catch (error) {
            console.error('Error al listar usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar usuarios'
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const usuario = await usuarioModel.obtenerPorId(id);

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
            console.error('Error al obtener usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario'
            });
        }
    }

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;

            const usuarioActualizado = await usuarioModel.actualizar(id, datos);

            res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: usuarioActualizado
            });

        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar usuario'
            });
        }
    }

    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (activo === undefined || activo === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo activo es requerido'
                });
            }

            const usuario = await usuarioModel.cambiarEstado(id, activo);

            res.json({
                success: true,
                message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
                data: usuario
            });

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del usuario'
            });
        }
    }

    async cambiarPassword(req, res) {
        try {
            const { id } = req.params;
            const { password_actual, password_nueva } = req.body;

            if (!password_actual || !password_nueva) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva son requeridas'
                });
            }

            if (password_nueva.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            await usuarioModel.cambiarPassword(id, password_actual, password_nueva);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);

            if (error.message === 'Contraseña actual incorrecta' || error.message === 'Usuario no encontrado') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al cambiar contraseña'
            });
        }
    }
}

module.exports = new UsuarioController();