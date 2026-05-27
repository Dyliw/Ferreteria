const { query, callProcedure, executeFunction } = require('../config/database');
const productoModel = require('./productoModel');

class InventarioModel {

    async registrarEntrada(datos) {
        const {
            id_producto,
            cantidad,
            id_usuario,
            observaciones,
            lote,
            proveedor,
            costo_unitario,
            factura,
            fecha_entrada
        } = datos;

        if (!id_producto) throw new Error('Producto requerido');
        if (!cantidad || cantidad <= 0) throw new Error('Cantidad debe ser mayor a 0');
        if (!id_usuario) throw new Error('Usuario requerido');

        try {
            const result = await callProcedure('sp_RegistrarEntradaInventario', {
                id_producto,
                cantidad,
                observaciones: observaciones || `Entrada de ${cantidad} unidades - Factura: ${factura || 'N/A'}`,
                id_usuario
            });
            
            // El SP no tiene output definido, pero actualiza stock y registra movimientos
            const productoActualizado = await productoModel.obtenerPorId(id_producto);
            
            return {
                success: true,
                producto: productoActualizado,
                message: `Entrada registrada: +${cantidad} unidades`
            };
        } catch (error) {
            console.error('Error en registrarEntrada:', error);
            throw new Error(`No se pudo registrar la entrada: ${error.message}`);
        }
    }
    
