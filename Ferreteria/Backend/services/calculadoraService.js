class CalculadoraService {
    
    // Calcular IVA
    calcularIVA(monto, porcentajeIVA = 16) {
        if (!monto || monto <= 0) return 0;
        return parseFloat((monto * (porcentajeIVA / 100)).toFixed(2));
    }
    
    // Calcular IEPS
    calcularIEPS(monto, porcentajeIEPS = 0) {
        if (!monto || porcentajeIEPS <= 0) return 0;
        return parseFloat((monto * (porcentajeIEPS / 100)).toFixed(2));
    }
    
    // Calcular subtotal de línea
    calcularSubtotalLinea(cantidad, precioUnitario, descuentoLinea = 0) {
        const subtotal = cantidad * precioUnitario;
        const descuento = subtotal * (descuentoLinea / 100);
        return parseFloat((subtotal - descuento).toFixed(2));
    }
    
    // Calcular total de línea (con impuestos)
    calcularTotalLinea(subtotalLinea, ivaAplicado = 16, iepsAplicado = 0) {
        const iva = this.calcularIVA(subtotalLinea, ivaAplicado);
        const ieps = this.calcularIEPS(subtotalLinea, iepsAplicado);
        return parseFloat((subtotalLinea + iva + ieps).toFixed(2));
    }
    
    // Calcular totales de la venta completa
    calcularTotalesVenta(detalles, flete = 0, seguroDescarga = 0) {
        let subtotal = 0;
        let ivaTotal = 0;
        let iepsTotal = 0;
        let descuentoTotal = 0;
        
        for (const detalle of detalles) {
            subtotal += detalle.subtotal_linea || 0;
            ivaTotal += detalle.iva_aplicado ? this.calcularIVA(detalle.subtotal_linea, detalle.iva_aplicado) : 0;
            iepsTotal += detalle.ieps_aplicado ? this.calcularIEPS(detalle.subtotal_linea, detalle.ieps_aplicado) : 0;
            descuentoTotal += detalle.descuento_linea || 0;
        }
        
        const total = subtotal + ivaTotal + iepsTotal + flete + seguroDescarga;
        
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            iva: parseFloat(ivaTotal.toFixed(2)),
            ieps: parseFloat(iepsTotal.toFixed(2)),
            descuento: parseFloat(descuentoTotal.toFixed(2)),
            flete: parseFloat(flete.toFixed(2)),
            seguro_descarga: parseFloat(seguroDescarga.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    }
    
    // Calcular cambio
    calcularCambio(total, montoPagado) {
        if (!montoPagado || montoPagado < total) return 0;
        return parseFloat((montoPagado - total).toFixed(2));
    }
    
    // Validar si hay suficiente stock
    validarStock(productos, stockDisponible) {
        const errores = [];
        
        for (const item of productos) {
            const stock = stockDisponible.find(s => s.id_producto === item.id_producto);
            if (!stock || stock.stock_actual < item.cantidad) {
                errores.push({
                    id_producto: item.id_producto,
                    nombre: item.nombre_producto || `Producto ${item.id_producto}`,
                    disponible: stock?.stock_actual || 0,
                    solicitado: item.cantidad
                });
            }
        }
        
        return {
            valido: errores.length === 0,
            errores
        };
    }
}

module.exports = new CalculadoraService();