const clienteModel = require('../models/clienteModel');
const codigoPostalModel = require('../models/codigoPostalModel');

class ClienteController {

    async registrar(req, res) {
        try {
            const datos = req.body;

            if (!datos.nombre || !datos.apellidoPaterno) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre y apellido paterno son obligatorios'
                });
            }

            const cliente = await clienteModel.crear(datos);

            res.status(201).json({
                success: true,
                message: 'Cliente registrado exitosamente',
                data: cliente
            });

        } catch (error) {
            console.error('Error al registrar cliente:', error);

            if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un cliente con ese email, RFC o CURP'
                });
            }
            if (error.message.includes('código postal no existe')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno al registrar cliente',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async buscar(req, res) {
        try {
            const filtros = req.query;
            const resultado = await clienteModel.buscar(filtros);

            res.json({
                success: true,
                data: resultado.data,
                pagination: resultado.pagination
            });

        } catch (error) {
            console.error('Error al buscar clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar clientes'
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const cliente = await clienteModel.obtenerPorId(id);

            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            res.json({
                success: true,
                data: cliente
            });

        } catch (error) {
            console.error('Error al obtener cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener cliente'
            });
        }
    }

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;

            const clienteActualizado = await clienteModel.actualizar(id, datos);

            res.json({
                success: true,
                message: 'Cliente actualizado exitosamente',
                data: clienteActualizado
            });

        } catch (error) {
            console.error('Error al actualizar cliente:', error);

            if (error.message === 'Cliente no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al actualizar cliente'
            });
        }
    }

    async cambiarTipoCliente(req, res) {
        try {
            const { id } = req.params;
            const { id_tipo_cliente } = req.body;

            if (!id_tipo_cliente) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del tipo de cliente es requerido'
                });
            }

            const cliente = await clienteModel.cambiarTipoCliente(id, id_tipo_cliente);

            res.json({
                success: true,
                message: 'Tipo de cliente actualizado exitosamente',
                data: cliente
            });

        } catch (error) {
            console.error('Error al cambiar tipo de cliente:', error);

            if (error.message === 'Tipo de cliente no válido') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al cambiar tipo de cliente'
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

        //string "true" a booleano true
        const activoBool = activo === 'true' || activo === true || activo === 1;
        const cliente = await clienteModel.actualizar(id, { activo: activoBool });

        res.json({
            success: true,
            message: `Cliente ${activoBool ? 'activado' : 'desactivado'} exitosamente`,
            data: cliente
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        if (error.message === 'Cliente no encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del cliente'
        });
    }
}
    async buscarPorCP(req, res) {
        try {
            const { cp } = req.params;

            if (!cp || cp.length < 3 || cp.length > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Código postal inválido. Debe tener entre 3 y 5 dígitos'
                });
            }

            const resultado = await codigoPostalModel.buscar(cp);

            if (!resultado) {
                return res.status(404).json({
                    success: false,
                    message: 'Código postal no encontrado'
                });
            }

            res.json({
                success: true,
                data: resultado
       
            });

        } catch (error) {
            console.error('Error al buscar CP:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar código postal'
            });
        }
    }

    async obtenerTiposCliente(req, res) {
        try {
            const tipos = await clienteModel.obtenerTiposCliente();
            res.json({
                success: true,
                data: tipos
            });
        } catch (error) {
            console.error('Error al obtener tipos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tipos de cliente'
            });
        }
    }

    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await clienteModel.obtenerEstadisticas();
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

module.exports = new ClienteController();