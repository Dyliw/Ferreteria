const { query } = require('../config/database');

class MetodoPagoModel {
    // Obtener todos los métodos de pago
    async obtenerTodos() {
        const sqlQuery = `
            SELECT 
                id_metodo_pago,
                nombre_metodo,
                requiere_datos_extra
            FROM metodos_pago
            ORDER BY id_metodo_pago
        `;
        
        const result = await query(sqlQuery);
        return result.recordset;
    }

    async obtenerPorId(id_metodo_pago) {
        const sqlQuery = `
            SELECT 
                id_metodo_pago,
                nombre_metodo,
                requiere_datos_extra
            FROM metodos_pago
            WHERE id_metodo_pago = @id_metodo_pago
        `;
        
        const result = await query(sqlQuery, { id_metodo_pago });
        return result.recordset[0] || null;
    }
    
    async obtenerPorNombre(nombre_metodo) {
        const sqlQuery = `
            SELECT 
                id_metodo_pago,
                nombre_metodo,
                requiere_datos_extra
            FROM metodos_pago
            WHERE nombre_metodo = @nombre_metodo
        `;
        
        const result = await query(sqlQuery, { nombre_metodo });
        return result.recordset[0] || null;
    }
}

module.exports = new MetodoPagoModel();