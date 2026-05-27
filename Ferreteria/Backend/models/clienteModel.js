const { query, executeFunction } = require('../config/database');
const personaModel = require('./personaModel');
const direccionModel = require('./direccionModel');

class ClienteModel {
    
    async crear(datos) {
        let id_direccion = null;
        if (datos.calle && datos.numeroExterior && datos.idCodigoPostal) {
            id_direccion = await direccionModel.crear(
                datos.calle, datos.numeroExterior, datos.numeroInterior,
                datos.idCodigoPostal, datos.referencias
            );
        }
        const id_persona = await personaModel.crear({
            nombre: datos.nombre,
            apellidoPaterno: datos.apellidoPaterno,
            apellidoMaterno: datos.apellidoMaterno,
            email: datos.email,
            telefono: datos.telefono,
            celular: datos.celular,
            rfc: datos.rfc,
            curp: datos.curp,
            fechaNacimiento: datos.fechaNacimiento,
            idDireccion: id_direccion
        });
        const sql = `
            INSERT INTO clientes (id_persona, id_tipo_cliente, credito_autorizado, limite_credito, factor_descuento_extra)
            OUTPUT INSERTED.id_cliente
            VALUES (@id_persona, @id_tipo_cliente, @credito_autorizado, @limite_credito, @factor_descuento_extra)
        `;
        
        const result = await query(sql, {
            id_persona,
            id_tipo_cliente: datos.id_tipo_cliente || 1,
            credito_autorizado: datos.credito_autorizado ? 1 : 0,
            limite_credito: datos.limite_credito || 0,
            factor_descuento_extra: datos.factor_descuento_extra || 0
        });
        const id_cliente = result.recordset[0].id_cliente;
        return this.obtenerPorId(id_cliente);
    }
       async cambiarEstado(req, res) {
            try {
                const { id } = req.params;
                const { activo } = req.body;
    
                 if (datos.activo !== undefined) {
    let activoNumero;
    if (typeof datos.activo === 'string') {
        activoNumero = datos.activo.toLowerCase() === 'true' ? 1 : 0;
    } else {
        activoNumero = datos.activo ? 1 : 0;
    }
    updates.push('activo = @activo');
    params.activo = activoNumero;
}
    
                const cliente = await clienteModel.actualizar(id, { activo });
    
                res.json({
                    success: true,
                    message: `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`,
                    data: empleado
                });
    
            } catch (error) {
                console.error('Error al cambiar estado:', error);
    
                if (error.message === 'Cliente no encontrado') {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }
    
                res.status(500).json({
                    success: false,
                    message: 'Error al cambiar estado del empleado'
                });
            }
        }

