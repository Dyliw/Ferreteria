const { query } = require('../config/database');

class EstadoPedidoModel {
    // Obtener todos los estados
    async obtenerTodos() {
        const sqlQuery = `
            SELECT 
                id_estado,
                nombre_estado,
                orden
            FROM estados_pedido
            ORDER BY orden ASC
        `;
        
        const result = await query(sqlQuery);
        return result.recordset;
    }
    
    async obtenerPorId(id_estado) {
        const sqlQuery = `
            SELECT 
                id_estado,
                nombre_estado,
                orden
            FROM estados_pedido
            WHERE id_estado = @id_estado
        `;
        
        const result = await query(sqlQuery, { id_estado });
        return result.recordset[0] || null;
    }
    
    async obtenerPorNombre(nombre_estado) {
        const sqlQuery = `
            SELECT 
                id_estado,
                nombre_estado,
                orden
            FROM estados_pedido
            WHERE nombre_estado = @nombre_estado
        `;
        
        const result = await query(sqlQuery, { nombre_estado });
        return result.recordset[0] || null;
    }

    esTransicionValida(estadoActual, estadoNuevo) {
        const transiciones = {
            'COTIZACION': ['APROBADO', 'CANCELADO'],
            'APROBADO': ['EN_PRODUCCION', 'CANCELADO'],
            'EN_PRODUCCION': ['ENVIADO', 'CANCELADO'],
            'ENVIADO': ['ENTREGADO', 'CANCELADO'],
            'ENTREGADO': [],
            'CANCELADO': []
        };
        
        const permitidos = transiciones[estadoActual] || [];
        return permitidos.includes(estadoNuevo);
    }
}

module.exports = new EstadoPedidoModel();