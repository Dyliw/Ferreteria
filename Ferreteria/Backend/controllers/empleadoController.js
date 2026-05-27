const empleadoModel = require('../models/empleadoModel');

class EmpleadoController {

    async registrar(req, res) {
        try {
            const datos = req.body;

            if (!datos.nombre || !datos.apellidoPaterno) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre y apellido paterno son obligatorios'
                });
            }

            if (!datos.id_puesto) {
                return res.status(400).json({
                    success: false,
                    message: 'El puesto es obligatorio'
                });
            }

            const empleado = await empleadoModel.crear(datos);

            res.status(201).json({
                success: true,
                message: 'Empleado registrado exitosamente',
                data: empleado
            });

        } catch (error) {
            console.error('Error al registrar empleado:', error);

            if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un empleado con ese número de empleado o usuario'
                });
            }

            if (error.message.includes('FOREIGN KEY') || error.message.includes('id_puesto')) {
                return res.status(400).json({
                    success: false,
                    message: 'El puesto seleccionado no existe'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno al registrar empleado',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async listar(req, res) {
        try {
            const filtros = req.query;
            const resultado = await empleadoModel.listar(filtros);

            res.json({
                success: true,
                data: resultado.data,
                pagination: resultado.pagination
            });

        } catch (error) {
            console.error('Error al listar empleados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar empleados'
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const empleado = await empleadoModel.obtenerPorId(id);

            if (!empleado) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            res.json({
                success: true,
                data: empleado
            });

        } catch (error) {
            console.error('Error al obtener empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleado'
            });
        }
    }

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;

            const empleadoActualizado = await empleadoModel.actualizar(id, datos);

            res.json({
                success: true,
                message: 'Empleado actualizado exitosamente',
                data: empleadoActualizado
            });

        } catch (error) {
            console.error('Error al actualizar empleado:', error);

            if (error.message === 'Empleado no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al actualizar empleado'
            });
        }
    }

    async obtenerPuestos(req, res) {
        try {
            const puestos = await empleadoModel.obtenerPuestos();
            res.json({
                success: true,
                data: puestos
            });
        } catch (error) {
            console.error('Error al obtener puestos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener puestos'
            });
        }
    }

    async obtenerPorPuesto(req, res) {
        try {
            const { id_puesto } = req.params;
            const resultado = await empleadoModel.listar({ id_puesto, activo: 'true', limite: 100 });

            res.json({
                success: true,
                data: resultado.data
            });

        } catch (error) {
            console.error('Error al obtener empleados por puesto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados por puesto'
            });
        }
    }

    async obtenerDisponibles(req, res) {
        try {
            const resultado = await empleadoModel.listar({ activo: 'true', limite: 200 });

            res.json({
                success: true,
                data: resultado.data
            });

        } catch (error) {
            console.error('Error al obtener empleados disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados disponibles'
            });
        }
    }

    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await empleadoModel.obtenerEstadisticas();
            res.json({
                success: true,
                data: estadisticas
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }
}

module.exports = new EmpleadoController();