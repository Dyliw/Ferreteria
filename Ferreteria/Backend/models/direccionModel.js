const { query } = require('../config/database');

class DireccionModel {
    async crear(calle, numeroExterior, numeroInterior, idCodigoPostal, referencias = null) {
        // Validar que el idCodigoPostal sea un número válido
        const idcp = Number(idCodigoPostal);
        if (isNaN(idcp) || idcp <= 0) {
            throw new Error('ID de código postal inválido: ' + idCodigoPostal);
        }

        const cpExiste = await this.validarCP(idcp);
        if (!cpExiste) {
            throw new Error(`El código postal con ID ${idcp} no existe en la base de datos`);
        }

        const sqlQuery = `
            INSERT INTO direcciones (
                calle, numero_exterior, numero_interior, id_codigo_postal, referencias
            )
            VALUES (
                @calle, @numeroExterior, @numeroInterior, @idCodigoPostal, @referencias
            );
            SELECT SCOPE_IDENTITY() AS id_direccion;
        `;
        const params = {
            calle,
            numeroExterior,
            numeroInterior: numeroInterior || null,
            idCodigoPostal: idcp,
            referencias: referencias || null
        };
        const result = await query(sqlQuery, params);
        const id_direccion = result.recordset[0].id_direccion;
        if (!id_direccion) {
            throw new Error('No se pudo crear la dirección (error en INSERT)');
        }
        return id_direccion;
    }

    async validarCP(idcp) {
        const result = await query(
            'SELECT COUNT(*) as total FROM codigos_postales WHERE idcp = @idcp',
            { idcp }
        );
        return result.recordset[0].total > 0;
    }

    async obtenerPorId(id_direccion) {
        const sql = `
            SELECT d.id_direccion, d.calle, d.numero_exterior, d.numero_interior, d.referencias,
                   cp.cp, cp.idcp, a.asentamiento, ta.tipo_asentamiento, m.municipio, e.estado
            FROM direcciones d
            INNER JOIN codigos_postales cp ON d.id_codigo_postal = cp.idcp
            LEFT JOIN Asentamientos a ON cp.id_asentamiento = a.idasentamiento
            LEFT JOIN TipoAnsentamiento ta ON cp.id_tipo_asentamiento = ta.idtipo_asentamiento
            LEFT JOIN municipios m ON cp.id_municipio = m.id_municipio
            LEFT JOIN Estados e ON cp.id_estado = e.idestado
            WHERE d.id_direccion = @id_direccion
        `;
        const result = await query(sql, { id_direccion });
        return result.recordset[0] || null;
    }

    async actualizar(id_direccion, datos) {
        const sql = `
            UPDATE direcciones SET
                calle = @calle,
                numero_exterior = @numeroExterior,
                numero_interior = @numeroInterior,
                id_codigo_postal = @idCodigoPostal,
                referencias = @referencias
            WHERE id_direccion = @id_direccion
        `;
        const params = {
            id_direccion,
            calle: datos.calle,
            numeroExterior: datos.numeroExterior,
            numeroInterior: datos.numeroInterior || null,
            idCodigoPostal: datos.idCodigoPostal,
            referencias: datos.referencias || null
        };
        await query(sql, params);
        return true;
    }

}

module.exports = new DireccionModel();