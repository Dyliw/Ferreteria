const { query } = require('../config/database');

class UsuarioModel {
    
    // Crear usuario (sin hashing)
    async crear(datos) {
        const sqlQuery = `
            INSERT INTO usuarios (
                id_persona, 
                username, 
                password_hash, 
                id_rol
            ) 
            OUTPUT INSERTED.id_usuario
            VALUES (
                @id_persona, 
                @username, 
                @password, 
                @id_rol
            )
        `;
        
        const params = {
            id_persona: datos.id_persona,
            username: datos.username,
            password: datos.password, // Contraseña directa sin hash
            id_rol: datos.id_rol
        };
        
        const result = await query(sqlQuery, params);
        return result.recordset[0].id_usuario;
    }
      async obtenerRoles() {
        const sqlQuery = `
            SELECT 
                id_rol,
                nombre_rol,
                descripcion
            FROM roles
            ORDER BY id_rol ASC
        `;
        
        try {
            const result = await query(sqlQuery);
            return result.recordset || [];
        } catch (error) {
            console.error('Error al obtener roles:', error);
            return [];
        }
    }
    
    // También agrega este método para empleados sin usuario (si no existe)
    async obtenerEmpleadosSinUsuario() {
        const sqlQuery = `
            SELECT 
                e.id_empleado,
                e.numero_empleado,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                pu.nombre_puesto
            FROM empleados e
            INNER JOIN personas p ON e.id_persona = p.id_persona
            INNER JOIN puestos pu ON e.id_puesto = pu.id_puesto
            WHERE e.activo = 1
            AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id_persona = p.id_persona)
            ORDER BY p.nombre ASC
        `;
        
        try {
            const result = await query(sqlQuery);
            return result.recordset || [];
        } catch (error) {
            console.error('Error al obtener empleados sin usuario:', error);
            return [];
        }
    }

    
    // Obtener usuario por ID
    async obtenerPorId(id_usuario) {
        const sqlQuery = `
            SELECT 
                u.id_usuario,
                u.id_persona,
                u.username,
                u.id_rol,
                r.nombre_rol,
                r.descripcion AS descripcion_rol,
                u.activo,
                u.ultimo_acceso,
                u.fecha_creacion,
                p.nombre,
                p.apellido_paterno,
                p.apellido_materno,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email,
                p.telefono
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN personas p ON u.id_persona = p.id_persona
            WHERE u.id_usuario = @id_usuario
        `;
        
        const result = await query(sqlQuery, { id_usuario });
        return result.recordset[0] || null;
    }
    
    // Obtener usuario por username
   async obtenerPorUsername(username) {
    const sqlQuery = `
        SELECT 
            u.id_usuario,
            u.id_persona,
            u.username,
            u.password_hash,
            u.id_rol,
            r.nombre_rol,
            u.activo,
            CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
            e.id_empleado
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        INNER JOIN personas p ON u.id_persona = p.id_persona
        LEFT JOIN empleados e ON p.id_persona = e.id_persona
        WHERE u.username = @username
    `;
    
    const result = await query(sqlQuery, { username });
    return result.recordset[0] || null;
}
    
    // Obtener usuario por persona
    async obtenerPorPersona(id_persona) {
        const sqlQuery = `
            SELECT 
                u.id_usuario,
                u.username,
                u.id_rol,
                r.nombre_rol,
                u.activo,
                u.ultimo_acceso
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.id_persona = @id_persona
        `;
        
        const result = await query(sqlQuery, { id_persona });
        return result.recordset[0] || null;
    }
    
    // Actualizar usuario
    async actualizar(id_usuario, datos) {
        const updateFields = [];
        const updateParams = { id_usuario };
        
        if (datos.username) {
            updateFields.push(`username = @username`);
            updateParams.username = datos.username;
        }
        
        if (datos.password) {
            updateFields.push(`password_hash = @password`);
            updateParams.password = datos.password;
        }
        
        if (datos.id_rol !== undefined) {
            updateFields.push(`id_rol = @id_rol`);
            updateParams.id_rol = datos.id_rol;
        }
        
        if (updateFields.length > 0) {
            const sqlQuery = `
                UPDATE usuarios 
                SET ${updateFields.join(', ')}
                WHERE id_usuario = @id_usuario
            `;
            await query(sqlQuery, updateParams);
        }
        
        return this.obtenerPorId(id_usuario);
    }
    
