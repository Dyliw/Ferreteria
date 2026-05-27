const { query, executeFunction, callProcedure } = require('../config/database');
const impuestoModel = require('./impuestoModel');
const listaPreciosModel = require('./listaPreciosModel');
const categoriaModel = require('./categoriaModel');

class ProductoModel {
    
    async crear(datos) {
        const categoria = await categoriaModel.obtenerPorId(datos.id_categoria);
        if (!categoria) throw new Error('La categoría seleccionada no existe');
        
        let sku = datos.sku;
        if (!sku) {
            const nombreLimpio = datos.nombre_producto.substring(0, 3).toUpperCase();
            const timestamp = Date.now().toString().slice(-6);
            sku = `${nombreLimpio}${timestamp}`;
        }
        
        const sqlQuery = `
            INSERT INTO productos (
                nombre_producto, descripcion, id_categoria, sku,
                stock_actual, stock_minimo, stock_maximo,
                precio_base, unidad_medida, peso_kg, peso_actual_kg, metodo_promedio
            )
            OUTPUT INSERTED.id_producto
            VALUES (
                @nombre_producto, @descripcion, @id_categoria, @sku,
                @stock_actual, @stock_minimo, @stock_maximo,
                @precio_base, @unidad_medida, @peso_kg, @peso_actual_kg, @metodo_promedio
            )
        `;
        const params = {
            nombre_producto: datos.nombre_producto,
            descripcion: datos.descripcion || null,
            id_categoria: datos.id_categoria,
            sku,
            stock_actual: datos.stock_actual || 0,
            stock_minimo: datos.stock_minimo || 10,
            stock_maximo: datos.stock_maximo || null,
            precio_base: datos.precio_base,
            unidad_medida: datos.unidad_medida || 'PZA',
            peso_kg: datos.peso_kg || 0,
            peso_actual_kg: datos.peso_kg || 0,
            metodo_promedio: datos.metodo_promedio || 'PROMEDIO'
        };
        const result = await query(sqlQuery, params);
        const id_producto = result.recordset[0].id_producto;
        const impuestos = await impuestoModel.obtenerTodos(true);
        const ivaDefault = impuestos.find(i => i.tipo_impuesto === 'IVA' && i.porcentaje === 16);
        if (ivaDefault && datos.aplicar_iva_default !== false) {
            await this.asignarImpuesto(id_producto, ivaDefault.id_impuesto, true);
        }
        
        return this.obtenerPorId(id_producto);
    }

    async obtenerPorId(id_producto) {
        const sqlQuery = `
            SELECT 
                p.id_producto, p.nombre_producto, p.descripcion,
                p.id_categoria, c.nombre_categoria,
                p.sku, p.stock_actual, p.stock_minimo, p.stock_maximo,
                p.precio_base, p.unidad_medida,
                p.peso_kg, p.peso_anterior_kg, p.peso_actual_kg,
                p.fecha_ultimo_peso, p.fecha_peso_anterior,
                p.metodo_promedio, p.activo, p.fecha_creacion,
                -- Nivel de stock
                CASE 
                    WHEN p.stock_actual <= 0 THEN 'CRÍTICO'
                    WHEN p.stock_actual < p.stock_minimo THEN 'BAJO'
                    WHEN p.stock_maximo IS NOT NULL AND p.stock_actual > p.stock_maximo THEN 'EXCEDIDO'
                    ELSE 'NORMAL'
                END AS nivel_stock,
                -- Peso promedio usando la función de BD
                dbo.CalcularPesoPromedio(p.id_producto, 'PROMEDIO') AS peso_promedio,
                dbo.CalcularPesoPromedio(p.id_producto, 'PONDERADO') AS peso_ponderado
            FROM productos p
            INNER JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = @id_producto
        `;
        const result = await query(sqlQuery, { id_producto });
        const producto = result.recordset[0];
        if (producto) {
            producto.impuestos = await impuestoModel.obtenerPorProducto(id_producto);
            producto.precios_por_cliente = await this.obtenerPreciosPorCliente(id_producto);
        }
        return producto || null;
    }

