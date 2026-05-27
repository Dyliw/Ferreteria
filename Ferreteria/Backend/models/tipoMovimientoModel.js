const { query } = require('../config/database');

class TipoMovimientoModel {
    // Obtener todos los tipos de movimiento
    async obtenerTodos() {
        const sqlQuery = `
            SELECT 
                id_tipo_movimiento,
                nombre_movimiento,
                signo,
                afecta_stock,
                CASE 
                    WHEN signo = 1 THEN 'ENTRADA'
                    WHEN signo = -1 THEN 'SALIDA'
                    ELSE 'NEUTRO'
                END AS tipo,
                CASE 
                    WHEN afecta_stock = 1 THEN 'SÍ'
                    ELSE 'NO'
                END AS afecta_stock_texto
            FROM tipos_movimiento
            ORDER BY 
                CASE 
                    WHEN nombre_movimiento = 'COMPRA' THEN 1
                    WHEN nombre_movimiento = 'VENTA' THEN 2
                    WHEN nombre_movimiento = 'DEVOLUCION' THEN 3
                    WHEN nombre_movimiento = 'AJUSTE' THEN 4
                    ELSE 5
                END,
                nombre_movimiento
        `;
        
        const result = await query(sqlQuery);
        return result.recordset;
    }
    
    // Obtener tipo de movimiento por ID
    async obtenerPorId(id_tipo_movimiento) {
        const sqlQuery = `
            SELECT 
                id_tipo_movimiento,
                nombre_movimiento,
                signo,
                afecta_stock
            FROM tipos_movimiento
            WHERE id_tipo_movimiento = @id_tipo_movimiento
        `;
        
        const result = await query(sqlQuery, { id_tipo_movimiento });
        return result.recordset[0] || null;
    }
    
    // Obtener tipo de movimiento por nombre
    async obtenerPorNombre(nombre_movimiento) {
        const sqlQuery = `
            SELECT 
                id_tipo_movimiento,
                nombre_movimiento,
                signo,
                afecta_stock
            FROM tipos_movimiento
            WHERE nombre_movimiento = @nombre_movimiento
        `;
        
        const result = await query(sqlQuery, { nombre_movimiento });
        return result.recordset[0] || null;
    }
}

module.exports = new TipoMovimientoModel();