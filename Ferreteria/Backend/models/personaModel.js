const { query } = require('../config/database');

class PersonaModel {
    // Crear una nueva persona
        async crear(datos) {
        const sql = `
            INSERT INTO personas (
                nombre, apellido_paterno, apellido_materno, email, telefono, celular,
                rfc, curp, fecha_nacimiento, id_direccion
            )
            OUTPUT INSERTED.id_persona
            VALUES (
                @nombre, @apellidoPaterno, @apellidoMaterno, @email, @telefono, @celular,
                @rfc, @curp, @fechaNacimiento, @idDireccion
            )
        `;
        const params = {
            nombre: datos.nombre,
            apellidoPaterno: datos.apellidoPaterno,
            apellidoMaterno: datos.apellidoMaterno || null,
            email: datos.email || null,
            telefono: datos.telefono || null,
            celular: datos.celular || null,
            rfc: datos.rfc || null,
            curp: datos.curp || null,
            fechaNacimiento: datos.fechaNacimiento || null,
            idDireccion: datos.idDireccion || null
        };
        const result = await query(sql, params);
        return result.recordset[0].id_persona;
    }

    async actualizar(id_persona, datos) {
        // Construir UPDATE solo con los campos que vienen en datos
        const fields = [];
        const params = { id_persona };

        if (datos.nombre !== undefined) {
            fields.push('nombre = @nombre');
            params.nombre = datos.nombre;
        }
        if (datos.apellidoPaterno !== undefined) {
            fields.push('apellido_paterno = @apellidoPaterno');
            params.apellidoPaterno = datos.apellidoPaterno;
        }
        if (datos.apellidoMaterno !== undefined) {
            fields.push('apellido_materno = @apellidoMaterno');
            params.apellidoMaterno = datos.apellidoMaterno;
        }
        if (datos.email !== undefined) {
            fields.push('email = @email');
            params.email = datos.email;
        }
        if (datos.telefono !== undefined) {
            fields.push('telefono = @telefono');
            params.telefono = datos.telefono;
        }
        if (datos.celular !== undefined) {
            fields.push('celular = @celular');
            params.celular = datos.celular;
        }
        if (datos.rfc !== undefined) {
            fields.push('rfc = @rfc');
            params.rfc = datos.rfc;
        }
        if (datos.curp !== undefined) {
            fields.push('curp = @curp');
            params.curp = datos.curp;
        }
        if (datos.fechaNacimiento !== undefined) {
            fields.push('fecha_nacimiento = @fechaNacimiento');
            params.fechaNacimiento = datos.fechaNacimiento;
        }
        if (datos.idDireccion !== undefined) {
            fields.push('id_direccion = @idDireccion');
            params.idDireccion = datos.idDireccion;
        }

        if (fields.length === 0) return;

        const sql = `UPDATE personas SET ${fields.join(', ')} WHERE id_persona = @id_persona`;
        await query(sql, params);
    }

    async obtenerPorId(id_persona) {
        const sql = `SELECT * FROM personas WHERE id_persona = @id_persona`;
        const result = await query(sql, { id_persona });
        return result.recordset[0] || null;
    }

    
    // Actualizar persona existente
    async actualizar(id_persona, datos) {
        const sqlQuery = `
            UPDATE personas SET
                nombre = @nombre,
                apellido_paterno = @apellidoPaterno,
                apellido_materno = @apellidoMaterno,
                email = @email,
                telefono = @telefono,
                celular = @celular,
                rfc = @rfc,
                curp = @curp,
                fecha_nacimiento = @fechaNacimiento,
                id_direccion = @idDireccion
            WHERE id_persona = @id_persona
        `;
        
        const params = {
            id_persona,
            nombre: datos.nombre,
            apellidoPaterno: datos.apellidoPaterno,
            apellidoMaterno: datos.apellidoMaterno || null,
            email: datos.email || null,
            telefono: datos.telefono || null,
            celular: datos.celular || null,
            rfc: datos.rfc || null,
            curp: datos.curp || null,
            fechaNacimiento: datos.fechaNacimiento || null,
            idDireccion: datos.idDireccion || null
        };
        
        await query(sqlQuery, params);
        return true;
    }
    

    

}

module.exports = new PersonaModel();