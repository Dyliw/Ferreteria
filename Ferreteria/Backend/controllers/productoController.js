const productoModel = require('../models/productoModel');
const categoriaModel = require('../models/categoriaModel');
const impuestoModel = require('../models/impuestoModel');
const listaPreciosModel = require('../models/listaPreciosModel');
const { query } = require('../config/database');

class ProductoController {

    async registrar(req, res) {
        try {
            const datos = req.body;

            if (!datos.nombre_producto) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del producto es obligatorio'
                });
            }
            
            if (!datos.id_categoria) {
                return res.status(400).json({
                    success: false,
                    message: 'La categoría es obligatoria'
                });
            }
            
            if (!datos.precio_base || datos.precio_base <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio base debe ser mayor a 0'
                });
            }
            
            const producto = await productoModel.crear(datos);
            
            res.status(201).json({
                success: true,
                message: 'Producto registrado exitosamente',
                data: producto
            });
            
        } catch (error) {
            console.error('Error al registrar producto:', error);
            
            if (error.message.includes('SKU') || error.message.includes('duplicate')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un producto con ese SKU'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno al registrar producto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async listar(req, res) {
        try {
            const filtros = req.query;
            
            const resultado = await productoModel.listar(filtros);
            
            res.json({
                success: true,
                data: resultado.data,
                pagination: resultado.pagination,
                filters: filtros
            });
            
        } catch (error) {
            console.error('Error al listar productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar productos'
            });
        }
    }

    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            
            const producto = await productoModel.obtenerPorId(id);
            
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: producto
            });
            
        } catch (error) {
            console.error('Error al obtener producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener producto'
            });
        }
    }
  
    async consultarStock(req, res) {
        try {
            const { id } = req.params;
            
            const stock = await productoModel.consultarStock(id);
            
            if (!stock) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: stock
            });
            
        } catch (error) {
            console.error('Error al consultar stock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al consultar stock'
            });
        }
    }
    // Actualizar peso Y stock (nueva tanda)
async actualizarPesoYStock(req, res) {
    try {
        const { id } = req.params;
        const { nuevo_peso_kg, cantidad_nueva_tanda, lote, proveedor, observaciones } = req.body;
        const id_usuario = req.usuario?.id_usuario || 1;
        
        if (!nuevo_peso_kg || nuevo_peso_kg <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo peso debe ser mayor a 0'
            });
        }
        
        if (!cantidad_nueva_tanda || cantidad_nueva_tanda <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad de la nueva tanda debe ser mayor a 0'
            });
        }
        
        const producto = await productoModel.actualizarPesoYOStock(
            id, nuevo_peso_kg, cantidad_nueva_tanda, id_usuario, lote, proveedor, observaciones
        );
        
        res.json({
            success: true,
            message: `Peso y stock actualizados exitosamente. Se agregaron ${cantidad_nueva_tanda} unidades.`,
            data: producto
        });
        
    } catch (error) {
        console.error('Error al actualizar peso y stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar peso y stock del producto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
    // Consultar stock de múltiples productos
    async consultarStockMultiple(req, res) {
        try {
            const { ids } = req.body;
            
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de IDs de productos'
                });
            }
            
            const stocks = await productoModel.consultarStockMultiple(ids);
            
            res.json({
                success: true,
                data: stocks
            });
            
        } catch (error) {
            console.error('Error al consultar stock múltiple:', error);
            res.status(500).json({
                success: false,
                message: 'Error al consultar stock'
            });
        }
    }

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;
            
            const productoActualizado = await productoModel.actualizar(id, datos);
            
            res.json({
                success: true,
                message: 'Producto actualizado exitosamente',
                data: productoActualizado
            });
            
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            
            if (error.message === 'Producto no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al actualizar producto'
            });
        }
    }
    
    // Desactivar/Activar producto
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;
            
            if (activo === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'El estado (activo) es requerido'
                });
            }
            
            const producto = await productoModel.actualizar(id, { activo });
            
            res.json({
                success: true,
                message: `Producto ${activo ? 'activado' : 'desactivado'} exitosamente`,
                data: producto
            });
            
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del producto'
            });
        }
    }

    async asignarImpuesto(req, res) {
        try {
            const { id } = req.params;
            const { id_impuesto, aplica } = req.body;
            
            if (!id_impuesto) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del impuesto es requerido'
                });
            }
            
            await productoModel.asignarImpuesto(id, id_impuesto, aplica !== false);
            
            res.json({
                success: true,
                message: `Impuesto ${aplica !== false ? 'asignado' : 'desasignado'} exitosamente`
            });
            
        } catch (error) {
            console.error('Error al asignar impuesto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al asignar impuesto'
            });
        }
    }
    
    // Obtener impuestos de un producto
    async obtenerImpuestos(req, res) {
        try {
            const { id } = req.params;
            
            const producto = await productoModel.obtenerPorId(id);
            
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: producto.impuestos || []
            });
            
        } catch (error) {
            console.error('Error al obtener impuestos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener impuestos'
            });
        }
    }
    
    async obtenerPreciosPorCliente(req, res) {
        try {
            const { id } = req.params;
            
            const precios = await productoModel.obtenerPreciosPorCliente(id);
            
            res.json({
                success: true,
                data: precios
            });
            
        } catch (error) {
            console.error('Error al obtener precios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener precios por cliente'
            });
        }
    }
    
    async configurarPrecioEspecial(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;
            
            const resultado = await productoModel.configurarPrecioEspecial({
                id_producto: id,
                id_lista: datos.id_lista,
                id_tipo_cliente: datos.id_tipo_cliente,
                nombre_tipo_cliente: datos.nombre_tipo_cliente,
                cantidad_minima: datos.cantidad_minima,
                cantidad_maxima: datos.cantidad_maxima,
                precio_unitario: datos.precio_unitario,
                activo: datos.activo
            });
            
            res.json({
                success: true,
                message: 'Precio especial configurado exitosamente',
                data: resultado
            });
            
        } catch (error) {
            console.error('Error al configurar precio especial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al configurar precio especial'
            });
        }
    }