    async listar(filtros = {}) {
        let baseQuery = `
            FROM productos p
            INNER JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE 1=1
        `;
        const params = {};
        
        if (filtros.termino && filtros.termino.trim()) {
            baseQuery += ` AND (p.nombre_producto LIKE @termino OR p.sku LIKE @termino OR p.descripcion LIKE @termino)`;
            params.termino = `%${filtros.termino}%`;
        }
        if (filtros.id_categoria) {
            baseQuery += ` AND p.id_categoria = @id_categoria`;
            params.id_categoria = filtros.id_categoria;
        }
        if (filtros.activo !== undefined && filtros.activo !== '') {
            baseQuery += ` AND p.activo = @activo`;
            params.activo = filtros.activo === 'true' ? 1 : 0;
        }
        if (filtros.stock_bajo === 'true') {
            baseQuery += ` AND p.stock_actual < p.stock_minimo`;
        }
        if (filtros.sin_stock === 'true') {
            baseQuery += ` AND p.stock_actual <= 0`;
        }
        
        const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
        const countResult = await query(countQuery, params);
        const total = countResult.recordset[0].total;
        
        const pagina = parseInt(filtros.pagina) || 1;
        const limite = parseInt(filtros.limite) || 20;
        const offset = (pagina - 1) * limite;
        const ordenCampo = filtros.orden_campo || 'p.nombre_producto';
        const ordenDireccion = filtros.orden_direccion === 'DESC' ? 'DESC' : 'ASC';
        
        const sqlQuery = `
            SELECT 
                p.id_producto, p.nombre_producto, p.descripcion,
                p.id_categoria, c.nombre_categoria,
                p.sku, p.stock_actual, p.stock_minimo,
                p.precio_base, p.unidad_medida, p.peso_actual_kg,
                p.activo, p.fecha_creacion,
                CASE 
                    WHEN p.stock_actual <= 0 THEN 'CRÍTICO'
                    WHEN p.stock_actual < p.stock_minimo THEN 'BAJO'
                    ELSE 'NORMAL'
                END AS nivel_stock,
                dbo.CalcularPrecioProducto(p.id_producto, 1, 1) AS precio_estimado
            ${baseQuery}
            ORDER BY ${ordenCampo} ${ordenDireccion}
            OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
        `;
        params.offset = offset;
        params.limite = limite;
        const result = await query(sqlQuery, params);
        
        return {
            data: result.recordset,
            pagination: { total, pagina, limite, total_paginas: Math.ceil(total / limite) }
        };
    }

    async actualizar(id_producto, datos) {
        const actual = await this.obtenerPorId(id_producto);
        if (!actual) throw new Error('Producto no encontrado');
      
        const finalData = {
            nombre_producto: datos.nombre_producto ?? actual.nombre_producto,
            descripcion: datos.descripcion ?? actual.descripcion,
            id_categoria: datos.id_categoria ?? actual.id_categoria,
            sku: datos.sku ?? actual.sku,
            stock_actual: datos.stock_actual ?? actual.stock_actual,
            stock_minimo: datos.stock_minimo ?? actual.stock_minimo,
            stock_maximo: datos.stock_maximo ?? actual.stock_maximo,
            precio_base: datos.precio_base ?? actual.precio_base,
            unidad_medida: datos.unidad_medida ?? actual.unidad_medida,
            peso_kg: datos.peso_kg ?? actual.peso_kg,
            activo: datos.activo ?? actual.activo
        };

        const sqlQuery = `
            UPDATE productos SET
                nombre_producto = @nombre_producto,
                descripcion = @descripcion,
                id_categoria = @id_categoria,
                sku = @sku,
                stock_actual = @stock_actual,
                stock_minimo = @stock_minimo,
                stock_maximo = @stock_maximo,
                precio_base = @precio_base,
                unidad_medida = @unidad_medida,
                peso_kg = @peso_kg,
                activo = @activo
            WHERE id_producto = @id_producto
        `;
        await query(sqlQuery, { id_producto, ...finalData });
        
        return this.obtenerPorId(id_producto);
    }