    async registrarNuevaTanda(datos) {
        const {
            id_producto,
            nuevo_peso_kg,
            cantidad_nueva_tanda,
            id_usuario,
            lote,
            proveedor,
            observaciones
        } = datos;

        if (!id_producto) throw new Error('Producto requerido');
        if (!nuevo_peso_kg || nuevo_peso_kg <= 0) throw new Error('Peso válido requerido');
        if (!cantidad_nueva_tanda || cantidad_nueva_tanda <= 0) throw new Error('Cantidad positiva requerida');
        if (!id_usuario) throw new Error('Usuario requerido');

        try {
            const result = await callProcedure('sp_RegistrarNuevaTanda', {
                id_producto,
                nuevo_peso_kg,
                cantidad_nueva_tanda,
                id_usuario,
                lote: lote || null,
                proveedor: proveedor || null,
                observaciones: observaciones || null
            });

            const productoActualizado = result.recordset && result.recordset[0] 
                ? result.recordset[0] 
                : await productoModel.obtenerPorId(id_producto);
            
            return {
                success: true,
                producto: productoActualizado,
                message: `Nueva tanda registrada: +${cantidad_nueva_tanda} unidades, peso promedio actualizado`
            };
        } catch (error) {
            console.error('Error en registrarNuevaTanda:', error);
            throw new Error(`No se pudo registrar la nueva tanda: ${error.message}`);
        }
    }
    async registrarAjuste(datos) {
        const { id_producto, cantidad, id_usuario, motivo, tipo_ajuste } = datos;
        
        if (!id_producto) throw new Error('Producto requerido');
        if (!cantidad || cantidad <= 0) throw new Error('Cantidad debe ser mayor a 0');
        if (!motivo) throw new Error('Motivo requerido');
        
        const producto = await productoModel.obtenerPorId(id_producto);
        if (!producto) throw new Error('Producto no encontrado');
        
        const cantidadAjuste = tipo_ajuste === 'INCREMENTO' ? cantidad : -cantidad;
        const stock_antes = producto.stock_actual;
        const stock_despues = stock_antes + cantidadAjuste;
        
        if (stock_despues < 0) {
            throw new Error(`Stock negativo. Actual: ${stock_antes}, Reducción: ${cantidad}`);
        }

        const tipoMovResult = await query(
            `SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre_movimiento = 'AJUSTE_INVENTARIO'`
        );
        if (tipoMovResult.recordset.length === 0) {
            throw new Error('Tipo de movimiento AJUSTE_INVENTARIO no encontrado');
        }
        const id_tipo_movimiento = tipoMovResult.recordset[0].id_tipo_movimiento;
        
        // Usar transacción
        const pool = require('../config/database').getPool();
        const transaction = new (require('mssql').Transaction)(await pool);
        try {
            await transaction.begin();
            const request = transaction.request();
            
            // Actualizar stock
            await request
                .input('id_producto', id_producto)
                .input('stock_despues', stock_despues)
                .query(`UPDATE productos SET stock_actual = @stock_despues WHERE id_producto = @id_producto`);
            
            // Insertar movimiento
            const movResult = await request
                .input('id_producto', id_producto)
                .input('id_tipo_movimiento', id_tipo_movimiento)
                .input('cantidad', Math.abs(cantidadAjuste))
                .input('stock_antes', stock_antes)
                .input('stock_despues', stock_despues)
                .input('observaciones', `Ajuste ${tipo_ajuste}: ${motivo}`)
                .input('id_usuario', id_usuario)
                .query(`
                    INSERT INTO movimientos_inventario (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, referencia_tabla, observaciones, id_usuario)
                    OUTPUT INSERTED.id_movimiento
                    VALUES (@id_producto, @id_tipo_movimiento, @cantidad, @stock_antes, @stock_despues, 'AJUSTE', @observaciones, @id_usuario)
                `);
            
            await transaction.commit();
            
            return {
                success: true,
                id_movimiento: movResult.recordset[0].id_movimiento,
                producto: {
                    id_producto,
                    nombre: producto.nombre_producto,
                    stock_antes,
                    stock_despues,
                    cantidad_ajustada: cantidadAjuste,
                    tipo_ajuste
                }
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async obtenerResumen() {
    const sql = `
        SELECT 
            COUNT(*) AS total_productos,
            SUM(stock_actual) AS total_unidades,
            SUM(stock_actual * precio_base) AS valor_inventario,
            SUM(CASE WHEN stock_actual <= 0 THEN 1 ELSE 0 END) AS productos_agotados,
            SUM(CASE WHEN stock_actual < stock_minimo THEN 1 ELSE 0 END) AS productos_stock_bajo,
            AVG(precio_base) AS precio_promedio
        FROM productos
        WHERE activo = 1
    `;
    const result = await query(sql);
    return result.recordset[0];
}

    async listarMovimientos(filtros = {}) {
        let sqlQuery = `
            SELECT 
                m.id_movimiento, m.fecha_movimiento,
                FORMAT(m.fecha_movimiento, 'dd/MM/yyyy HH:mm') AS fecha_formato,
                p.id_producto, p.nombre_producto, p.sku,
                tm.id_tipo_movimiento, tm.nombre_movimiento, tm.signo,
                CASE WHEN tm.signo = 1 THEN 'ENTRADA' ELSE 'SALIDA' END AS tipo_movimiento,
                m.cantidad, m.stock_antes, m.stock_despues,
                m.referencia_tabla, m.referencia_id, m.observaciones,
                u.id_usuario, u.username AS usuario_nombre,
                (m.stock_despues - m.stock_antes) AS diferencia
            FROM movimientos_inventario m
            INNER JOIN productos p ON m.id_producto = p.id_producto
            INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
            LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
            WHERE 1=1
        `;
        const params = {};
        
        if (filtros.id_producto) {
            sqlQuery += ` AND m.id_producto = @id_producto`;
            params.id_producto = filtros.id_producto;
        }
        if (filtros.id_tipo_movimiento) {
            sqlQuery += ` AND m.id_tipo_movimiento = @id_tipo_movimiento`;
            params.id_tipo_movimiento = filtros.id_tipo_movimiento;
        }
        if (filtros.tipo === 'ENTRADA') {
            sqlQuery += ` AND tm.signo = 1`;
        } else if (filtros.tipo === 'SALIDA') {
            sqlQuery += ` AND tm.signo = -1`;
        }
        if (filtros.fecha_desde) {
            sqlQuery += ` AND m.fecha_movimiento >= @fecha_desde`;
            params.fecha_desde = filtros.fecha_desde;
        }
        if (filtros.fecha_hasta) {
            sqlQuery += ` AND m.fecha_movimiento <= @fecha_hasta`;
            params.fecha_hasta = filtros.fecha_hasta;
        }
        
        const ordenCampo = filtros.orden_campo || 'm.fecha_movimiento';
        const ordenDireccion = filtros.orden_direccion === 'ASC' ? 'ASC' : 'DESC';
        sqlQuery += ` ORDER BY ${ordenCampo} ${ordenDireccion}`;
        
        const pagina = parseInt(filtros.pagina) || 1;
        const limite = parseInt(filtros.limite) || 50;
        const offset = (pagina - 1) * limite;
        
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM movimientos_inventario m
            INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
            WHERE 1=1
            ${filtros.id_producto ? ' AND m.id_producto = @id_producto' : ''}
            ${filtros.id_tipo_movimiento ? ' AND m.id_tipo_movimiento = @id_tipo_movimiento' : ''}
            ${filtros.tipo === 'ENTRADA' ? ' AND tm.signo = 1' : ''}
            ${filtros.tipo === 'SALIDA' ? ' AND tm.signo = -1' : ''}
            ${filtros.fecha_desde ? ' AND m.fecha_movimiento >= @fecha_desde' : ''}
            ${filtros.fecha_hasta ? ' AND m.fecha_movimiento <= @fecha_hasta' : ''}
        `;
        const countResult = await query(countQuery, params);
        const total = countResult.recordset[0].total;
        
        sqlQuery += ` OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
        params.offset = offset;
        params.limite = limite;
        
        const result = await query(sqlQuery, params);
        
        let resumen = null;
        if (filtros.incluir_resumen === 'true') {
            const resumenQuery = `
                SELECT 
                    COUNT(*) AS total_movimientos,
                    ISNULL(SUM(CASE WHEN tm.signo = 1 THEN m.cantidad ELSE 0 END), 0) AS total_entradas,
                    ISNULL(SUM(CASE WHEN tm.signo = -1 THEN m.cantidad ELSE 0 END), 0) AS total_salidas,
                    COUNT(DISTINCT m.id_producto) AS productos_afectados
                FROM movimientos_inventario m
                INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
                WHERE 1=1
                ${filtros.id_producto ? ' AND m.id_producto = @id_producto' : ''}
                ${filtros.fecha_desde ? ' AND m.fecha_movimiento >= @fecha_desde' : ''}
                ${filtros.fecha_hasta ? ' AND m.fecha_movimiento <= @fecha_hasta' : ''}
            `;
            const resumenResult = await query(resumenQuery, params);
            resumen = resumenResult.recordset[0];
        }
        
        return {
            data: result.recordset,
            pagination: { total, pagina, limite, total_paginas: Math.ceil(total / limite) },
            resumen
        };
    }
   
    async obtenerMovimientoPorId(id_movimiento) {
        const sqlQuery = `
            SELECT m.*, p.nombre_producto, p.sku, tm.nombre_movimiento, u.username
            FROM movimientos_inventario m
            INNER JOIN productos p ON m.id_producto = p.id_producto
            INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
            LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
            WHERE m.id_movimiento = @id_movimiento
        `;
        const result = await query(sqlQuery, { id_movimiento });
        return result.recordset[0] || null;
    }
 
    async reporteStockBajo() {
        const sql = `SELECT * FROM vw_ProductosStockBajo ORDER BY faltante_para_minimo DESC`;
        const result = await query(sql);
        return result.recordset;
    }
    
    async calcularPesoPromedio(id_producto, tipo = 'PROMEDIO') {
        const result = await executeFunction('CalcularPesoPromedio', { id_producto, tipo_promedio: tipo });
        const peso = result[0]?.peso || result[0]?.peso_promedio || 0;
        return peso;
    }
    
    async reporteRotacion(filtros = {}) {
        const dias = filtros.dias || 30;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        
        const sqlQuery = `
            WITH VentasPeriodo AS (
                SELECT dv.id_producto, SUM(dv.cantidad) AS total_vendido
                FROM detalle_venta dv
                INNER JOIN ventas v ON dv.id_venta = v.id_venta
                WHERE v.fecha_venta >= @fechaLimite AND v.cancelada = 0
                GROUP BY dv.id_producto
            )
            SELECT 
                p.id_producto, p.nombre_producto, p.sku, p.stock_actual, p.precio_base,
                ISNULL(vp.total_vendido, 0) AS vendido_ultimos_${dias}_dias,
                CASE 
                    WHEN ISNULL(vp.total_vendido, 0) = 0 THEN 'SIN MOVIMIENTO'
                    WHEN p.stock_actual = 0 THEN 'AGOTADO'
                    WHEN p.stock_actual / vp.total_vendido <= 0.5 THEN 'ROTACIÓN RÁPIDA'
                    WHEN p.stock_actual / vp.total_vendido <= 1 THEN 'ROTACIÓN MEDIA'
                    ELSE 'ROTACIÓN LENTA'
                END AS nivel_rotacion,
                CASE 
                    WHEN ISNULL(vp.total_vendido, 0) = 0 THEN 9999
                    ELSE p.stock_actual / vp.total_vendido
                END AS meses_rotacion
            FROM productos p
            LEFT JOIN VentasPeriodo vp ON p.id_producto = vp.id_producto
            WHERE p.activo = 1
            ORDER BY meses_rotacion DESC
        `;
        const result = await query(sqlQuery, { fechaLimite });
        return result.recordset;
    }
    
    async reporteValorInventario() {
        const sqlQuery = `
            SELECT 
                c.id_categoria, c.nombre_categoria,
                COUNT(p.id_producto) AS total_productos,
                SUM(p.stock_actual) AS total_unidades,
                SUM(p.stock_actual * p.precio_base) AS valor_inventario,
                AVG(p.precio_base) AS precio_promedio,
                SUM(CASE WHEN p.stock_actual <= 0 THEN 1 ELSE 0 END) AS productos_agotados,
                SUM(CASE WHEN p.stock_actual < p.stock_minimo THEN 1 ELSE 0 END) AS productos_stock_bajo
            FROM productos p
            INNER JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.activo = 1
            GROUP BY c.id_categoria, c.nombre_categoria
            ORDER BY valor_inventario DESC
        `;
        const result = await query(sqlQuery);
        const totalGeneral = result.recordset.reduce((acc, curr) => ({
            total_unidades: acc.total_unidades + curr.total_unidades,
            valor_inventario: acc.valor_inventario + curr.valor_inventario,
            total_productos: acc.total_productos + curr.total_productos
        }), { total_unidades: 0, valor_inventario: 0, total_productos: 0 });
        
        return { por_categoria: result.recordset, total_general: totalGeneral };
    }
    
    async obtenerDashboard() {
        const estadisticasQuery = `
            SELECT 
                (SELECT COUNT(*) FROM productos WHERE activo = 1) AS total_productos,
                (SELECT COUNT(*) FROM productos WHERE stock_actual <= 0 AND activo = 1) AS productos_agotados,
                (SELECT COUNT(*) FROM productos WHERE stock_actual < stock_minimo AND activo = 1) AS productos_stock_bajo,
                (SELECT ISNULL(SUM(stock_actual * precio_base), 0) FROM productos WHERE activo = 1) AS valor_inventario,
                (SELECT ISNULL(SUM(stock_actual), 0) FROM productos WHERE activo = 1) AS total_unidades
        `;
        const estadisticas = await query(estadisticasQuery);
        
        const ultimosMovimientosQuery = `
            SELECT TOP 10
                m.id_movimiento, m.fecha_movimiento,
                FORMAT(m.fecha_movimiento, 'dd/MM/yyyy HH:mm') AS fecha_formato,
                p.id_producto, p.nombre_producto,
                tm.nombre_movimiento,
                CASE WHEN tm.signo = 1 THEN 'ENTRADA' ELSE 'SALIDA' END AS tipo_movimiento,
                m.cantidad, m.stock_despues,
                u.username AS usuario_nombre
            FROM movimientos_inventario m
            INNER JOIN productos p ON m.id_producto = p.id_producto
            INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
            LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
            ORDER BY m.fecha_movimiento DESC
        `;
        const ultimosMovimientos = await query(ultimosMovimientosQuery);
        
        const movimientosPorTipoQuery = `
            SELECT 
                tm.nombre_movimiento,
                COUNT(*) AS total_movimientos,
                ISNULL(SUM(CASE WHEN tm.signo = 1 THEN m.cantidad ELSE 0 END), 0) AS entradas,
                ISNULL(SUM(CASE WHEN tm.signo = -1 THEN m.cantidad ELSE 0 END), 0) AS salidas
            FROM movimientos_inventario m
            INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
            WHERE m.fecha_movimiento >= DATEADD(DAY, -30, GETDATE())
            GROUP BY tm.nombre_movimiento, tm.signo
            ORDER BY total_movimientos DESC
        `;
        const movimientosPorTipo = await query(movimientosPorTipoQuery);
        
        const topProductosQuery = `
            SELECT TOP 10
                p.id_producto, p.nombre_producto,
                COUNT(*) AS total_movimientos,
                ISNULL(SUM(m.cantidad), 0) AS total_unidades_movidas
            FROM movimientos_inventario m
            INNER JOIN productos p ON m.id_producto = p.id_producto
            WHERE m.fecha_movimiento >= DATEADD(DAY, -90, GETDATE())
            GROUP BY p.id_producto, p.nombre_producto
            ORDER BY total_unidades_movidas DESC
        `;
        const topProductos = await query(topProductosQuery);
        
        return {
            estadisticas: estadisticas.recordset[0],
            ultimos_movimientos: ultimosMovimientos.recordset,
            movimientos_por_tipo: movimientosPorTipo.recordset,
            top_productos: topProductos.recordset
        };
    }
}

module.exports = new InventarioModel();