async actualizarPeso(req, res) {
    try {
        const { id } = req.params;
        const { nuevo_peso_kg, lote, proveedor, observaciones } = req.body;
        const id_usuario = req.usuario?.id_usuario || 1;
        
        if (!nuevo_peso_kg || nuevo_peso_kg <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo peso debe ser mayor a 0'
            });
        }
        
        // Llamar al procedimiento almacenado
        const sqlQuery = `
            EXEC sp_ActualizarPesoProducto 
                @id_producto = @id_producto,
                @nuevo_peso_kg = @nuevo_peso_kg,
                @id_usuario = @id_usuario,
                @lote = @lote,
                @proveedor = @proveedor,
                @observaciones = @observaciones
        `;
        
        const params = {
            id_producto: parseInt(id),
            nuevo_peso_kg: parseFloat(nuevo_peso_kg),
            id_usuario: id_usuario,
            lote: lote || null,
            proveedor: proveedor || null,
            observaciones: observaciones || null
        };
        
        await query(sqlQuery, params);
        
        // Obtener producto actualizado
        const producto = await productoModel.obtenerPorId(id);
        
        res.json({
            success: true,
            message: 'Peso actualizado exitosamente',
            data: producto
        });
        
    } catch (error) {
        console.error('Error al actualizar peso:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar peso del producto'
        });
    }
}
    
    async obtenerCategorias(req, res) {
    try {
        const soloActivas = req.query.activo === 'true' || req.query.activo === undefined;
        const categorias = await categoriaModel.obtenerTodos(soloActivas);
        
        console.log('Categorías devueltas:', categorias.length); // Depuración
        
        res.json({
            success: true,
            data: categorias,
            total: categorias.length
        });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
    async obtenerImpuestosDisponibles(req, res) {
        try {
            const { activo } = req.query;
            const impuestos = await impuestoModel.obtenerTodos(activo !== 'false');
            
            res.json({
                success: true,
                data: impuestos
            });
            
        } catch (error) {
            console.error('Error al obtener impuestos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener impuestos'
            });
        }
    }
    
    async obtenerListasPrecios(req, res) {
        try {
            const listas = await listaPreciosModel.obtenerTodas(true);
            
            res.json({
                success: true,
                data: listas
            });
            
        } catch (error) {
            console.error('Error al obtener listas de precios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener listas de precios'
            });
        }
    }
    
    
    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await productoModel.obtenerEstadisticas();
            
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

async crearCategoria(req, res) {
    try {
        const { nombre_categoria, descripcion } = req.body;
        
        if (!nombre_categoria || nombre_categoria.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es obligatorio'
            });
        }
        
        const nuevaCategoria = await categoriaModel.crear({
            nombre_categoria: nombre_categoria.trim(),
            descripcion: descripcion || null
        });
        
        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: nuevaCategoria
        });
        
    } catch (error) {
        console.error('Error al crear categoría:', error);
        
        if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al crear categoría'
        });
    }
}

async actualizarCategoria(req, res) {
    try {
        const { id } = req.params;
        const { nombre_categoria, descripcion, activo } = req.body;
        
        const categoriaActualizada = await categoriaModel.actualizar(id, {
            nombre_categoria,
            descripcion,
            activo
        });
        
        if (!categoriaActualizada) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            data: categoriaActualizada
        });
        
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar categoría'
        });
    }
}

async eliminarCategoria(req, res) {
    try {
        const { id } = req.params;
        
        await categoriaModel.eliminar(id);
        
        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        
        if (error.message.includes('tiene productos')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al eliminar categoría'
        });
    }
}

// Obtener categoría por ID
async obtenerCategoriaPorId(req, res) {
    try {
        const { id } = req.params;
        
        const categoria = await categoriaModel.obtenerPorId(id);
        
        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: categoria
        });
        
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoría'
        });
    }
}
}

module.exports = new ProductoController();