    async actualizarPesoConPromedio(id_producto, nuevo_peso_kg, id_usuario, lote, proveedor, observaciones) {
        const result = await callProcedure('sp_ActualizarPesoProducto', {
            id_producto: parseInt(id_producto),
            nuevo_peso_kg: parseFloat(nuevo_peso_kg),
            id_usuario: parseInt(id_usuario),
            lote: lote || null,
            proveedor: proveedor || null,
            observaciones: observaciones || null
        });
        return result.recordset?.[0] || null;
    }
    
    async registrarNuevaTanda(id_producto, nuevo_peso_kg, cantidad, id_usuario, lote, proveedor, observaciones) {
        const result = await callProcedure('sp_RegistrarNuevaTanda', {
            id_producto: parseInt(id_producto),
            nuevo_peso_kg: parseFloat(nuevo_peso_kg),
            cantidad: parseInt(cantidad),
            id_usuario: parseInt(id_usuario),
            lote: lote || null,
            proveedor: proveedor || null,
            observaciones: observaciones || null
        });
        return result.recordset?.[0] || null;
    }
    
    async calcularPesoPromedio(id_producto, tipo = 'PROMEDIO') {
        const rows = await executeFunction('CalcularPesoPromedio', { id_producto, tipo_promedio: tipo });
        return rows[0]?.peso || 0;
    }
    
    async obtenerStockBajo() {
        const sql = `SELECT * FROM vw_ProductosStockBajo ORDER BY faltante_para_minimo DESC`;
        const result = await query(sql);
        return result.recordset;
    }
    
