const { query, callProcedure } = require('../config/database');

class ProductoModel {

    async obtenerPorId(id_producto) {
        const sql = `
            SELECT 
                p.id_producto, p.nombre_producto, p.descripcion,
                p.id_categoria, c.nombre_categoria,
                p.sku, p.stock_actual, p.stock_minimo, p.stock_maximo,
                p.precio_base, p.unidad_medida,
                p.peso_kg, p.peso_actual_kg, p.peso_anterior_kg, p.fecha_ultimo_peso,
                p.activo,
                CASE 
                    WHEN p.stock_actual <= 0 THEN 'CRÍTICO'
                    WHEN p.stock_actual < p.stock_minimo THEN 'BAJO'
                    ELSE 'NORMAL'
                END AS estado_stock,
                dbo.CalcularPesoPromedio(p.id_producto, 'PROMEDIO')   AS peso_promedio,
                dbo.CalcularPesoPromedio(p.id_producto, 'PONDERADO')  AS peso_ponderado
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = @id_producto AND p.activo = 1
        `;
        const result = await query(sql, { id_producto });
        return result.recordset[0] || null;
    }

    async listar(filtros = {}) {
        let sql = `
            SELECT 
                p.id_producto, p.nombre_producto, p.sku,
                p.stock_actual, p.stock_minimo, p.precio_base, p.unidad_medida,
                c.nombre_categoria, p.activo,
                CASE 
                    WHEN p.stock_actual <= 0 THEN 'CRÍTICO'
                    WHEN p.stock_actual < p.stock_minimo THEN 'BAJO'
                    ELSE 'NORMAL'
                END AS estado_stock
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE 1=1
        `;
        const params = {};

        if (filtros.termino) {
            sql += ` AND (p.nombre_producto LIKE @termino OR p.sku LIKE @termino OR p.descripcion LIKE @termino)`;
            params.termino = `%${filtros.termino}%`;
        } else if (filtros.buscar) {
            sql += ` AND (p.nombre_producto LIKE @buscar OR p.sku LIKE @buscar)`;
            params.buscar = `%${filtros.buscar}%`;
        }
        if (filtros.id_categoria) {
            sql += ` AND p.id_categoria = @id_categoria`;
            params.id_categoria = filtros.id_categoria;
        }
        if (filtros.stock_bajo === 'true' || filtros.solo_stock_bajo === 'true') {
            sql += ` AND p.stock_actual > 0 AND p.stock_actual < p.stock_minimo`;
        }
        if (filtros.sin_stock === 'true') {
            sql += ` AND p.stock_actual <= 0`;
        }
        if (filtros.activo !== undefined && filtros.activo !== '') {
            sql += ` AND p.activo = @activo`;
            params.activo = filtros.activo === 'true' ? 1 : 0;
        }

        const pagina  = parseInt(filtros.pagina) || 1;
        const limite  = parseInt(filtros.limite) || 20;
        const offset  = (pagina - 1) * limite;
        const orderBy = filtros.orden_campo      || 'p.nombre_producto';
        const orderDir = filtros.orden_direccion === 'ASC' ? 'ASC' : 'DESC';

        sql += ` ORDER BY ${orderBy} ${orderDir} OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
        params.offset = offset;
        params.limite = limite;

        const countParams = { ...params };
        delete countParams.offset;
        delete countParams.limite;
        const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS total FROM');

        const [countResult, dataResult] = await Promise.all([
            query(countSql, countParams),
            query(sql, params)
        ]);

        return {
            data: dataResult.recordset,
            pagination: {
                total:       countResult.recordset[0]?.total || 0,
                pagina,
                limite,
                total_paginas: Math.ceil((countResult.recordset[0]?.total || 0) / limite)
            }
        };
    }


    async crear(datos) {
        const sql = `
            INSERT INTO productos (
                nombre_producto, descripcion, id_categoria, sku,
                stock_actual, stock_minimo, stock_maximo,
                precio_base, unidad_medida, peso_kg, activo
            )
            OUTPUT INSERTED.id_producto
            VALUES (
                @nombre_producto, @descripcion, @id_categoria, @sku,
                @stock_actual, @stock_minimo, @stock_maximo,
                @precio_base, @unidad_medida, @peso_kg, @activo
            )
        `;
        const result = await query(sql, {
            nombre_producto: datos.nombre_producto, descripcion:datos.descripcion || null,id_categoria:datos.id_categoria,
            sku:datos.sku || null,stock_actual:datos.stock_actual || 0, stock_minimo: datos.stock_minimo || 10, stock_maximo: datos.stock_maximo || null,
            precio_base: datos.precio_base, unidad_medida: datos.unidad_medida || 'PZA', peso_kg: datos.peso_kg || 0,
            activo: datos.activo !== undefined ? datos.activo : 1
        });
        const id_producto = result.recordset[0].id_producto;
        return this.obtenerPorId(id_producto);
    }

    async actualizar(id_producto, datos) {
        const actual = await this.obtenerPorId(id_producto);
        if (!actual) throw new Error('Producto no encontrado');

        await query(`
            UPDATE productos SET
                nombre_producto = @nombre_producto,
                descripcion = @descripcion,
                id_categoria= @id_categoria,
                sku = @sku,
                stock_minimo = @stock_minimo,
                stock_maximo= @stock_maximo,
                precio_base = @precio_base,
                unidad_medida = @unidad_medida,
                peso_kg = @peso_kg,
                activo = @activo
            WHERE id_producto = @id_producto
        `, {
            id_producto,
            nombre_producto: datos.nombre_producto  ?? actual.nombre_producto,
            descripcion:datos.descripcion ?? actual.descripcion,
            id_categoria:datos.id_categoria ?? actual.id_categoria,
            sku: datos.sku ?? actual.sku,
            stock_minimo:datos.stock_minimo ?? actual.stock_minimo,
            stock_maximo:datos.stock_maximo ?? actual.stock_maximo,
            precio_base: datos.precio_base ?? actual.precio_base,
            unidad_medida: datos.unidad_medida ?? actual.unidad_medida,
            peso_kg: datos.peso_kg ?? actual.peso_kg,
            activo: datos.activo !== undefined ? (datos.activo ? 1 : 0) : actual.activo
        });
        return this.obtenerPorId(id_producto);
    }

    async desactivar(id_producto) {
        await query(`UPDATE productos SET activo = 0 WHERE id_producto = @id_producto`, { id_producto });
        return true;
    }

    async consultarStock(id_producto) {
        const sql = `
            SELECT id_producto, stock_actual, stock_minimo, nombre_producto,
                   CASE WHEN stock_actual <= 0 THEN 'CRÍTICO'
                        WHEN stock_actual < stock_minimo THEN 'BAJO'
                        ELSE 'NORMAL' END AS estado_stock
            FROM productos WHERE id_producto = @id_producto AND activo = 1
        `;
        const result = await query(sql, { id_producto });
        return result.recordset[0] || null;
    }

    async consultarStockMultiple(ids_productos) {
        if (!ids_productos.length) return [];
        const placeholders = ids_productos.map((_, i) => `@id${i}`).join(',');
        const params = {};
        ids_productos.forEach((id, i) => { params[`id${i}`] = id; });
        const sql = `SELECT id_producto, stock_actual, stock_minimo, nombre_producto
                     FROM productos WHERE id_producto IN (${placeholders}) AND activo = 1`;
        const result = await query(sql, params);
        return result.recordset;
    }

    async obtenerStockBajo() {
        const result = await query(`SELECT * FROM vw_ProductosStockBajo ORDER BY faltante_para_minimo DESC`);
        return result.recordset;
    }

    async actualizarStock(id_producto, nueva_cantidad, id_usuario, observaciones = null) {
        const producto = await this.obtenerPorId(id_producto);
        if (!producto) throw new Error('Producto no encontrado');
        if (nueva_cantidad < 0) throw new Error('La cantidad no puede ser negativa');

        const stock_antes = producto.stock_actual;

        await query(`UPDATE productos SET stock_actual = @nueva_cantidad WHERE id_producto = @id_producto`,
            { id_producto, nueva_cantidad });

        const tipoResult = await query(
            `SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre_movimiento = 'AJUSTE_INVENTARIO'`
        );
        const id_tipo = tipoResult.recordset[0]?.id_tipo_movimiento;
        if (id_tipo) {
            await query(`
                INSERT INTO movimientos_inventario
                    (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, observaciones, id_usuario)
                VALUES (@id_producto, @id_tipo, @cantidad, @stock_antes, @stock_despues, @observaciones, @id_usuario)
            `, {
                id_producto, id_tipo,
                cantidad:     Math.abs(nueva_cantidad - stock_antes),
                stock_antes,
                stock_despues: nueva_cantidad,
                observaciones: observaciones || 'Ajuste manual de stock',
                id_usuario
            });
        }
        return this.obtenerPorId(id_producto);
    }

    async actualizarPeso(id_producto, nuevo_peso_kg, id_usuario, lote = null, proveedor = null, observaciones = null) {
        const result = await callProcedure('sp_ActualizarPesoProducto', {
            id_producto, nuevo_peso_kg, id_usuario, lote, proveedor, observaciones
        });
        return result.recordset?.[0] || null;
    }

    async registrarNuevaTanda(id_producto, nuevo_peso_kg, cantidad_nueva_tanda, id_usuario, lote = null, proveedor = null, observaciones = null) {
        const result = await callProcedure('sp_RegistrarNuevaTanda', {
            id_producto, nuevo_peso_kg, cantidad_nueva_tanda, id_usuario, lote, proveedor, observaciones
        });
        return result.recordset?.[0] || null;
    }

    async calcularPrecio(id_producto, id_tipo_cliente, cantidad = 1, usarPesoPromedio = true, tipoPromedio = 'PROMEDIO') {
        const sql = `SELECT dbo.CalcularPrecioConPeso(@id_producto, @id_tipo_cliente, @cantidad, @usarPesoPromedio, @tipoPromedio) AS precio`;
        const result = await query(sql, { id_producto, id_tipo_cliente, cantidad, usarPesoPromedio: usarPesoPromedio ? 1 : 0, tipoPromedio });
        return result.recordset[0]?.precio || 0;
    }

    async asignarImpuesto(id_producto, id_impuesto, aplica = true) {
        const check = await query(
            `SELECT id_producto_impuesto FROM producto_impuesto
             WHERE id_producto = @id_producto AND id_impuesto = @id_impuesto`,
            { id_producto, id_impuesto }
        );
        if (check.recordset.length > 0) {
            await query(
                `UPDATE producto_impuesto SET aplica = @aplica
                 WHERE id_producto = @id_producto AND id_impuesto = @id_impuesto`,
                { id_producto, id_impuesto, aplica: aplica ? 1 : 0 }
            );
        } else {
            await query(
                `INSERT INTO producto_impuesto (id_producto, id_impuesto, aplica)
                 VALUES (@id_producto, @id_impuesto, @aplica)`,
                { id_producto, id_impuesto, aplica: aplica ? 1 : 0 }
            );
        }
        return true;
    }

    async obtenerEstadisticas() {
        const sql = `
            SELECT 
                COUNT(*) AS total_productos,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS productos_activos,
                SUM(CASE WHEN stock_actual <= 0 THEN 1 ELSE 0 END) AS productos_sin_stock,
                SUM(CASE WHEN stock_actual > 0 AND stock_actual < stock_minimo THEN 1 ELSE 0 END) AS productos_stock_bajo,
                SUM(stock_actual * precio_base) AS valor_inventario,
                AVG(CAST(stock_actual AS FLOAT)) AS stock_promedio
            FROM productos
        `;
        const result = await query(sql);
        return result.recordset[0];
    }
}

module.exports = new ProductoModel();