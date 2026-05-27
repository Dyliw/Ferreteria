const { query } = require('../config/database');
const personaModel = require('./personaModel');
const usuarioModel = require('./usuarioModel');

class EmpleadoModel {
    
    async crear(datos) {
        let id_direccion = null;
        
        if (datos.calle && datos.numeroExterior && datos.idCodigoPostal) {
            const direccionModel = require('./direccionModel');
            id_direccion = await direccionModel.crear(
                datos.calle, datos.numeroExterior, datos.numeroInterior,
                datos.idCodigoPostal, datos.referencias
            );
        }
        
        const id_persona = await personaModel.crear({ ...datos, idDireccion: id_direccion });
 
        const anio = new Date().getFullYear();
        const ultimoNumero = await this.obtenerUltimoNumeroEmpleado();
        const numero_empleado = `EMP${anio}${String(ultimoNumero + 1).padStart(4, '0')}`;
        
        const sqlQuery = `
            INSERT INTO empleados (id_persona, id_puesto, numero_empleado, fecha_contratacion, salario, comision_por_venta)
            OUTPUT INSERTED.id_empleado
            VALUES (@id_persona, @id_puesto, @numero_empleado, @fecha_contratacion, @salario, @comision_por_venta)
        `;
        const result = await query(sqlQuery, {
            id_persona,
            id_puesto: datos.id_puesto,
            numero_empleado,
            fecha_contratacion: datos.fecha_contratacion || new Date(),
            salario: datos.salario || null,
            comision_por_venta: datos.comision_por_venta || 0
        });
        const id_empleado = result.recordset[0].id_empleado;
        
        if (datos.username && datos.password && datos.id_rol) {
            await usuarioModel.crear({
                id_persona,
                username: datos.username,
                password: datos.password,
                id_rol: datos.id_rol
            });
        }
        
        return this.obtenerPorId(id_empleado);
    }
    
    async obtenerUltimoNumeroEmpleado() {
        const result = await query(`
            SELECT TOP 1 CAST(SUBSTRING(numero_empleado, 8, 4) AS INT) AS numero
            FROM empleados WHERE numero_empleado LIKE 'EMP' + CAST(YEAR(GETDATE()) AS VARCHAR) + '%'
            ORDER BY numero_empleado DESC
        `);
        return result.recordset[0]?.numero || 0;
    }

    async obtenerPorId(id_empleado) {
        const sqlQuery = `
            SELECT 
                e.id_empleado, e.id_persona, e.id_puesto, e.numero_empleado,
                e.fecha_contratacion, e.salario, e.comision_por_venta, e.activo,
                FORMAT(e.fecha_contratacion, 'dd/MM/yyyy') AS fecha_contratacion_formato,
                p.nombre, p.apellido_paterno, p.apellido_materno,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email, p.telefono, p.celular, p.rfc, p.curp, p.fecha_nacimiento,
                pu.nombre_puesto, pu.salario_base,
                u.id_usuario, u.username, u.id_rol, r.nombre_rol,
                d.id_direccion, d.calle, d.numero_exterior, d.numero_interior,
                cp.cp AS codigo_postal, a.asentamiento, m.municipio, est.estado
            FROM empleados e
            INNER JOIN personas p ON e.id_persona = p.id_persona
            INNER JOIN puestos pu ON e.id_puesto = pu.id_puesto
            LEFT JOIN usuarios u ON p.id_persona = u.id_persona
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            LEFT JOIN direcciones d ON p.id_direccion = d.id_direccion
            LEFT JOIN codigos_postales cp ON d.id_codigo_postal = cp.idcp
            LEFT JOIN Asentamientos a ON cp.id_asentamiento = a.idasentamiento
            LEFT JOIN municipios m ON cp.id_municipio = m.id_municipio
            LEFT JOIN Estados est ON cp.id_estado = est.idestado
            WHERE e.id_empleado = @id_empleado
        `;
        const result = await query(sqlQuery, { id_empleado });
        return result.recordset[0] || null;
    }
    