    async buscar(filtros = {}) {
        const condiciones = [];
        const params = {};

        if (filtros.termino && filtros.termino.trim()) {
            condiciones.push(`(p.nombre LIKE @termino OR p.apellido_paterno LIKE @termino 
                              OR p.apellido_materno LIKE @termino OR p.telefono LIKE @termino
                              OR p.email LIKE @termino OR p.rfc LIKE @termino)`);
            params.termino = `%${filtros.termino}%`;
        }
        if (filtros.id_tipo_cliente) {
            condiciones.push(`c.id_tipo_cliente = @id_tipo_cliente`);
            params.id_tipo_cliente = filtros.id_tipo_cliente;
        }
        if (filtros.activo !== undefined && filtros.activo !== '') {
            condiciones.push(`c.activo = @activo`);
            params.activo = filtros.activo === 'true' ? 1 : 0;
        }

        const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM clientes c
            INNER JOIN personas p ON c.id_persona = p.id_persona
            INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
            ${whereClause}
        `;
        const countResult = await query(countQuery, params);
        const total = countResult.recordset[0].total;
        const pagina = parseInt(filtros.pagina) || 1;
        const limite = parseInt(filtros.limite) || 20;
        const offset = (pagina - 1) * limite;
        const ordenCampo = filtros.orden_campo || 'p.nombre';
        const ordenDireccion = filtros.orden_direccion === 'DESC' ? 'DESC' : 'ASC';

        const dataQuery = `
            SELECT 
                c.id_cliente,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email,
                p.telefono,
                tc.nombre_tipo,
                c.total_compras,
                c.ultima_compra,
                c.activo
            FROM clientes c
            INNER JOIN personas p ON c.id_persona = p.id_persona
            INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
            ${whereClause}
            ORDER BY ${ordenCampo} ${ordenDireccion}
            OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
        `;

        const dataResult = await query(dataQuery, {
            ...params,
            offset,
            limite
        });

        return {
            data: dataResult.recordset,
            pagination: {
                total,
                pagina,
                limite,
                total_paginas: Math.ceil(total / limite)
            }
        };
    }

    async obtenerPorId(id_cliente) {
        const sql = `
            SELECT 
                c.id_cliente, c.id_persona, c.id_tipo_cliente,
                c.fecha_registro, c.ultima_compra, c.total_compras,
                c.factor_descuento_extra, c.credito_autorizado, c.limite_credito, c.activo,
                p.nombre, p.apellido_paterno, p.apellido_materno,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email, p.telefono, p.celular, p.rfc, p.curp, p.fecha_nacimiento,
                tc.nombre_tipo, tc.descuento_base, tc.factor_precio,
                tc.requiere_volumen_minimo, tc.volumen_minimo,
                d.id_direccion, d.calle, d.numero_exterior, d.numero_interior, d.referencias,
                cp.cp AS codigo_postal, cp.idcp AS id_codigo_postal,
                a.asentamiento, ta.tipo_asentamiento, m.municipio, e.estado
            FROM clientes c
            INNER JOIN personas p ON c.id_persona = p.id_persona
            INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
            LEFT JOIN direcciones d ON p.id_direccion = d.id_direccion
            LEFT JOIN codigos_postales cp ON d.id_codigo_postal = cp.idcp
            LEFT JOIN Asentamientos a ON cp.id_asentamiento = a.idasentamiento
            LEFT JOIN TipoAnsentamiento ta ON cp.id_tipo_asentamiento = ta.idtipo_asentamiento
            LEFT JOIN municipios m ON cp.id_municipio = m.id_municipio
            LEFT JOIN Estados e ON cp.id_estado = e.idestado
            WHERE c.id_cliente = @id_cliente
        `;
        const result = await query(sql, { id_cliente });
        return result.recordset[0] || null;
    }
    
    async calcularDescuento(id_cliente, monto_original) {
        const sql = `SELECT dbo.CalcularDescuentoCliente(@id_cliente, @monto_original) AS descuento`;
        const result = await query(sql, { id_cliente, monto_original });
        return result.recordset[0]?.descuento || 0;
    }
    

    async obtenerInfoPorCP(cp) {
        const rows = await executeFunction('buscar_cp', { cp });
        return rows[0] || null;
    }

    async actualizar(id_cliente, datos) {
        const clienteActual = await this.obtenerPorId(id_cliente);
        if (!clienteActual) throw new Error('Cliente no encontrado');
        const personaData = {};
        if (datos.nombre !== undefined) personaData.nombre = datos.nombre;
        if (datos.apellidoPaterno !== undefined) personaData.apellidoPaterno = datos.apellidoPaterno;
        if (datos.apellidoMaterno !== undefined) personaData.apellidoMaterno = datos.apellidoMaterno;
        if (datos.email !== undefined) personaData.email = datos.email;
        if (datos.telefono !== undefined) personaData.telefono = datos.telefono;
        if (datos.celular !== undefined) personaData.celular = datos.celular;
        if (datos.rfc !== undefined) personaData.rfc = datos.rfc;
        if (datos.curp !== undefined) personaData.curp = datos.curp;
        if (datos.fechaNacimiento !== undefined) personaData.fechaNacimiento = datos.fechaNacimiento;
        if (datos.idDireccion !== undefined) personaData.idDireccion = datos.idDireccion;

        if (Object.keys(personaData).length > 0) {
            await personaModel.actualizar(clienteActual.id_persona, personaData);
        }

        // Manejar dirección
        if (datos.calle && datos.numeroExterior && datos.idCodigoPostal) {
            if (clienteActual.id_direccion) {
                await direccionModel.actualizar(clienteActual.id_direccion, {
                    calle: datos.calle,
                    numeroExterior: datos.numeroExterior,
                    numeroInterior: datos.numeroInterior,
                    idCodigoPostal: datos.idCodigoPostal,
                    referencias: datos.referencias
                });
            } else {
                const id_direccion = await direccionModel.crear(
                    datos.calle, datos.numeroExterior, datos.numeroInterior,
                    datos.idCodigoPostal, datos.referencias
                );
                await query(`UPDATE personas SET id_direccion = @id_direccion WHERE id_persona = @id_persona`,
                    { id_direccion, id_persona: clienteActual.id_persona });
            }
        }

        // Actualizar campos de cliente
        const updates = [];
        const params = { id_cliente };
        if (datos.id_tipo_cliente !== undefined) {
            updates.push('id_tipo_cliente = @id_tipo_cliente');
            params.id_tipo_cliente = datos.id_tipo_cliente;
        }
        if (datos.credito_autorizado !== undefined) {
            updates.push('credito_autorizado = @credito_autorizado');
            params.credito_autorizado = datos.credito_autorizado ? 1 : 0;
        }
        if (datos.limite_credito !== undefined) {
            updates.push('limite_credito = @limite_credito');
            params.limite_credito = datos.limite_credito;
        }
        if (datos.factor_descuento_extra !== undefined) {
            updates.push('factor_descuento_extra = @factor_descuento_extra');
            params.factor_descuento_extra = datos.factor_descuento_extra;
        }
        if (datos.activo !== undefined) {
            updates.push('activo = @activo');
            params.activo = datos.activo ? 1 : 0;
        }
        if (updates.length) {
            await query(`UPDATE clientes SET ${updates.join(', ')} WHERE id_cliente = @id_cliente`, params);
        }
        return this.obtenerPorId(id_cliente);
    }

    
    async obtenerTiposCliente() {
        const result = await query(`
            SELECT id_tipo_cliente, nombre_tipo, descuento_base, factor_precio,
                   requiere_volumen_minimo, volumen_minimo
            FROM tipos_cliente ORDER BY id_tipo_cliente
        `);
        return result.recordset;
    }

    async obtenerEstadisticas() {
        const result = await query(`
            SELECT 
                COUNT(*) AS total_clientes,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS clientes_activos,
                SUM(CASE WHEN credito_autorizado = 1 THEN 1 ELSE 0 END) AS clientes_con_credito,
                AVG(total_compras) AS promedio_compras,
                SUM(total_compras) AS total_ventas,
                COUNT(DISTINCT id_tipo_cliente) AS tipos_cliente_activos
            FROM clientes
        `);
        return result.recordset[0];
    }
}

module.exports = new ClienteModel();