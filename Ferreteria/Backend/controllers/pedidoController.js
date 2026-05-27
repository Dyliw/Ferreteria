const pedidoModel = require('../models/pedidoModel');
const estadoPedidoModel = require('../models/estadoPedidoModel');
const clienteModel = require('../models/clienteModel');

class PedidoController {

    async crearPedido(req, res) {
        try {
            const datos = req.body;
            const id_empleado = req.usuario?.id_empleado || datos.id_empleado;
            
            if (!id_empleado) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del empleado es requerido'
                });
            }
            
            // Validaciones
            if (!datos.id_cliente) {
                return res.status(400).json({
                    success: false,
                    message: 'El cliente es requerido'
                });
            }
            
            if (!datos.productos || datos.productos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El pedido debe tener al menos un producto'
                });
            }
            
            // Verificar que el cliente exista
            const cliente = await clienteModel.obtenerPorId(datos.id_cliente);
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }
            
            const pedido = await pedidoModel.crearPedido({
                ...datos,
                id_empleado
            });
            
            res.status(201).json({
                success: true,
                message: 'Pedido creado exitosamente',
                data: pedido
            });
            
        } catch (error) {
            console.error('Error al crear pedido:', error);
            
            if (error.message.includes('Stock insuficiente')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al crear pedido',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async listarPedidos(req, res) {
        try {
            const filtros = req.query;
            
            const resultado = await pedidoModel.listarPedidos(filtros);
            
            res.json({
                success: true,
                data: resultado.data,
                pagination: resultado.pagination,
                filters: filtros
            });
            
        } catch (error) {
            console.error('Error al listar pedidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar pedidos'
            });
        }
    }

    async obtenerPedido(req, res) {
        try {
            const { id } = req.params;
            
            const pedido = await pedidoModel.obtenerPedidoPorId(id);
            
            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: pedido
            });
            
        } catch (error) {
            console.error('Error al obtener pedido:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener pedido'
            });
        }
    }

    async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { id_estado, observaciones } = req.body;
            const id_usuario = req.usuario?.id_usuario || 1;
            
            if (!id_estado) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del nuevo estado es requerido'
                });
            }
            
            const pedidoActualizado = await pedidoModel.actualizarEstado(
                id,
                id_estado,
                id_usuario,
                observaciones
            );
            
            res.json({
                success: true,
                message: 'Estado del pedido actualizado',
                data: pedidoActualizado
            });
            
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            
            if (error.message.includes('No se puede cambiar')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message === 'Pedido no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado del pedido'
            });
        }
    }

    async obtenerHistorial(req, res) {
        try {
            const { id } = req.params;

            const pedido = await pedidoModel.obtenerPedidoPorId(id);
            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }
            
            const historial = await pedidoModel.obtenerHistorialPedido(id);
            
            res.json({
                success: true,
                data: historial,
                pedido: {
                    id: pedido.id_pedido,
                    folio: pedido.folio,
                    cliente: pedido.cliente_nombre
                }
            });
            
        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial del pedido'
            });
        }
    }

    async obtenerEstados(req, res) {
        try {
            const estados = await estadoPedidoModel.obtenerTodos();
            
            res.json({
                success: true,
                data: estados
            });
            
        } catch (error) {
            console.error('Error al obtener estados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estados de pedido'
            });
        }
    }

    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await pedidoModel.obtenerEstadisticas();
            
            res.json({
                success: true,
                data: estadisticas
            });
            
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de pedidos'
            });
        }
    }
}

module.exports = new PedidoController();