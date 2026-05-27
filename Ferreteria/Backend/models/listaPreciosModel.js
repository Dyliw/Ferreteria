const { query } = require('../config/database');

class ListaPreciosModel {
    async obtenerTodas(activo = null) {
        let sqlQuery = `
            SELECT 
                lp.id_lista,
                lp.nombre_lista,
                lp.descripcion,
                lp.id_tipo_cliente,
                tc.nombre_tipo AS nombre_tipo_cliente,
                lp.activo,
                (SELECT COUNT(*) FROM precios_por_lista WHERE id_lista = lp.id_lista AND activo = 1) AS total_precios
            FROM listas_precios lp
            LEFT JOIN tipos_cliente tc ON lp.id_tipo_cliente = tc.id_tipo_cliente
            WHERE 1=1
        `;
        
        const params = {};
        
        if (activo !== null) {
            sqlQuery += ` AND lp.activo = @activo`;
            params.activo = activo ? 1 : 0;
        }
        
        sqlQuery += ` ORDER BY lp.nombre_lista ASC`;
        
        const result = await query(sqlQuery, params);
        return result.recordset;
    }
    
    async obtenerPorId(id_lista) {
        const sqlQuery = `
            SELECT 
                lp.id_lista,
                lp.nombre_lista,
                lp.descripcion,
                lp.id_tipo_cliente,
                tc.nombre_tipo AS nombre_tipo_cliente,
                lp.activo
            FROM listas_precios lp
            LEFT JOIN tipos_cliente tc ON lp.id_tipo_cliente = tc.id_tipo_cliente
            WHERE lp.id_lista = @id_lista
        `;
        
        const result = await query(sqlQuery, { id_lista });
        return result.recordset[0] || null;
    }
    
    // Obtener precios de un producto por tipo de cliente
    async obtenerPreciosPorProducto(id_producto, id_tipo_cliente = null) {
        let sqlQuery = `
            SELECT 
                ppl.id_precio_lista,
                ppl.id_producto,
                ppl.id_lista,
                lp.nombre_lista,
                lp.id_tipo_cliente,
                tc.nombre_tipo,
                ppl.cantidad_minima,
                ppl.cantidad_maxima,
                ppl.precio_unitario,
                ppl.activo
            FROM precios_por_lista ppl
            INNER JOIN listas_precios lp ON ppl.id_lista = lp.id_lista
            LEFT JOIN tipos_cliente tc ON lp.id_tipo_cliente = tc.id_tipo_cliente
            WHERE ppl.id_producto = @id_producto AND ppl.activo = 1 AND lp.activo = 1
        `;
        
        const params = { id_producto };
        
        if (id_tipo_cliente) {
            sqlQuery += ` AND lp.id_tipo_cliente = @id_tipo_cliente`;
            params.id_tipo_cliente = id_tipo_cliente;
        }
        
        sqlQuery += ` ORDER BY lp.id_tipo_cliente, ppl.cantidad_minima`;
        
        const result = await query(sqlQuery, params);
        return result.recordset;
    }
    
    // Obtener precio específico por producto, cliente y cantidad
    async obtenerPrecio(id_producto, id_tipo_cliente, cantidad) {
        const sqlQuery = `
            SELECT TOP 1
                ppl.precio_unitario
            FROM precios_por_lista ppl
            INNER JOIN listas_precios lp ON ppl.id_lista = lp.id_lista
            WHERE ppl.id_producto = @id_producto 
                AND lp.id_tipo_cliente = @id_tipo_cliente
                AND ppl.activo = 1 
                AND lp.activo = 1
                AND ppl.cantidad_minima <= @cantidad
                AND (ppl.cantidad_maxima IS NULL OR ppl.cantidad_maxima >= @cantidad)
            ORDER BY ppl.cantidad_minima DESC
        `;
        
        const result = await query(sqlQuery, { id_producto, id_tipo_cliente, cantidad });
        return result.recordset[0] || null;
    }
    
    // Crear o actualizar precio por lista
    async guardarPrecio(datos) {
        const checkQuery = `
            SELECT id_precio_lista 
            FROM precios_por_lista 
            WHERE id_producto = @id_producto 
                AND id_lista = @id_lista 
                AND cantidad_minima = @cantidad_minima
        `;
        
        const checkResult = await query(checkQuery, {
            id_producto: datos.id_producto,
            id_lista: datos.id_lista,
            cantidad_minima: datos.cantidad_minima
        });
        
        if (checkResult.recordset.length > 0) {
            // Actualizar
            const updateQuery = `
                UPDATE precios_por_lista SET
                    cantidad_maxima = @cantidad_maxima,
                    precio_unitario = @precio_unitario,
                    activo = @activo
                WHERE id_precio_lista = @id_precio_lista
            `;
            
            await query(updateQuery, {
                id_precio_lista: checkResult.recordset[0].id_precio_lista,
                cantidad_maxima: datos.cantidad_maxima || null,
                precio_unitario: datos.precio_unitario,
                activo: datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1
            });
        } else {
            // Insertar
            const insertQuery = `
                INSERT INTO precios_por_lista (
                    id_producto, id_lista, cantidad_minima, cantidad_maxima, precio_unitario
                )
                VALUES (@id_producto, @id_lista, @cantidad_minima, @cantidad_maxima, @precio_unitario)
            `;
            
            await query(insertQuery, {
                id_producto: datos.id_producto,
                id_lista: datos.id_lista,
                cantidad_minima: datos.cantidad_minima,
                cantidad_maxima: datos.cantidad_maxima || null,
                precio_unitario: datos.precio_unitario
            });
        }
        
        return true;
    }
    
    // Crear lista de precios
    async crearLista(datos) {
        const sqlQuery = `
            INSERT INTO listas_precios (nombre_lista, descripcion, id_tipo_cliente)
            OUTPUT INSERTED.id_lista
            VALUES (@nombre_lista, @descripcion, @id_tipo_cliente)
        `;
        
        const params = {
            nombre_lista: datos.nombre_lista,
            descripcion: datos.descripcion || null,
            id_tipo_cliente: datos.id_tipo_cliente || null
        };
        
        const result = await query(sqlQuery, params);
        return result.recordset[0].id_lista;
    }
}

module.exports = new ListaPreciosModel();