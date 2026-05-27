// models/VentaModel.js
const { query } = require('../config/database');

const ticketService = require('../services/ticketService');

class VentaModel {
    async registrarVenta(datos) {
        const {
            id_cliente,
            id_empleado,
            id_metodo_pago = 1,
            productos, 
            observaciones = null
        } = datos;

        if (!id_cliente) throw new Error('El cliente es requerido');
        if (!id_empleado) throw new Error('El empleado es requerido');
        if (!productos || productos.length === 0) throw new Error('La venta debe tener al menos un producto');

        const detalle_json = JSON.stringify(productos.map(p => ({
            id_producto: p.id_producto,
            cantidad: p.cantidad,
            descuento_linea: p.descuento_linea || 0
        })));

        // Llamada al SP con parámetro de salida
        const result = await callProcedure('sp_RegistrarVenta', {
            id_cliente: Number(id_cliente),
            id_empleado: Number(id_empleado),
            id_metodo_pago: Number(id_metodo_pago),
            detalle_json: detalle_json,
            observaciones: observaciones || null,
            id_venta: { direction: 'output', type: sql.Int }  
        });

        const id_venta = result.output.id_venta;

        if (!id_venta || id_venta === -1) {
            throw new Error('Error al registrar la venta');
        }

        console.log(`Venta creada con ID: ${id_venta}`);

        const ventaCompleta = await this.obtenerPorId(id_venta);

        let ticketHTML = null;
        if (ventaCompleta) {
            try {
                ticketHTML = ticketService.generarTicketHTML(ventaCompleta);
            } catch (e) {
                console.error('Error generando ticket:', e.message);
            }
        }

        return {
            success: true,
            venta: ventaCompleta,
            ticket: ticketHTML,
            id_venta: id_venta
        };
    }

