const { query } = require('../config/database');

class PagoModel {

    async registrarPago(id_venta, datos) {
        const sqlQuery = `
            INSERT INTO venta_pago (id_venta, id_metodo_pago, monto, referencia)
            VALUES (@id_venta, @id_metodo_pago, @monto, @referencia)
        `;
        
        await query(sqlQuery, {
            id_venta,
            id_metodo_pago: datos.id_metodo_pago,
            monto: datos.monto,
            referencia: datos.referencia || null
        });
        
        return true;
    }
    
    // Obtener todos los pagos de una venta
    async obtenerPagosPorVenta(id_venta) {
        const sqlQuery = `
            SELECT 
                vp.id_venta_pago,
                vp.id_metodo_pago,
                mp.nombre_metodo,
                vp.monto,
                vp.referencia,
                vp.fecha_pago,
                FORMAT(vp.fecha_pago, 'dd/MM/yyyy HH:mm') AS fecha_pago_formato
            FROM venta_pago vp
            INNER JOIN metodos_pago mp ON vp.id_metodo_pago = mp.id_metodo_pago
            WHERE vp.id_venta = @id_venta
            ORDER BY vp.fecha_pago DESC
        `;
        
        const result = await query(sqlQuery, { id_venta });
        return result.recordset;
    }
 
    async verificarCobertura(id_venta, total_venta) {
        const pagos = await this.obtenerPagosPorVenta(id_venta);
        const total_pagado = pagos.reduce((sum, p) => sum + p.monto, 0);
        
        return {
            total_venta,
            total_pagado,
            pendiente: total_venta - total_pagado,
            cubierto: total_pagado >= total_venta
        };
    }
}

module.exports = new PagoModel();