    // Verificar credenciales (sin hash)
    async verificarCredenciales(username, password) {
        const usuario = await this.obtenerPorUsername(username);
        
        if (!usuario) {
            return null;
        }
        
        if (!usuario.activo) {
            throw new Error('Usuario inactivo');
        }
        
        // Comparación directa
        if (usuario.password_hash !== password) {
            return null;
        }
        
        // Actualizar último acceso
        await this.actualizarUltimoAcceso(usuario.id_usuario);
        
        delete usuario.password_hash;
        
        return usuario;
    }
    
    // Actualizar último acceso
    async actualizarUltimoAcceso(id_usuario) {
        const sqlQuery = `
            UPDATE usuarios 
            SET ultimo_acceso = GETDATE()
            WHERE id_usuario = @id_usuario
        `;
        
        await query(sqlQuery, { id_usuario });
    }
  
    async cambiarEstado(id_usuario, activo) {
        const sqlQuery = `
            UPDATE usuarios 
            SET activo = @activo
            WHERE id_usuario = @id_usuario
        `;
        
        await query(sqlQuery, { id_usuario, activo: activo ? 1 : 0 });
        return this.obtenerPorId(id_usuario);
    }
    

    async cambiarPassword(id_usuario, password_actual, password_nueva) {
        const usuario = await this.obtenerPorId(id_usuario);
        
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        
        const usuarioCompleto = await this.obtenerPorUsername(usuario.username);
        
        if (usuarioCompleto.password_hash !== password_actual) {
            throw new Error('Contraseña actual incorrecta');
        }
        
        const sqlQuery = `
            UPDATE usuarios 
            SET password_hash = @password_nueva
            WHERE id_usuario = @id_usuario
        `;
        
        await query(sqlQuery, { id_usuario, password_nueva });
        
        return true;
    }
    
    // Listar usuarios
    async listar(filtros = {}) {
        let sqlQuery = `
            SELECT 
                u.id_usuario,
                u.username,
                u.id_rol,
                r.nombre_rol,
                u.activo,
                u.ultimo_acceso,
                FORMAT(u.ultimo_acceso, 'dd/MM/yyyy HH:mm') AS ultimo_acceso_formato,
                u.fecha_creacion,
                p.id_persona,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email,
                p.telefono,
                e.id_empleado,
                e.numero_empleado,
                pu.nombre_puesto
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN personas p ON u.id_persona = p.id_persona
            LEFT JOIN empleados e ON p.id_persona = e.id_persona
            LEFT JOIN puestos pu ON e.id_puesto = pu.id_puesto
            WHERE 1=1
        `;
        
        const params = {};
        
        if (filtros.termino && filtros.termino.trim() !== '') {
            sqlQuery += ` AND (
                u.username LIKE @termino 
                OR p.nombre LIKE @termino 
                OR p.apellido_paterno LIKE @termino
                OR p.email LIKE @termino
            )`;
            params.termino = `%${filtros.termino}%`;
        }
        
        if (filtros.id_rol) {
            sqlQuery += ` AND u.id_rol = @id_rol`;
            params.id_rol = filtros.id_rol;
        }
        
        if (filtros.activo !== undefined && filtros.activo !== null) {
            sqlQuery += ` AND u.activo = @activo`;
            params.activo = filtros.activo === 'true' || filtros.activo === true ? 1 : 0;
        }
        
        sqlQuery += ` ORDER BY u.activo DESC, p.nombre ASC`;
        
        const result = await query(sqlQuery, params);
        return result.recordset;
    }
}

module.exports = new UsuarioModel();