    async obtenerPorId(id_venta) {
        const id = Number(id_venta);
        if (!id || isNaN(id)) {
            console.error('ID de venta inválido:', id_venta);
            return null;
        }

        try {
            const result = await callProcedure('sp_ObtenerDetalleVenta', { id_venta: id });
            
            if (!result.recordsets || result.recordsets.length === 0) return null;
            
            const ventaData = result.recordsets[0][0];
            if (!ventaData) return null;
            const detalles = result.recordsets[1] || [];
            
            const venta = {
                id_venta: ventaData.id_venta,
                folio: ventaData.folio,
                fecha_venta: ventaData.fecha_venta,
                fecha_formato: ventaData.fecha_venta_formato,
                id_cliente: ventaData.id_cliente,
                cliente_nombre: ventaData.cliente_nombre,
                cliente_email: ventaData.cliente_email,
                cliente_telefono: ventaData.cliente_telefono,
                cliente_rfc: ventaData.cliente_rfc,
                cliente_tipo: ventaData.cliente_tipo,
                factor_precio: ventaData.factor_precio,
                id_empleado: ventaData.id_empleado,
                vendedor_nombre: ventaData.empleado_nombre,
                subtotal: ventaData.subtotal,
                descuento_total: ventaData.descuento_total,
                iva: ventaData.iva,
                ieps: ventaData.ieps,
                total: ventaData.total,
                observaciones: ventaData.observaciones,
                cancelada: ventaData.cancelada,
                metodo_pago: ventaData.nombre_metodo,
                detalles: detalles.map(d => ({
                    id_detalle_venta: d.id_detalle_venta,
                    id_producto: d.id_producto,
                    nombre_producto: d.nombre_producto,
                    sku: d.sku,
                    peso_actual_kg: d.peso_actual_kg,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    descuento_linea: d.descuento_linea,
                    iva_aplicado: d.iva_aplicado,
                    ieps_aplicado: d.ieps_aplicado,
                    subtotal_linea: d.subtotal_linea,
                    total_linea: d.total_linea
                }))
            };
            
            return venta;
        } catch (error) {
            console.error(`Error en obtenerPorId ${id_venta}:`, error.message);
            return null;
        }
    }
// Registrar un pago parcial o total 
async registrarPago(id_venta, id_metodo_pago, monto, referencia = null) {

    const venta = await this.obtenerPorId(id_venta);
    if (!venta) throw new Error('Venta no encontrada');
    if (venta.cancelada) throw new Error('No se puede registrar pago en una venta cancelada');

    const result = await query(`
        INSERT INTO venta_pago (id_venta, id_metodo_pago, monto, referencia, fecha_pago)
        OUTPUT INSERTED.id_venta_pago
        VALUES (@id_venta, @id_metodo_pago, @monto, @referencia, GETDATE())
    `, { id_venta, id_metodo_pago, monto, referencia });

    return { id_pago: result.recordset[0].id_venta_pago };
}


async registrarTransferencia(id_venta, banco_emisor, banco_receptor, cuenta_origen, cuenta_destino, referencia, monto, fecha_transferencia, comprobante_url = null) {
    const venta = await this.obtenerPorId(id_venta);
    if (!venta) throw new Error('Venta no encontrada');

    const result = await query(`
        INSERT INTO transferencias (id_venta, banco_emisor, banco_receptor, cuenta_origen, cuenta_destino, referencia, monto, fecha_transferencia, comprobante_url)
        OUTPUT INSERTED.id_transferencia
        VALUES (@id_venta, @banco_emisor, @banco_receptor, @cuenta_origen, @cuenta_destino, @referencia, @monto, @fecha_transferencia, @comprobante_url)
    `, { id_venta, banco_emisor, banco_receptor, cuenta_origen, cuenta_destino, referencia, monto, fecha_transferencia, comprobante_url });

    return { id_transferencia: result.recordset[0].id_transferencia };
}

// Reporte de ventas (resumen por período, cliente, empleado, etc.)
async reporteVentas(filtros = {}) {
    let sql = `
        SELECT 
            v.id_venta, v.folio, v.fecha_venta,
            CONCAT(p.nombre, ' ', p.apellido_paterno) AS cliente,
            e.numero_empleado AS vendedor,
            v.subtotal, v.iva, v.total,
            v.cancelada
        FROM ventas v
        INNER JOIN clientes c ON v.id_cliente = c.id_cliente
        INNER JOIN personas p ON c.id_persona = p.id_persona
        INNER JOIN empleados e ON v.id_empleado = e.id_empleado
        WHERE 1=1
    `;
    const params = {};

    if (filtros.fecha_desde) {
        sql += ` AND v.fecha_venta >= @fecha_desde`;
        params.fecha_desde = filtros.fecha_desde;
    }
    if (filtros.fecha_hasta) {
        sql += ` AND v.fecha_venta <= @fecha_hasta`;
        params.fecha_hasta = filtros.fecha_hasta;
    }
    if (filtros.id_cliente) {
        sql += ` AND v.id_cliente = @id_cliente`;
        params.id_cliente = filtros.id_cliente;
    }
    if (filtros.id_empleado) {
        sql += ` AND v.id_empleado = @id_empleado`;
        params.id_empleado = filtros.id_empleado;
    }
    if (filtros.cancelada !== undefined) {
        sql += ` AND v.cancelada = @cancelada`;
        params.cancelada = filtros.cancelada;
    }

    sql += ` ORDER BY v.fecha_venta DESC`;

    const result = await query(sql, params);
    return result.recordset;
}
    async listarVentas(filtros = {}) {
        const params = {
            pagina: Number(filtros.pagina) || 1,
            limite: Number(filtros.limite) || 20,
            termino: filtros.termino || null,
            id_cliente: filtros.id_cliente ? Number(filtros.id_cliente) : null,
            id_empleado: filtros.id_empleado ? Number(filtros.id_empleado) : null,
            id_metodo_pago: filtros.id_metodo_pago ? Number(filtros.id_metodo_pago) : null,
            fecha_desde: filtros.fecha_desde || null,
            fecha_hasta: filtros.fecha_hasta || null,
            cancelada: (filtros.cancelada !== undefined && filtros.cancelada !== '') 
                        ? (filtros.cancelada === 'true' ? 1 : 0) 
                        : null,
            orden_campo: filtros.orden_campo || 'fecha_venta',
            orden_direccion: filtros.orden_direccion === 'ASC' ? 'ASC' : 'DESC'
        };
        
        const result = await callProcedure('sp_ListarVentas', params);
        const rows = result.recordset || [];
        
        if (rows.length === 0) {
            return { data: [], pagination: { total: 0, pagina: params.pagina, limite: params.limite, total_paginas: 0 } };
        }
        
        const total_registros = rows[0].total_registros || rows[0].TotalRegistros || 0;
        const total_paginas = rows[0].total_paginas || rows[0].TotalPaginas || 0;
        
        const data = rows.map(row => {
            const { total_registros, total_paginas, ...venta } = row;
            return venta;
        });
        
        return {
            data,
            pagination: {
                total: total_registros,
                pagina: params.pagina,
                limite: params.limite,
                total_paginas: total_paginas
            }
        };
    }

    async cancelarVenta(id_venta, motivo, id_usuario) {
        const id = Number(id_venta);
        if (!id || isNaN(id)) throw new Error('ID de venta inválido');
        
        try {
            await callProcedure('sp_CancelarVenta', {
                id_venta: id,
                motivo_cancelacion: motivo,
                id_usuario: Number(id_usuario)
            });
            return { success: true };
        } catch (error) {
            console.error('Error cancelando venta:', error.message);
            throw new Error(`No se pudo cancelar la venta: ${error.message}`);
        }
    }

    async obtenerVentasCompletas() {
        const sql = `SELECT * FROM vw_VentasCompletas ORDER BY fecha_venta DESC`;
        const result = await query(sql);
        return result.recordset;
    }
}

module.exports = new VentaModel();