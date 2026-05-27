const { query } = require('../config/database');

class TransferenciaModel {

    async guardar(id_venta, datos) {
        const sqlQuery = `
            INSERT INTO transferencias (
                id_venta, banco_emisor, banco_receptor, cuenta_origen,
                cuenta_destino, referencia, monto, fecha_transferencia, comprobante_url
            )
            VALUES (
                @id_venta, @banco_emisor, @banco_receptor, @cuenta_origen,
                @cuenta_destino, @referencia, @monto, @fecha_transferencia, @comprobante_url
            )
        `;
        
        const params = {
            id_venta,
            banco_emisor: datos.banco_emisor,
            banco_receptor: datos.banco_receptor,
            cuenta_origen: datos.cuenta_origen,
            cuenta_destino: datos.cuenta_destino,
            referencia: datos.referencia,
            monto: datos.monto,
            fecha_transferencia: datos.fecha_transferencia || new Date(),
            comprobante_url: datos.comprobante_url || null
        };
        
        await query(sqlQuery, params);
        
        return this.obtenerPorVenta(id_venta);
    }
    
    async obtenerPorVenta(id_venta) {
        const sqlQuery = `
            SELECT 
                id_transferencia,
                banco_emisor,
                banco_receptor,
                cuenta_origen,
                cuenta_destino,
                referencia,
                monto,
                fecha_transferencia,
                FORMAT(fecha_transferencia, 'dd/MM/yyyy HH:mm') AS fecha_formato,
                comprobante_url
            FROM transferencias
            WHERE id_venta = @id_venta
        `;
        
        const result = await query(sqlQuery, { id_venta });
        return result.recordset[0] || null;
    }
    
    // Actualizar comprobante
    async actualizarComprobante(id_venta, comprobante_url) {
        const sqlQuery = `
            UPDATE transferencias 
            SET comprobante_url = @comprobante_url
            WHERE id_venta = @id_venta
        `;
        
        await query(sqlQuery, { id_venta, comprobante_url });
    }
}

module.exports = new TransferenciaModel();