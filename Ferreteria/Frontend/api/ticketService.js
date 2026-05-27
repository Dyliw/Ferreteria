const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class TicketService {
    
    async generarTicketPDF(venta) {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: [226, 800], // Ancho 80mm, alto dinámico
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

                
                doc.fontSize(12)
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
                    .text(`TICKET: ${venta.folio}`, { align: 'center' });
                
                doc.fontSize(8)
                    .font('Helvetica')
                    .text(`Fecha: ${new Date(venta.fecha_venta).toLocaleString()}`, { align: 'center' })
                    .text(`Vendedor: ${venta.vendedor_nombre}`, { align: 'center' })
                    .moveDown(0.3);
                doc.font('Helvetica-Bold')
                    .text('CLIENTE:');
                doc.font('Helvetica')
                    .text(`${venta.cliente_nombre}`);
                
                if (venta.cliente_rfc) {
                    doc.text(`RFC: ${venta.cliente_rfc}`);
                }
                doc.text(`Tipo: ${venta.cliente_tipo}`);
                doc.moveDown(0.3);
                
                // Línea separadora
                doc.strokeColor('#CCCCCC')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();
                doc.moveDown(0.3);
                doc.fontSize(8)
                    .font('Helvetica-Bold')
                    .text('PRODUCTO', { continued: true })
                    .text('CANT', 100, doc.y - 8, { continued: true })
                    .text('P/U', 140, doc.y - 8, { continued: true })
                    .text('TOTAL', 180, doc.y - 8);
                
                doc.font('Helvetica');
                
                let yStart = doc.y;
                for (const detalle of venta.detalles) {
                    const nombre = detalle.nombre_producto.length > 25 
                        ? detalle.nombre_producto.substring(0, 22) + '...' 
                        : detalle.nombre_producto;
                    
                    doc.text(nombre, { continued: false });
                    doc.text(detalle.cantidad.toString(), 100, doc.y - 12, { continued: true });
                    doc.text(`$${detalle.precio_unitario.toFixed(2)}`, 140, doc.y - 12, { continued: true });
                    doc.text(`$${detalle.total_linea.toFixed(2)}`, 180, doc.y - 12);
                    
                    // Si tiene descuento, mostrarlo
                    if (detalle.descuento_linea > 0) {
                        doc.fontSize(7)
                            .fillColor('#666666')
                            .text(`  (Desc: ${detalle.descuento_linea}%)`, 15, doc.y - 6)
                            .fillColor('#000000')
                            .fontSize(8);
                    }
                }
                
                // Línea separadora
                doc.moveDown(0.5);
                doc.strokeColor('#CCCCCC')
                    .lineWidth(0.5)
                    .moveTo(10, doc.y)
                    .lineTo(216, doc.y)
                    .stroke();
                doc.moveDown(0.3);
                doc.fontSize(8);
                
                // Función helper para alinear texto
                const agregarLinea = (label, valor, esBold = false) => {
                    if (esBold) doc.font('Helvetica-Bold');
                    doc.text(label, { continued: true });
                    doc.text(valor, 150, doc.y - 8, { align: 'right' });
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
                doc.font('Helvetica-Bold')
                    .text('TOTAL:', { continued: true })
                    .text(`$${venta.total.toFixed(2)}`, 150, doc.y - 8, { align: 'right' });
                
                doc.font('Helvetica');
                doc.moveDown(0.3);
                doc.text(`PAGO CON: ${venta.metodo_pago}`);
                
                if (venta.transferencia) {
                    doc.fontSize(7);
                    doc.text(`Banco Emisor: ${venta.transferencia.banco_emisor}`);
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
                    .text('Conserve este ticket para garantías', { align: 'center' })
                    .text('y devoluciones', { align: 'center' })
                    .moveDown(0.3)
                    .text('Síguenos en redes sociales:', { align: 'center' })
                    .text('@FerreteriaElAcero', { align: 'center' });
                try {
                    const qrData = JSON.stringify({
                        folio: venta.folio,
                        total: venta.total,
                        fecha: venta.fecha_venta,
                        cliente: venta.cliente_nombre
                    });
                    
                    const qrBuffer = await QRCode.toBuffer(qrData, { width: 80 });
                    doc.image(qrBuffer, 73, doc.y, { width: 80 });
                } catch (qrError) {
                    // Si QR falla, continuar sin él
                    console.log('QR no generado:', qrError.message);
                }
                
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Generar ticket y guardar en archivo
    async guardarTicketPDF(venta, rutaArchivo) {
        const pdfBuffer = await this.generarTicketPDF(venta);
        fs.writeFileSync(rutaArchivo, pdfBuffer);
        return rutaArchivo;
    }
    
    // Generar ticket en formato HTML
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
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .ticket {
            max-width: 380px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
            margin-bottom: 5px;
            color: #c0392b;
        }
        .header p {
            font-size: 11px;
            color: #666;
            margin: 3px 0;
        }
        .info-section {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dotted #ccc;
        }
        .info-section h3 {
            font-size: 12px;
            margin-bottom: 8px;
            color: #333;
        }
        .info-row {
            font-size: 11px;
            margin: 4px 0;
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
            font-size: 11px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            margin-bottom: 8px;
        }
        .producto-item {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin: 6px 0;
        }
        .producto-nombre {
            flex: 2;
        }
        .producto-cant {
            width: 40px;
            text-align: center;
        }
        .producto-precio {
            width: 60px;
            text-align: right;
        }
        .producto-total {
            width: 60px;
            text-align: right;
        }
        .totales {
            border-top: 1px dashed #ccc;
            padding-top: 10px;
            margin-top: 10px;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin: 4px 0;
        }
        .total-grande {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #333;
            padding-top: 8px;
            margin-top: 8px;
        }
        .footer {
            text-align: center;
            border-top: 1px dashed #ccc;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 9px;
            color: #666;
        }
        .qr {
            text-align: center;
            margin-top: 15px;
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
                <p style="margin-top: 8px; font-size: 12px;"><strong>${venta.folio}</strong></p>
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
                    <div class="producto-item">
                        <span class="producto-nombre">${d.nombre_producto.length > 30 ? d.nombre_producto.substring(0, 27) + '...' : d.nombre_producto}</span>
                        <span class="producto-cant">${d.cantidad}</span>
                        <span class="producto-precio">$${d.precio_unitario.toFixed(2)}</span>
                        <span class="producto-total">$${d.total_linea.toFixed(2)}</span>
                    </div>
                    ${d.descuento_linea > 0 ? `<div class="producto-item" style="color:#888; font-size:9px; margin-top:-4px;"><span class="producto-nombre">  (Desc: ${d.descuento_linea}%)</span></div>` : ''}
                `).join('')}
            </div>
            
            <div class="totales">
                <div class="total-line">
                    <span>SUBTOTAL:</span>
                    <span>$${venta.subtotal.toFixed(2)}</span>
                </div>
                ${venta.descuento_total > 0 ? `
                <div class="total-line">
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
                    <span>Pago con:</span>
                    <span><strong>${venta.metodo_pago}</strong></span>
                </div>
                ${venta.transferencia ? `
                <div class="info-row" style="font-size: 9px;">
                    <span>Banco:</span>
                    <span>${venta.transferencia.banco_emisor}</span>
                </div>
                <div class="info-row" style="font-size: 9px;">
                    <span>Referencia:</span>
                    <span>${venta.transferencia.referencia}</span>
                </div>` : ''}
            </div>
            
            <div class="footer">
                <p>¡GRACIAS POR SU COMPRA! </p>
                <p>Conserve este ticket para garantías y devoluciones</p>
            </div>
            
            <div class="qr no-print" id="qrContainer"></div>
        </div>
        <button class="no-print" onclick="window.print()">Imprimir Ticket</button>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <script>
        // Generar QR
        const qrData = JSON.stringify({
            folio: "${venta.folio}",
            total: ${venta.total},
            fecha: "${new Date(venta.fecha_venta).toISOString()}"
        });
        new QRCode(document.getElementById("qrContainer"), {
            text: qrData,
            width: 100,
            height: 100
        });
    </script>
</body>
</html>
        `;
    }
}

module.exports = new TicketService();