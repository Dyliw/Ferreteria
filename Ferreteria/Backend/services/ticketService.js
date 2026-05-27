const PDFDocument = require('pdfkit');

const fs = require('fs');
const path = require('path');

class TicketService {
    
    async generarTicketPDF(venta) {
        return new Promise(async (resolve, reject) => {
            try {
                const alturaBase = 500;
                const alturaPorProducto = venta.detalles.length * 15;
                const alturaTotal = alturaBase + alturaPorProducto;
                
                const doc = new PDFDocument({
                    size: [226, alturaTotal],
                    margin: 10,
                    info: {
                        Title: `Ticket ${venta.folio}`,
                        Author: 'Ferretería "El Acero"',
                        Subject: 'Ticket de venta'
                    }
                });
                
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .text('FERRETERÍA "EL ACERO"', { align: 'center' });
                
                doc.fontSize(8)
                    .font('Helvetica')
                    .text('Av. Principal #123, Col. Centro', { align: 'center' })
                    .text('Tel: (492) 123-4567', { align: 'center' })
                    .text('RFC: ACEO800101XXX', { align: 'center' })
                    .moveDown(0.5);
                
             
                doc.strokeColor('#000000')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();

                doc.moveDown(0.5);
                doc.fontSize(9)
                    .font('Helvetica-Bold')
                    .text(`${venta.folio}`, { align: 'center' });
                
                doc.fontSize(8)
                    .font('Helvetica')
                    .text(`Fecha: ${new Date(venta.fecha_venta).toLocaleString()}`, { align: 'center' })
                    .text(`Vendedor: ${venta.vendedor_nombre}`, { align: 'center' })
                    .moveDown(0.3);
                
                doc.strokeColor('#CCCCCC')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();

                doc.moveDown(0.3);
                doc.fontSize(8)
                    .font('Helvetica-Bold')
                    .text('CLIENTE:');
                
                doc.font('Helvetica')
                    .text(`${venta.cliente_nombre}`);
                
                if (venta.cliente_rfc) {
                    doc.text(`RFC: ${venta.cliente_rfc}`);
                }
                doc.text(`Tipo: ${venta.cliente_tipo}`);
                doc.moveDown(0.3);
                
                doc.strokeColor('#CCCCCC')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();

                doc.moveDown(0.3);
                doc.fontSize(7)
                    .font('Helvetica-Bold')
                    .text('CANT', 15, doc.y, { continued: true })
                    .text('DESCRIPCIÓN', 35, doc.y, { continued: true })
                    .text('P/U', 150, doc.y, { continued: true })
                    .text('TOTAL', 185, doc.y);
                
                doc.font('Helvetica');
                
                for (const detalle of venta.detalles) {
                    const nombre = detalle.nombre_producto.length > 22 
                        ? detalle.nombre_producto.substring(0, 19) + '...' 
                        : detalle.nombre_producto;
                    
                    doc.fontSize(7);
                    doc.text(detalle.cantidad.toString(), 15, doc.y - 8);
                    doc.text(nombre, 35, doc.y - 8);
                    doc.text(`$${detalle.precio_unitario.toFixed(2)}`, 150, doc.y - 8, { width: 35, align: 'right' });
                    doc.text(`$${detalle.total_linea.toFixed(2)}`, 185, doc.y - 8, { width: 30, align: 'right' });
                    
                    if (detalle.descuento_linea > 0) {
                        doc.fontSize(6)
                            .fillColor('#666666')
                            .text(`  (Desc: ${detalle.descuento_linea}%)`, 35, doc.y - 6)
                            .fillColor('#000000');
                    }
                }
                
                doc.moveDown(0.5);
                doc.strokeColor('#CCCCCC')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();

                doc.moveDown(0.3);
                doc.fontSize(8);
                
                // Función helper para líneas alineadas
                const agregarLinea = (label, valor, esBold = false) => {
                    if (esBold) doc.font('Helvetica-Bold');
                    doc.text(label, { continued: true });
                    doc.text(valor, 140, doc.y - 8, { align: 'right', width: 70 });
                    if (esBold) doc.font('Helvetica');
                };
                
                agregarLinea('SUBTOTAL:', `$${venta.subtotal.toFixed(2)}`);
                
                if (venta.descuento_total > 0) {
                    agregarLinea('DESCUENTO:', `-$${venta.descuento_total.toFixed(2)}`);
                }
                
                agregarLinea('IVA (16%):', `$${venta.iva.toFixed(2)}`);
                
                if (venta.ieps > 0) {
                    agregarLinea('IEPS:', `$${venta.ieps.toFixed(2)}`);
                }
                
                if (venta.flete > 0) {
                    agregarLinea('FLETE:', `$${venta.flete.toFixed(2)}`);
                }
                
                if (venta.seguro_descarga > 0) {
                    agregarLinea('SEGURO/DESCARGA:', `$${venta.seguro_descarga.toFixed(2)}`);
                }
                
                doc.moveDown(0.3);
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .text('TOTAL:', { continued: true })
                    .text(`$${venta.total.toFixed(2)}`, 140, doc.y - 10, { align: 'right', width: 70 });
                
                doc.font('Helvetica');

                doc.moveDown(0.3);
                doc.fontSize(8);
                doc.text(`PAGO CON: ${venta.metodo_pago}`);
                
                if (venta.transferencia) {
                    doc.fontSize(7);
                    doc.text(`Banco: ${venta.transferencia.banco_emisor}`);
                    doc.text(`Referencia: ${venta.transferencia.referencia}`);
                    doc.fontSize(8);
                }
                
                // Línea separadora
                doc.moveDown(0.3);
                doc.strokeColor('#000000')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();
                doc.moveDown(0.3);
                doc.fontSize(7)
                    .text('¡GRACIAS POR SU COMPRA!', { align: 'center' })
                    .moveDown(0.2)
                    .text('Conserve este ticket para garantías', { align: 'center' })
                    .text('y devoluciones', { align: 'center' })
                    .moveDown(0.2)
                    .text('Síguenos:', { align: 'center' })
                    .text('@FerreteriaElAcero', { align: 'center' });
                
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async guardarTicketPDF(venta, rutaArchivo) {
        const pdfBuffer = await this.generarTicketPDF(venta);
        fs.writeFileSync(rutaArchivo, pdfBuffer);
        return rutaArchivo;
    }
    
    generarTicketHTML(venta) {
        const fecha = new Date(venta.fecha_venta);
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ticket ${venta.folio}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .ticket {
            max-width: 400px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        .ticket-content {
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 15px;
            margin-bottom: 15px;
        }
        .header h1 {
            font-size: 18px;
            margin-bottom: 8px;
            color: #c0392b;
        }
        .header p {
            font-size: 11px;
            color: #555;
            margin: 3px 0;
        }
        .folio {
            background: #f5f5f5;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 8px;
            font-weight: bold;
            font-size: 12px;
        }
        .info-section {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dotted #ddd;
        }
        .info-section h3 {
            font-size: 12px;
            margin-bottom: 8px;
            color: #333;
            border-left: 3px solid #c0392b;
            padding-left: 8px;
        }
        .info-row {
            font-size: 11px;
            margin: 6px 0;
            display: flex;
            justify-content: space-between;
        }
        .productos {
            margin: 15px 0;
        }
        .productos-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 10px;
            background: #f5f5f5;
            padding: 6px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        .producto-item {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin: 8px 0;
            padding: 4px 0;
            border-bottom: 1px dotted #eee;
        }
        .producto-nombre {
            flex: 2;
            padding-right: 8px;
        }
        .producto-cant {
            width: 40px;
            text-align: center;
        }
        .producto-precio {
            width: 55px;
            text-align: right;
        }
        .producto-total {
            width: 55px;
            text-align: right;
        }
        .descuento-linea {
            font-size: 9px;
            color: #888;
            margin-left: 20px;
            margin-top: -4px;
            margin-bottom: 4px;
        }
        .totales {
            border-top: 1px dashed #ccc;
            padding-top: 12px;
            margin-top: 12px;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin: 6px 0;
        }
        .total-grande {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            border-top: 1px dashed #ccc;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 9px;
            color: #666;
        }
        button {
            display: block;
            width: 100%;
            padding: 12px;
            background: #c0392b;
            color: white;
            border: none;
            font-size: 14px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
        }
        button:hover {
            background: #a93226;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .no-print {
                display: none;
            }
            .ticket {
                box-shadow: none;
                border-radius: 0;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="ticket-content">
            <div class="header">
                <h1>🏪 FERRETERÍA "EL ACERO"</h1>
                <p>Av. Principal #123, Col. Centro</p>
                <p>Tel: (492) 123-4567 | RFC: ACEO800101XXX</p>
                <div class="folio">${venta.folio}</div>
            </div>
            
            <div class="info-section">
                <div class="info-row">
                    <span>📅 Fecha:</span>
                    <span>${fecha.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span>👤 Vendedor:</span>
                    <span>${venta.vendedor_nombre}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>🧑 CLIENTE</h3>
                <div class="info-row">
                    <span>Nombre:</span>
                    <span><strong>${venta.cliente_nombre}</strong></span>
                </div>
                <div class="info-row">
                    <span>Tipo:</span>
                    <span>${venta.cliente_tipo}</span>
                </div>
                ${venta.cliente_rfc ? `<div class="info-row"><span>RFC:</span><span>${venta.cliente_rfc}</span></div>` : ''}
            </div>
            
            <div class="productos">
                <div class="productos-header">
                    <span class="producto-nombre">PRODUCTO</span>
                    <span class="producto-cant">CANT</span>
                    <span class="producto-precio">P/U</span>
                    <span class="producto-total">TOTAL</span>
                </div>
                
                ${venta.detalles.map(d => `
                    <div>
                        <div class="producto-item">
                            <span class="producto-nombre">${d.nombre_producto.length > 35 ? d.nombre_producto.substring(0, 32) + '...' : d.nombre_producto}</span>
                            <span class="producto-cant">${d.cantidad}</span>
                            <span class="producto-precio">$${d.precio_unitario.toFixed(2)}</span>
                            <span class="producto-total">$${d.total_linea.toFixed(2)}</span>
                        </div>
                        ${d.descuento_linea > 0 ? `<div class="descuento-linea">↳ Descuento: ${d.descuento_linea}%</div>` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div class="totales">
                <div class="total-line">
                    <span>SUBTOTAL:</span>
                    <span>$${venta.subtotal.toFixed(2)}</span>
                </div>
                ${venta.descuento_total > 0 ? `
                <div class="total-line" style="color:#c0392b;">
                    <span>DESCUENTO:</span>
                    <span>-$${venta.descuento_total.toFixed(2)}</span>
                </div>` : ''}
                <div class="total-line">
                    <span>IVA (16%):</span>
                    <span>$${venta.iva.toFixed(2)}</span>
                </div>
                ${venta.ieps > 0 ? `
                <div class="total-line">
                    <span>IEPS:</span>
                    <span>$${venta.ieps.toFixed(2)}</span>
                </div>` : ''}
                ${venta.flete > 0 ? `
                <div class="total-line">
                    <span>FLETE:</span>
                    <span>$${venta.flete.toFixed(2)}</span>
                </div>` : ''}
                ${venta.seguro_descarga > 0 ? `
                <div class="total-line">
                    <span>SEGURO/DESCARGA:</span>
                    <span>$${venta.seguro_descarga.toFixed(2)}</span>
                </div>` : ''}
                
                <div class="total-line total-grande">
                    <span>TOTAL:</span>
                    <span>$${venta.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="info-section" style="margin-top: 10px;">
                <div class="info-row">
                    <span>💳 Pago con:</span>
                    <span><strong>${venta.metodo_pago}</strong></span>
                </div>
                ${venta.transferencia ? `
                <div class="info-row" style="font-size: 10px;">
                    <span>🏦 Banco:</span>
                    <span>${venta.transferencia.banco_emisor}</span>
                </div>
                <div class="info-row" style="font-size: 10px;">
                    <span>📌 Referencia:</span>
                    <span>${venta.transferencia.referencia}</span>
                </div>` : ''}
            </div>
            
            <div class="footer">
                <p>✨ ¡GRACIAS POR SU COMPRA! ✨</p>
                <p>Conserve este ticket para garantías y devoluciones</p>
                <p>Este ticket es válido como comprobante fiscal</p>
                <p style="margin-top: 8px;">📱 Síguenos: @FerreteriaElAcero</p>
            </div>
        </div>
        <button class="no-print" onclick="window.print()">🖨️ Imprimir Ticket</button>
    </div>
</body>
</html>
        `;
    }
}

module.exports = new TicketService();