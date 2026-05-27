const { query } = require('../config/database');

class RolModel {
    // Obtener todos los roles
    async obtenerTodos() {
        const sqlQuery = `
            SELECT 
                id_rol,
                nombre_rol,
                descripcion
            FROM roles
            ORDER BY id_rol ASC
        `;
        
        const result = await query(sqlQuery);
        return result.recordset;
    }
    
    // Obtener rol por ID
    async obtenerPorId(id_rol) {
        const sqlQuery = `
            SELECT 
                id_rol,
                nombre_rol,
                descripcion
            FROM roles
            WHERE id_rol = @id_rol
        `;
        
        const result = await query(sqlQuery, { id_rol });
        return result.recordset[0] || null;
    }
    
    // Obtener rol por nombre
    async obtenerPorNombre(nombre_rol) {
        const sqlQuery = `
            SELECT 
                id_rol,
                nombre_rol,
                descripcion
            FROM roles
            WHERE nombre_rol = @nombre_rol
        `;
        
        const result = await query(sqlQuery, { nombre_rol });
        return result.recordset[0] || null;
    }
}

module.exports = new RolModel();