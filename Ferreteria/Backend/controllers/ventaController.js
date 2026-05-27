const ventaModel      = require('../models/ventaModel');
const ticketService   = require('../services/ticketService');
const metodoPagoModel = require('../models/metodoPagoModel');

class VentaController {

    async registrarVenta(req, res) {
        try {
            const datos      = req.body;
            const id_empleado = Number(req.usuario?.id_empleado || datos.id_empleado);

            if (!datos.id_cliente) {
                return res.status(400).json({ success: false, message: 'El cliente es requerido' });
            }
            if (!datos.productos || datos.productos.length === 0) {
                return res.status(400).json({ success: false, message: 'La venta debe tener al menos un producto' });
            }
            if (!id_empleado || isNaN(id_empleado)) {
                return res.status(400).json({ success: false, message: 'Empleado no identificado' });
            }

            const resultado = await ventaModel.registrarVenta({
                id_cliente:     Number(datos.id_cliente),
                id_empleado,
                id_metodo_pago: Number(datos.id_metodo_pago) || 1,
                productos:      datos.productos,
                observaciones:  datos.observaciones || null
            });

            if (!resultado?.venta) {
                return res.status(500).json({ success: false, message: 'Error al obtener los datos de la venta' });
            }

            return res.status(201).json({
                success: true,
                message: 'Venta registrada exitosamente',
                data:    resultado.venta,
                ticket:  resultado.ticket,
                warning: resultado.warning || null
            });

        } catch (error) {
            console.error('❌ Error al registrar venta:', error);
            return res.status(500).json({ success: false, message: error.message || 'Error al registrar venta' });
        }
    }

    async listarVentas(req, res) {
        try {
            const resultado = await ventaModel.listarVentas(req.query);
            return res.json({
                success:    true,
                data:       resultado.data,
                pagination: resultado.pagination
            });
        } catch (error) {
            console.error('Error al listar ventas:', error);
            return res.status(500).json({ success: false, message: 'Error al listar ventas' });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = Number(req.params.id);

            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID de venta inválido' });
            }

            const venta = await ventaModel.obtenerPorId(id);

            if (!venta) {
                return res.status(404).json({ success: false, message: 'Venta no encontrada' });
            }

            return res.json({ success: true, data: venta });

        } catch (error) {
            console.error('Error al obtener venta:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async cancelarVenta(req, res) {
        try {
            const id     = Number(req.params.id);
            const motivo = req.body.motivo;

            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID de venta inválido' });
            }
            if (!motivo) {
                return res.status(400).json({ success: false, message: 'El motivo de cancelación es requerido' });
            }

            const id_usuario = Number(req.usuario?.id_usuario) || 1;
            await ventaModel.cancelarVenta(id, motivo, id_usuario);

            return res.json({ success: true, message: 'Venta cancelada exitosamente' });

        } catch (error) {
            console.error('Error al cancelar venta:', error);
            const status = error.message === 'Venta no encontrada'      ? 404
                         : error.message === 'La venta ya está cancelada' ? 400
                         : 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }

    async generarTicketHTML(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const venta = await ventaModel.obtenerPorId(id);
            if (!venta) {
                return res.status(404).json({ success: false, message: 'Venta no encontrada' });
            }

            const html = ticketService.generarTicketHTML(venta);
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);

        } catch (error) {
            console.error('Error al generar ticket HTML:', error);
            return res.status(500).json({ success: false, message: 'Error al generar ticket' });
        }
    }

    async generarTicketPDF(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const venta = await ventaModel.obtenerPorId(id);
            if (!venta) {
                return res.status(404).json({ success: false, message: 'Venta no encontrada' });
            }

            const pdfBuffer = await ticketService.generarTicketPDF(venta);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=ticket_${venta.folio}.pdf`);
            return res.send(pdfBuffer);

        } catch (error) {
            console.error('Error al generar ticket PDF:', error);
            return res.status(500).json({ success: false, message: 'Error al generar ticket PDF' });
        }
    }

    async descargarTicketPDF(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const venta = await ventaModel.obtenerPorId(id);
            if (!venta) {
                return res.status(404).json({ success: false, message: 'Venta no encontrada' });
            }

            const pdfBuffer = await ticketService.generarTicketPDF(venta);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ticket_${venta.folio}.pdf`);
            return res.send(pdfBuffer);

        } catch (error) {
            console.error('Error al descargar ticket PDF:', error);
            return res.status(500).json({ success: false, message: 'Error al descargar ticket PDF' });
        }
    }

    async registrarPago(req, res) {
        try {
            const id              = Number(req.params.id);
            const { id_metodo_pago, monto, referencia } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            if (!id_metodo_pago) {
                return res.status(400).json({ success: false, message: 'El método de pago es requerido' });
            }
            if (!monto || monto <= 0) {
                return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
            }

            const venta = await ventaModel.obtenerPorId(id);
            if (!venta) {
                return res.status(404).json({ success: false, message: 'Venta no encontrada' });
            }

            return res.json({ success: true, message: 'Pago registrado exitosamente' });

        } catch (error) {
            console.error('Error al registrar pago:', error);
            return res.status(500).json({ success: false, message: 'Error al registrar pago' });
        }
    }

    async obtenerMetodosPago(req, res) {
        try {
            const metodos = await metodoPagoModel.obtenerTodos();
            return res.json({ success: true, data: metodos });
        } catch (error) {
            console.error('Error al obtener métodos de pago:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener métodos de pago' });
        }
    }

    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ventaModel.obtenerEstadisticas(req.query);
            return res.json({ success: true, data: { resumen: estadisticas } });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
        }
    }
}

module.exports = new VentaController();