const inventarioModel = require('../models/inventarioModel');
const productoModel = require('../models/productoModel');
const tipoMovimientoModel = require('../models/tipoMovimientoModel');

class InventarioController {

    async registrarEntrada(req, res) {
        try {
            const datos = req.body;
            const id_usuario = req.usuario?.id_usuario || 1;
            
            // Validaciones
            if (!datos.id_producto) {
                return res.status(400).json({
                    success: false,
                    message: 'El producto es requerido'
                });
            }
            
            if (!datos.cantidad || datos.cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }
            
            const producto = await productoModel.obtenerPorId(datos.id_producto);
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            const resultado = await inventarioModel.registrarEntrada({
                ...datos,
                id_usuario
            });
            
            res.status(201).json({
                success: true,
                message: 'Entrada de inventario registrada exitosamente',
                data: resultado
            });
            
        } catch (error) {
            console.error('Error al registrar entrada:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar entrada de inventario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async registrarAjuste(req, res) {
        try {
            const datos = req.body;
            const id_usuario = req.usuario?.id_usuario || 1;
            
            // Validaciones
            if (!datos.id_producto) {
                return res.status(400).json({
                    success: false,
                    message: 'El producto es requerido'
                });
            }
            
            if (!datos.cantidad || datos.cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }
            
            if (!datos.tipo_ajuste || !['INCREMENTO', 'DECREMENTO'].includes(datos.tipo_ajuste)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de ajuste inválido. Debe ser INCREMENTO o DECREMENTO'
                });
            }
            
            if (!datos.motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'El motivo del ajuste es requerido'
                });
            }
            const producto = await productoModel.obtenerPorId(datos.id_producto);
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            const resultado = await inventarioModel.registrarAjuste({
                ...datos,
                id_usuario
            });
            
            res.status(201).json({
                success: true,
                message: 'Ajuste de inventario registrado exitosamente',
                data: resultado
            });
            
        } catch (error) {
            console.error('Error al registrar ajuste:', error);
            
            if (error.message.includes('stock negativo')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al registrar ajuste de inventario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async listarMovimientos(req, res) {
        try {
            const filtros = req.query;
            
            const resultado = await inventarioModel.listarMovimientos(filtros);
            
            res.json({
                success: true,
                data: resultado.data,
                pagination: resultado.pagination,
                resumen: resultado.resumen,
                filters: filtros
            });
            
        } catch (error) {
            console.error('Error al listar movimientos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar movimientos de inventario'
            });
        }
    }
 
    async obtenerMovimientosPorProducto(req, res) {
        try {
            const { id } = req.params;
            const filtros = req.query;
 
            const producto = await productoModel.obtenerPorId(id);
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            const resultado = await inventarioModel.obtenerMovimientosPorProducto(id, filtros);
            
            res.json({
                success: true,
                producto: {
                    id: producto.id_producto,
                    nombre: producto.nombre_producto,
                    sku: producto.sku,
                    stock_actual: producto.stock_actual
                },
                data: resultado.data,
                pagination: resultado.pagination
            });
            
        } catch (error) {
            console.error('Error al obtener movimientos del producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener movimientos del producto'
            });
        }
    }
    
    // Obtener detalle de un movimiento
    async obtenerMovimientoPorId(req, res) {
        try {
            const { id } = req.params;
            
            const movimiento = await inventarioModel.obtenerMovimientoPorId(id);
            
            if (!movimiento) {
                return res.status(404).json({
                    success: false,
                    message: 'Movimiento no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: movimiento
            });
            
        } catch (error) {
            console.error('Error al obtener movimiento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener detalle del movimiento'
            });
        }
    }

    async obtenerTiposMovimiento(req, res) {
        try {
            const tipos = await tipoMovimientoModel.obtenerTodos();
            
            res.json({
                success: true,
                data: tipos
            });
            
        } catch (error) {
            console.error('Error al obtener tipos de movimiento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tipos de movimiento'
            });
        }
    }
    

    async reporteRotacion(req, res) {
        try {
            const { dias } = req.query;
            
            const reporte = await inventarioModel.reporteRotacion({ dias: dias || 30 });

            const stats = {
                total_productos: reporte.length,
                sin_movimiento: reporte.filter(p => p.vendido_ultimos_30_dias === 0).length,
                rotacion_rapida: reporte.filter(p => p.nivel_rotacion === 'ROTACIÓN RÁPIDA').length,
                rotacion_lenta: reporte.filter(p => p.nivel_rotacion === 'ROTACIÓN LENTA').length,
                promedio_rotacion: reporte.reduce((acc, p) => acc + p.meses_rotacion, 0) / reporte.length
            };
            
            res.json({
                success: true,
                data: reporte,
                estadisticas: stats,
                filtros: { dias: dias || 30 }
            });
            
        } catch (error) {
            console.error('Error al generar reporte de rotación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte de rotación'
            });
        }
    }
    
    async reporteValorInventario(req, res) {
        try {
            const reporte = await inventarioModel.reporteValorInventario();
            
            res.json({
                success: true,
                data: reporte
            });
            
        } catch (error) {
            console.error('Error al generar reporte de valor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte de valor de inventario'
            });
        }
    }
    
    async reporteStockBajo(req, res) {
        try {
            const reporte = await inventarioModel.reporteStockBajo();
            
            const resumen = {
                total_criticos: reporte.filter(p => p.nivel === 'CRÍTICO').length,
                total_bajos: reporte.filter(p => p.nivel === 'BAJO').length,
                total_faltante: reporte.reduce((acc, p) => acc + p.faltante, 0),
                productos: reporte
            };
            
            res.json({
                success: true,
                data: resumen
            });
            
        } catch (error) {
            console.error('Error al generar reporte de stock bajo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte de stock bajo'
            });
        }
    }
   
    async dashboard(req, res) {
        try {
            const dashboard = await inventarioModel.obtenerDashboard();
            
            res.json({
                success: true,
                data: dashboard
            });
            
        } catch (error) {
            console.error('Error al obtener dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dashboard de inventario'
            });
        }
    }
}

module.exports = new InventarioController();