// models/PedidoModel.js
const { query } = require('../config/database');

const clienteModel = require('./clienteModel');
const productoModel = require('./productoModel');
const estadoPedidoModel = require('./estadoPedidoModel');

class PedidoModel {

    async crearPedido(datos) {
        const {
            id_cliente,
            id_empleado,
            fecha_entrega_estimada,
            productos, 
            observaciones = null
        } = datos;

        if (!id_cliente) throw new Error('El cliente es requerido');
        if (!id_empleado) throw new Error('El empleado es requerido');
        if (!productos || productos.length === 0) throw new Error('El pedido debe tener al menos un producto');

        const cliente = await clienteModel.obtenerPorId(id_cliente);
        if (!cliente) throw new Error('Cliente no encontrado');

        const idsProductos = productos.map(p => p.id_producto);
        const stocks = await productoModel.consultarStockMultiple(idsProductos);
        for (const item of productos) {
            const stock = stocks.find(s => s.id_producto === item.id_producto);
            if (!stock || stock.stock_actual < item.cantidad) {
                throw new Error(`Stock insuficiente para producto ${item.id_producto}. Disponible: ${stock?.stock_actual || 0}, Solicitado: ${item.cantidad}`);
            }
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();
            const request = transaction.request();
            
            // Generar folio 
            const anio = new Date().getFullYear();
            await request.query(`
                IF NOT EXISTS (SELECT 1 FROM folios WHERE tabla_nombre = 'PEDIDOS' AND anio = ${anio})
                    INSERT INTO folios (tabla_nombre, ultimo_numero, prefijo, anio)
                    VALUES ('PEDIDOS', 0, 'PED', ${anio});
                
                UPDATE folios SET ultimo_numero = ultimo_numero + 1
                WHERE tabla_nombre = 'PEDIDOS' AND anio = ${anio};
                
                SELECT prefijo + RIGHT('0000' + CAST(ultimo_numero AS VARCHAR), 5) AS folio
                FROM folios WHERE tabla_nombre = 'PEDIDOS' AND anio = ${anio};
            `);
            const folioResult = await request.query();
            const folio = folioResult.recordset[0].folio;
            
            // Obtener estado inicial de cotizacion
            const estado = await estadoPedidoModel.obtenerPorNombre('COTIZACION');
            if (!estado) throw new Error('Estado inicial no encontrado');
            
            // Calcular subtotal y detalles con precios
            let subtotal = 0;
            const detallesCalculados = [];
            for (const item of productos) {
                const precioUnitario = await this.obtenerPrecioPedido(item.id_producto, cliente.id_tipo_cliente, item.cantidad);
                const subtotalLinea = item.cantidad * precioUnitario;
                subtotal += subtotalLinea;
                detallesCalculados.push({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: precioUnitario,
                    subtotal_linea: subtotalLinea
                });
            }
            
            // Insertar cabecera
            const insertResult = await request
                .input('folio', sql.NVarChar, folio)
                .input('id_cliente', sql.Int, id_cliente)
                .input('id_empleado', sql.Int, id_empleado)
                .input('fecha_entrega_estimada', sql.Date, fecha_entrega_estimada)
                .input('id_estado', sql.Int, estado.id_estado)
                .input('subtotal', sql.Decimal(18,2), subtotal)
                .input('total', sql.Decimal(18,2), subtotal)
                .input('observaciones', sql.NVarChar, observaciones)
                .query(`
                    INSERT INTO pedidos (folio, id_cliente, id_empleado, fecha_entrega_estimada, id_estado, subtotal, total, observaciones)
                    OUTPUT INSERTED.id_pedido
                    VALUES (@folio, @id_cliente, @id_empleado, @fecha_entrega_estimada, @id_estado, @subtotal, @total, @observaciones)
                `);
            const id_pedido = insertResult.recordset[0].id_pedido;
            
            // Insertar detalles
            for (const detalle of detallesCalculados) {
                await request
                    .input('id_pedido', sql.Int, id_pedido)
                    .input('id_producto', sql.Int, detalle.id_producto)
                    .input('cantidad', sql.Int, detalle.cantidad)
                    .input('precio_unitario', sql.Decimal(18,2), detalle.precio_unitario)
                    .input('subtotal_linea', sql.Decimal(18,2), detalle.subtotal_linea)
                    .query(`
                        INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal_linea)
                        VALUES (@id_pedido, @id_producto, @cantidad, @precio_unitario, @subtotal_linea)
                    `);
            }
            
            // Registrar historial inicial
            await request
                .input('id_pedido', sql.Int, id_pedido)
                .input('id_estado_anterior', sql.Int, null)
                .input('id_estado_nuevo', sql.Int, estado.id_estado)
                .input('observaciones', sql.NVarChar, 'Pedido creado')
                .input('id_usuario', sql.Int, id_empleado)
                .query(`
                    INSERT INTO historial_pedido (id_pedido, id_estado_anterior, id_estado_nuevo, observaciones, id_usuario)
                    VALUES (@id_pedido, @id_estado_anterior, @id_estado_nuevo, @observaciones, @id_usuario)
                `);
            
            await transaction.commit();
            return this.obtenerPedidoPorId(id_pedido);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }


// Listar todos los estados posibles de pedido
async listarEstadosPedido() {
    const result = await query(`
        SELECT id_estado, nombre_estado, orden
        FROM estados_pedido
        ORDER BY orden
    `);
    return result.recordset;
}

// Cancelar un pedido explícitamente
async cancelarPedido(id_pedido, id_usuario, motivo = 'Cancelado por usuario') {
    const estadoCancelado = await query(
        `SELECT id_estado FROM estados_pedido WHERE nombre_estado = 'CANCELADO'`
    );
    if (estadoCancelado.recordset.length === 0) {
        throw new Error('No se encontró el estado CANCELADO');
    }
    const id_estado_cancelado = estadoCancelado.recordset[0].id_estado;

    return this.actualizarEstado(id_pedido, id_estado_cancelado, id_usuario, motivo);
}
    async actualizarEstado(id_pedido, nuevo_estado_id, id_usuario, observaciones = null) {
        const pedido = await this.obtenerPedidoPorId(id_pedido);
        if (!pedido) throw new Error('Pedido no encontrado');
        const nuevoEstado = await estadoPedidoModel.obtenerPorId(nuevo_estado_id);
        if (!nuevoEstado) throw new Error('Estado no válido');
        
        const esValida = estadoPedidoModel.esTransicionValida(pedido.nombre_estado, nuevoEstado.nombre_estado);
        if (!esValida) {
            throw new Error(`No se puede cambiar de ${pedido.nombre_estado} a ${nuevoEstado.nombre_estado}`);
        }
        try {
            await callProcedure('sp_CambiarEstadoPedido', {
                id_pedido: Number(id_pedido),
                nuevo_estado: Number(nuevo_estado_id),
                observaciones: observaciones || `Cambio de estado a ${nuevoEstado.nombre_estado}`,
                id_usuario: Number(id_usuario)
            });
            
            return this.obtenerPedidoPorId(id_pedido);
        } catch (error) {
            throw new Error(`Error al cambiar estado: ${error.message}`);
        }
    }

    async obtenerPedidoPorId(id_pedido) {
        const pedidoQuery = `
            SELECT 
                p.id_pedido, p.folio, p.fecha_pedido,
                FORMAT(p.fecha_pedido, 'dd/MM/yyyy HH:mm') AS fecha_formato,
                p.fecha_entrega_estimada,
                FORMAT(p.fecha_entrega_estimada, 'dd/MM/yyyy') AS fecha_entrega_estimada_formato,
                p.fecha_entrega_real, p.subtotal, p.total, p.observaciones, p.activo,
                c.id_cliente,
                CONCAT(pers.nombre, ' ', pers.apellido_paterno, ' ', ISNULL(pers.apellido_materno, '')) AS cliente_nombre,
                pers.telefono AS cliente_telefono, pers.email AS cliente_email,
                tc.nombre_tipo AS cliente_tipo,
                e.id_empleado,
                CONCAT(emp.nombre, ' ', emp.apellido_paterno) AS vendedor_nombre,
                ep.id_estado, ep.nombre_estado, ep.orden,
                DATEDIFF(DAY, GETDATE(), p.fecha_entrega_estimada) AS dias_restantes,
                CASE 
                    WHEN p.fecha_entrega_real IS NOT NULL THEN 'ENTREGADO'
                    WHEN GETDATE() > p.fecha_entrega_estimada THEN 'ATRASADO'
                    WHEN DATEDIFF(DAY, GETDATE(), p.fecha_entrega_estimada) <= 2 THEN 'POR VENCER'
                    ELSE 'NORMAL'
                END AS estado_seguimiento
            FROM pedidos p
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN personas pers ON c.id_persona = pers.id_persona
            INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
            INNER JOIN empleados e ON p.id_empleado = e.id_empleado
            INNER JOIN personas emp ON e.id_persona = emp.id_persona
            INNER JOIN estados_pedido ep ON p.id_estado = ep.id_estado
            WHERE p.id_pedido = @id_pedido
        `;
        const pedidoResult = await query(pedidoQuery, { id_pedido });
        if (pedidoResult.recordset.length === 0) return null;
        const pedido = pedidoResult.recordset[0];
        
        // Detalles
        const detallesQuery = `
            SELECT dp.id_detalle_pedido, dp.id_producto, pr.nombre_producto, pr.sku,
                   dp.cantidad, dp.precio_unitario, dp.subtotal_linea
            FROM detalle_pedido dp
            INNER JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE dp.id_pedido = @id_pedido
        `;
        const detallesResult = await query(detallesQuery, { id_pedido });
        pedido.productos = detallesResult.recordset;
        
        pedido.historial = await this.obtenerHistorialPedido(id_pedido);
        
        return pedido;
    }

    async listarPedidosPendientes() {
        const sql = `SELECT * FROM vw_PedidosPendientes ORDER BY dias_para_entregar ASC, fecha_pedido DESC`;
        const result = await query(sql);
        return result.recordset;
    }
    async listarPedidos(filtros = {}) {
        const params = {};
        let where = "WHERE 1=1";
        if (filtros.folio) {
            where += " AND p.folio LIKE @folio";
            params.folio = `%${filtros.folio}%`;
        }
        if (filtros.id_cliente) {
            where += " AND p.id_cliente = @id_cliente";
            params.id_cliente = Number(filtros.id_cliente);
        }
        if (filtros.estado_nombre) {
            where += " AND ep.nombre_estado = @estado_nombre";
            params.estado_nombre = filtros.estado_nombre;
        }
        if (filtros.id_empleado) {
            where += " AND p.id_empleado = @id_empleado";
            params.id_empleado = Number(filtros.id_empleado);
        }
        if (filtros.fecha_desde) {
            where += " AND p.fecha_pedido >= @fecha_desde";
            params.fecha_desde = filtros.fecha_desde;
        }
        if (filtros.fecha_hasta) {
            where += " AND p.fecha_pedido <= @fecha_hasta";
            params.fecha_hasta = filtros.fecha_hasta;
        }
        if (filtros.atrasados === 'true') {
            where += ` AND p.fecha_entrega_estimada < GETDATE() 
                       AND ep.nombre_estado NOT IN ('ENTREGADO', 'CANCELADO')`;
        }

        const pagina = parseInt(filtros.pagina) || 1;
        const limite = parseInt(filtros.limite) || 20;
        const offset = (pagina - 1) * limite;
        params.offset = offset;
        params.limite = limite;

        const sql = `
            SELECT 
                p.id_pedido, p.folio, p.fecha_pedido,
                CONVERT(varchar, p.fecha_pedido, 103) + ' ' + RIGHT(CONVERT(varchar, p.fecha_pedido, 108), 5) AS fecha_formato,
                p.fecha_entrega_estimada,
                CONVERT(varchar, p.fecha_entrega_estimada, 103) AS fecha_entrega_estimada_formato,
                p.subtotal, p.total, p.activo,
                (pers.nombre + ' ' + pers.apellido_paterno + ISNULL(' ' + pers.apellido_materno, '')) AS cliente_nombre,
                pers.telefono AS cliente_telefono,
                ep.id_estado, ep.nombre_estado,
                (emp.nombre + ' ' + emp.apellido_paterno) AS vendedor_nombre,
                DATEDIFF(DAY, GETDATE(), p.fecha_entrega_estimada) AS dias_restantes
            FROM pedidos p
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN personas pers ON c.id_persona = pers.id_persona
            INNER JOIN empleados e ON p.id_empleado = e.id_empleado
            INNER JOIN personas emp ON e.id_persona = emp.id_persona
            INNER JOIN estados_pedido ep ON p.id_estado = ep.id_estado
            ${where}
            ORDER BY p.fecha_pedido DESC
            OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
        `;
        const countSql = `
            SELECT COUNT(*) AS total
            FROM pedidos p
            INNER JOIN estados_pedido ep ON p.id_estado = ep.id_estado
            ${where}
        `;
        
        const [countResult, dataResult] = await Promise.all([
            query(countSql, params),
            query(sql, params)
        ]);
        
        const total = countResult.recordset[0]?.total || 0;
        return {
            data: dataResult.recordset,
            pagination: { total, pagina, limite, total_paginas: Math.ceil(total / limite) }
        };
    }

    async obtenerPrecioPedido(id_producto, id_tipo_cliente, cantidad) {
        const querySQL = `
            SELECT dbo.CalcularPrecioConPeso(@id_producto, @id_tipo_cliente, @cantidad, 1, 'PROMEDIO') AS precio
        `;
        const result = await query(querySQL, { id_producto, id_tipo_cliente, cantidad });
        return result.recordset[0].precio;
    }

    async obtenerHistorialPedido(id_pedido) {
        const querySQL = `
            SELECT h.id_historial, h.fecha_cambio,
                   FORMAT(h.fecha_cambio, 'dd/MM/yyyy HH:mm:ss') AS fecha_formato,
                   ea.nombre_estado AS estado_anterior,
                   en.nombre_estado AS estado_nuevo,
                   h.observaciones, u.id_usuario, u.username AS usuario_nombre
            FROM historial_pedido h
            LEFT JOIN estados_pedido ea ON h.id_estado_anterior = ea.id_estado
            INNER JOIN estados_pedido en ON h.id_estado_nuevo = en.id_estado
            LEFT JOIN usuarios u ON h.id_usuario = u.id_usuario
            WHERE h.id_pedido = @id_pedido
            ORDER BY h.fecha_cambio ASC
        `;
        const result = await query(querySQL, { id_pedido });
        return result.recordset;
    }
}

module.exports = new PedidoModel();