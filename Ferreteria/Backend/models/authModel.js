const { query } = require('../config/database');

class AuthModel {
    
    // Verificar credenciales sin el hashing _ _
    async verificarCredenciales(username, password) {
        const sqlQuery = `
            SELECT 
                u.id_usuario,
                u.id_persona,
                u.username,
                u.password_hash AS password,
                u.id_rol,
                r.nombre_rol,
                r.descripcion AS descripcion_rol,
                u.activo,
                u.ultimo_acceso,
                u.fecha_creacion,
                -- Datos de la persona
                p.nombre,
                p.apellido_paterno,
                p.apellido_materno,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email,
                p.telefono,
                -- Datos del empleado (si es empleado)
                e.id_empleado,
                e.numero_empleado,
                pu.nombre_puesto
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN personas p ON u.id_persona = p.id_persona
            LEFT JOIN empleados e ON p.id_persona = e.id_persona
            LEFT JOIN puestos pu ON e.id_puesto = pu.id_puesto
            WHERE u.username = @username AND u.activo = 1
        `;
        
        const result = await query(sqlQuery, { username });
        const usuario = result.recordset[0];
        
        if (!usuario) {
            return null;
        }
        
        if (usuario.password !== password) {
            return null;
        }
        delete usuario.password;
        
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
    
    // Obtener usuario por ID
    async obtenerPorId(id_usuario) {
        const sqlQuery = `
            SELECT 
                u.id_usuario,
                u.username,
                u.id_rol,
                r.nombre_rol,
                u.activo,
                u.ultimo_acceso,
                CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', ISNULL(p.apellido_materno, '')) AS nombre_completo,
                p.email
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN personas p ON u.id_persona = p.id_persona
            WHERE u.id_usuario = @id_usuario
        `;
        
        const result = await query(sqlQuery, { id_usuario });
        return result.recordset[0] || null;
    }
    
    // Verificar si username existe
    async existeUsername(username, excludeId = null) {
        let sqlQuery = `SELECT COUNT(*) AS total FROM usuarios WHERE username = @username`;
        const params = { username };
        
        if (excludeId) {
            sqlQuery += ` AND id_usuario != @excludeId`;
            params.excludeId = excludeId;
        }
        
        const result = await query(sqlQuery, params);
        return result.recordset[0].total > 0;
    }
    
    // Crear usuario (para el registro)
    async crearUsuario(id_persona, username, password, id_rol) {
        // Verificar si ya existe
        if (await this.existeUsername(username)) {
            throw new Error('El nombre de usuario ya está en uso');
        }
        
        const sqlQuery = `
            INSERT INTO usuarios (id_persona, username, password_hash, id_rol)
            OUTPUT INSERTED.id_usuario
            VALUES (@id_persona, @username, @password, @id_rol)
        `;
        
        const result = await query(sqlQuery, {
            id_persona,
            username,
            password,
            id_rol
        });
        
        return result.recordset[0].id_usuario;
    }
    
    // Cambiar contraseña
    async cambiarPassword(id_usuario, password_actual, password_nueva) {
        const usuario = await this.obtenerConPassword(id_usuario);
        
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        
        if (usuario.password_hash !== password_actual) {
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
 
    async obtenerConPassword(id_usuario) {
        const sqlQuery = `
            SELECT id_usuario, username, password_hash
            FROM usuarios
            WHERE id_usuario = @id_usuario
        `;
        
        const result = await query(sqlQuery, { id_usuario });
        return result.recordset[0] || null;
    }
}

module.exports = new AuthModel();