    async listar(filtros = {}) {
        let sqlQuery = `
            SELECT 
                e.id_empleado, e.numero_empleado,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email, p.telefono,
                pu.nombre_puesto,
                e.salario, e.comision_por_venta,
                e.fecha_contratacion,
                FORMAT(e.fecha_contratacion, 'dd/MM/yyyy') AS fecha_contratacion_formato,
                e.activo,
                u.username, r.nombre_rol,
                DATEDIFF(YEAR, e.fecha_contratacion, GETDATE()) AS antiguedad_anios
            FROM empleados e
            INNER JOIN personas p ON e.id_persona = p.id_persona
            INNER JOIN puestos pu ON e.id_puesto = pu.id_puesto
            LEFT JOIN usuarios u ON p.id_persona = u.id_persona
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            WHERE 1=1
        `;
        const params = {};
        
        if (filtros.termino && filtros.termino.trim()) {
            sqlQuery += ` AND (
                p.nombre LIKE @termino OR p.apellido_paterno LIKE @termino
                OR p.apellido_materno LIKE @termino OR p.telefono LIKE @termino
                OR p.email LIKE @termino OR e.numero_empleado LIKE @termino
            )`;
            params.termino = `%${filtros.termino}%`;
        }
        if (filtros.id_puesto) {
            sqlQuery += ` AND e.id_puesto = @id_puesto`;
            params.id_puesto = filtros.id_puesto;
        }
        if (filtros.activo !== undefined && filtros.activo !== '') {
            sqlQuery += ` AND e.activo = @activo`;
            params.activo = filtros.activo === 'true' ? 1 : 0;
        }
        const baseQuery = sqlQuery;
       
        const pagina = parseInt(filtros.pagina) || 1;
        const limite = parseInt(filtros.limite) || 20;
        const offset = (pagina - 1) * limite;
         const countQuery = baseQuery.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) AS total FROM'
);
        sqlQuery += ` ORDER BY e.activo DESC, p.nombre ASC OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
        params.offset = offset;
        params.limite = limite;
        

        const countParams = { ...params };
        delete countParams.offset;
        delete countParams.limite;
        
        const [countResult, dataResult] = await Promise.all([
            query(countQuery, countParams),
            query(sqlQuery, params)
        ]);
        
        return {
            data: dataResult.recordset,
            pagination: {
                total: countResult.recordset[0]?.total || 0,
                pagina,
                limite,
                total_paginas: Math.ceil((countResult.recordset[0]?.total || 0) / limite)
            }
        };
    }
    
    async obtenerReporteVentas(anio = null, mes = null) {
        let sql = `SELECT * FROM vw_ReporteEmpleadosVentas WHERE 1=1`;
        const params = {};
        if (anio) {
            sql += ` AND anio = @anio`;
            params.anio = anio;
        }
        if (mes) {
            sql += ` AND mes = @mes`;
            params.mes = mes;
        }
        sql += ` ORDER BY monto_total DESC`;
        const result = await query(sql, params);
        return result.recordset;
    }
    
    async actualizar(id_empleado, datos) {
        const empleadoActual = await this.obtenerPorId(id_empleado);
        if (!empleadoActual) throw new Error('Empleado no encontrado');
        
        await personaModel.actualizar(empleadoActual.id_persona, datos);

        if (datos.calle && datos.numeroExterior && datos.idCodigoPostal) {
            const direccionModel = require('./direccionModel');
            if (empleadoActual.id_direccion) {
                await direccionModel.actualizar(empleadoActual.id_direccion, {
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
                    { id_direccion, id_persona: empleadoActual.id_persona });
            }
        }

        const updates = [];
        const params = { id_empleado };
        if (datos.id_puesto !== undefined) {
            updates.push('id_puesto = @id_puesto');
            params.id_puesto = datos.id_puesto;
        }
        if (datos.salario !== undefined) {
            updates.push('salario = @salario');
            params.salario = datos.salario;
        }
        if (datos.comision_por_venta !== undefined) {
            updates.push('comision_por_venta = @comision_por_venta');
            params.comision_por_venta = datos.comision_por_venta;
        }
        if (updates.length) {
            await query(`UPDATE empleados SET ${updates.join(', ')} WHERE id_empleado = @id_empleado`, params);
        }
 
        if (datos.username || datos.password || datos.id_rol) {
            const usuarioExistente = await usuarioModel.obtenerPorPersona(empleadoActual.id_persona);
            if (usuarioExistente) {
                await usuarioModel.actualizar(usuarioExistente.id_usuario, {
                    username: datos.username,
                    password: datos.password,
                    id_rol: datos.id_rol
                });
            } else if (datos.username && datos.password && datos.id_rol) {
                await usuarioModel.crear({
                    id_persona: empleadoActual.id_persona,
                    username: datos.username,
                    password: datos.password,
                    id_rol: datos.id_rol
                });
            }
        }
        
        return this.obtenerPorId(id_empleado);
    }
    
    async obtenerPuestos() {
        const result = await query(`
            SELECT id_puesto, nombre_puesto, salario_base, descripcion, ISNULL(activo, 1) AS activo
            FROM puestos WHERE activo = 1 OR activo IS NULL ORDER BY nombre_puesto
        `);
        return result.recordset;
    }

    async obtenerEstadisticas() {
        const result = await query(`
            SELECT 
                COUNT(*) AS total_empleados,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS empleados_activos,
                AVG(salario) AS salario_promedio,
                COUNT(DISTINCT id_puesto) AS puestos_ocupados
            FROM empleados
        `);
        return result.recordset[0];
    }
}

module.exports = new EmpleadoModel();