    async actualizarStock(id_producto, cantidad, tipo_movimiento = 'AJUSTE', id_usuario = 1) {
        const producto = await this.obtenerPorId(id_producto);
        if (!producto) throw new Error('Producto no encontrado');
        
        const stock_antes = producto.stock_actual;
        const stock_despues = stock_antes + cantidad;
        if (stock_despues < 0) throw new Error('Stock insuficiente');
        await query(`UPDATE productos SET stock_actual = @stock_despues WHERE id_producto = @id_producto`, {
            id_producto, stock_despues
        });

        const tipo = await query(
            `SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre_movimiento = @nombre`,
            { nombre: tipo_movimiento }
        );
        if (tipo.recordset[0]) {
            await query(`
                INSERT INTO movimientos_inventario (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, referencia_tabla, observaciones, id_usuario)
                VALUES (@id_producto, @id_tipo, @cantidad, @stock_antes, @stock_despues, 'MANUAL', @observaciones, @id_usuario)
            `, {
                id_producto,
                id_tipo: tipo.recordset[0].id_tipo_movimiento,
                cantidad: Math.abs(cantidad),
                stock_antes,
                stock_despues,
                observaciones: `Ajuste manual de stock (${cantidad > 0 ? '+' : ''}${cantidad})`,
                id_usuario
            });
        }
        
        return this.obtenerPorId(id_producto);
    }
    async consultarStock(id_producto) {
        const sql = `
            SELECT id_producto, nombre_producto, sku, stock_actual, stock_minimo,
                   CASE 
                       WHEN stock_actual <= 0 THEN 'CRÍTICO'
                       WHEN stock_actual < stock_minimo THEN 'BAJO'
                       ELSE 'NORMAL'
                   END AS nivel_stock,
                   (stock_minimo - stock_actual) AS faltante_para_minimo
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
        const sql = `
            SELECT id_producto, nombre_producto, sku, stock_actual, stock_minimo,
                   CASE WHEN stock_actual <= 0 THEN 'CRÍTICO' WHEN stock_actual < stock_minimo THEN 'BAJO' ELSE 'NORMAL' END AS nivel_stock
            FROM productos WHERE id_producto IN (${placeholders}) AND activo = 1
        `;
        const result = await query(sql, params);
        return result.recordset;
    }
    async asignarImpuesto(id_producto, id_impuesto, aplica = true) {
        const check = await query(
            `SELECT id_producto_impuesto FROM producto_impuesto WHERE id_producto = @id_producto AND id_impuesto = @id_impuesto`,
            { id_producto, id_impuesto }
        );
        if (check.recordset.length) {
            await query(`UPDATE producto_impuesto SET aplica = @aplica WHERE id_producto = @id_producto AND id_impuesto = @id_impuesto`,
                { id_producto, id_impuesto, aplica: aplica ? 1 : 0 });
        } else {
            await query(`INSERT INTO producto_impuesto (id_producto, id_impuesto, aplica) VALUES (@id_producto, @id_impuesto, @aplica)`,
                { id_producto, id_impuesto, aplica: aplica ? 1 : 0 });
        }
        return true;
    }
    
    async obtenerPreciosPorCliente(id_producto) {
        const sql = `
            SELECT 
                tc.id_tipo_cliente, tc.nombre_tipo, tc.descuento_base, tc.factor_precio,
                ppl.id_lista, ppl.cantidad_minima, ppl.cantidad_maxima, ppl.precio_unitario AS precio_especial,
                dbo.CalcularPrecioProducto(@id_producto, tc.id_tipo_cliente, 1) AS precio_1,
                dbo.CalcularPrecioProducto(@id_producto, tc.id_tipo_cliente, 25) AS precio_25,
                dbo.CalcularPrecioProducto(@id_producto, tc.id_tipo_cliente, 50) AS precio_50,
                dbo.CalcularPrecioProducto(@id_producto, tc.id_tipo_cliente, 100) AS precio_100
            FROM tipos_cliente tc
            LEFT JOIN listas_precios lp ON lp.id_tipo_cliente = tc.id_tipo_cliente AND lp.activo = 1
            LEFT JOIN precios_por_lista ppl ON ppl.id_lista = lp.id_lista AND ppl.id_producto = @id_producto AND ppl.activo = 1
            ORDER BY tc.id_tipo_cliente
        `;
        const result = await query(sql, { id_producto });
        return result.recordset;
    }
    
    async configurarPrecioEspecial(datos) {
        let id_lista = datos.id_lista;
        if (!id_lista && datos.id_tipo_cliente) {
            const nombreLista = `Lista ${datos.nombre_tipo_cliente || 'Especial'}`;
            const listaResult = await query(`
                INSERT INTO listas_precios (nombre_lista, id_tipo_cliente, activo)
                OUTPUT INSERTED.id_lista
                VALUES (@nombre, @id_tipo, 1)
            `, { nombre: nombreLista, id_tipo: datos.id_tipo_cliente });
            id_lista = listaResult.recordset[0].id_lista;
        }
        await query(`
            MERGE INTO precios_por_lista AS target
            USING (SELECT @id_producto AS id_producto, @id_lista AS id_lista) AS source
            ON target.id_producto = source.id_producto AND target.id_lista = source.id_lista AND target.cantidad_minima = @cantidad_minima
            WHEN MATCHED THEN UPDATE SET precio_unitario = @precio_unitario, activo = @activo
            WHEN NOT MATCHED THEN INSERT (id_producto, id_lista, cantidad_minima, cantidad_maxima, precio_unitario, activo)
            VALUES (@id_producto, @id_lista, @cantidad_minima, @cantidad_maxima, @precio_unitario, @activo);
        `, {
            id_producto: datos.id_producto,
            id_lista,
            cantidad_minima: datos.cantidad_minima || 1,
            cantidad_maxima: datos.cantidad_maxima || null,
            precio_unitario: datos.precio_unitario,
            activo: datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1
        });
        return true;
    }

    async obtenerEstadisticas() {
        const sql = `
            SELECT 
                COUNT(*) AS total_productos,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS productos_activos,
                SUM(CASE WHEN stock_actual <= 0 THEN 1 ELSE 0 END) AS productos_sin_stock,
                SUM(CASE WHEN stock_actual < stock_minimo THEN 1 ELSE 0 END) AS productos_stock_bajo,
                SUM(stock_actual * precio_base) AS valor_inventario,
                AVG(stock_actual) AS stock_promedio
            FROM productos
        `;
        const result = await query(sql);
        return result.recordset[0];
    }

    async eliminarLogico(id_producto) {
        await query(`DELETE FROM productos WHERE id_producto = @id_producto`, { id_producto });
        return true;
    }
}

module.exports = new ProductoModel();