const { query } = require('../config/database');

class ImpuestoModel {
    async obtenerTodos(activo = null) {
    let sqlQuery = `
        SELECT 
            id_impuesto,
            nombre_impuesto,
            porcentaje,
            tipo_impuesto,
            activo
        FROM impuestos
        WHERE 1=1
    `;
    
    const params = {};
    
    if (activo !== null && activo !== undefined) {
        sqlQuery += ` AND activo = @activo`;
        params.activo = activo ? 1 : 0;
    }
    
    sqlQuery += ` ORDER BY tipo_impuesto, porcentaje DESC`;
    
    const result = await query(sqlQuery, params);
    return result.recordset;
}
    
    async obtenerPorId(id_impuesto) {
        const sqlQuery = `
            SELECT 
                id_impuesto,
                nombre_impuesto,
                porcentaje,
                tipo_impuesto,
                activo
            FROM impuestos
            WHERE id_impuesto = @id_impuesto
        `;
        
        const result = await query(sqlQuery, { id_impuesto });
        return result.recordset[0] || null;
    }
   
    async obtenerPorProducto(id_producto) {
        const sqlQuery = `
            SELECT 
                i.id_impuesto,
                i.nombre_impuesto,
                i.porcentaje,
                i.tipo_impuesto,
                pi.aplica
            FROM impuestos i
            INNER JOIN producto_impuesto pi ON i.id_impuesto = pi.id_impuesto
            WHERE pi.id_producto = @id_producto AND i.activo = 1
        `;
        
        const result = await query(sqlQuery, { id_producto });
        return result.recordset;
    }
    
    async crear(datos) {
        const sqlQuery = `
            INSERT INTO impuestos (nombre_impuesto, porcentaje, tipo_impuesto)
            OUTPUT INSERTED.id_impuesto
            VALUES (@nombre_impuesto, @porcentaje, @tipo_impuesto)
        `;
        
        const params = {
            nombre_impuesto: datos.nombre_impuesto,
            porcentaje: datos.porcentaje,
            tipo_impuesto: datos.tipo_impuesto
        };
        
        const result = await query(sqlQuery, params);
        return result.recordset[0].id_impuesto;
    }

    async actualizar(id_impuesto, datos) {
        const sqlQuery = `
            UPDATE impuestos SET
                nombre_impuesto = @nombre_impuesto,
                porcentaje = @porcentaje,
                tipo_impuesto = @tipo_impuesto,
                activo = @activo
            WHERE id_impuesto = @id_impuesto
        `;
        
        const params = {
            id_impuesto,
            nombre_impuesto: datos.nombre_impuesto,
            porcentaje: datos.porcentaje,
            tipo_impuesto: datos.tipo_impuesto,
            activo: datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1
        };
        
        await query(sqlQuery, params);
        return this.obtenerPorId(id_impuesto);
    }
}

module.exports = new ImpuestoModel();