const { query } = require('../config/database');

class CategoriaModel {
    
    // obtener las categorias
    async obtenerTodos(activo = null) {
        let sqlQuery = `
            SELECT 
                id_categoria,
                nombre_categoria,
                descripcion,
                activo,
                (SELECT COUNT(*) FROM productos WHERE id_categoria = c.id_categoria AND activo = 1) AS total_productos
            FROM categorias c
            WHERE 1=1
        `;
        
        const params = {};
        
        if (activo !== null && activo !== undefined) {
            sqlQuery += ` AND activo = @activo`;
            params.activo = activo ? 1 : 0;
        }
        
        sqlQuery += ` ORDER BY nombre_categoria ASC`;
        
        const result = await query(sqlQuery, params);
        return result.recordset;
    }
    
    async obtenerPorId(id_categoria) {
        const sqlQuery = `
            SELECT 
                id_categoria,
                nombre_categoria,
                descripcion,
                activo
            FROM categorias
            WHERE id_categoria = @id_categoria
        `;
        
        const result = await query(sqlQuery, { id_categoria });
        return result.recordset[0] || null;
    }
    
    async crear(datos) {
        // Verificar si ya existe una categoría con ese nombre
        const existeQuery = `SELECT id_categoria FROM categorias WHERE nombre_categoria = @nombre_categoria`;
        const existe = await query(existeQuery, { nombre_categoria: datos.nombre_categoria });
        
        if (existe.recordset.length > 0) {
            return existe.recordset[0].id_categoria;
        }
        
        const sqlQuery = `
            INSERT INTO categorias (nombre_categoria, descripcion)
            OUTPUT INSERTED.id_categoria
            VALUES (@nombre_categoria, @descripcion)
        `;
        
        const params = {
            nombre_categoria: datos.nombre_categoria,
            descripcion: datos.descripcion || null
        };
        
        const result = await query(sqlQuery, params);
        return result.recordset[0].id_categoria;
    }

    async crearUObtener(nombre_categoria, descripcion = null) {
        const buscarQuery = `SELECT id_categoria FROM categorias WHERE nombre_categoria = @nombre_categoria`;
        const buscar = await query(buscarQuery, { nombre_categoria });
        
        if (buscar.recordset.length > 0) {
            return buscar.recordset[0].id_categoria;
        }

        const insertQuery = `
            INSERT INTO categorias (nombre_categoria, descripcion)
            OUTPUT INSERTED.id_categoria
            VALUES (@nombre_categoria, @descripcion)
        `;
        
        const result = await query(insertQuery, { nombre_categoria, descripcion });
        return result.recordset[0].id_categoria;
    }

    async actualizar(id_categoria, datos) {
        const updateFields = [];
        const updateParams = { id_categoria };
        
        if (datos.nombre_categoria !== undefined) {
            updateFields.push(`nombre_categoria = @nombre_categoria`);
            updateParams.nombre_categoria = datos.nombre_categoria;
        }
        
        if (datos.descripcion !== undefined) {
            updateFields.push(`descripcion = @descripcion`);
            updateParams.descripcion = datos.descripcion;
        }
        
        if (datos.activo !== undefined) {
            updateFields.push(`activo = @activo`);
            updateParams.activo = datos.activo ? 1 : 0;
        }
        
        if (updateFields.length === 0) {
            return this.obtenerPorId(id_categoria);
        }
        
        const sqlQuery = `
            UPDATE categorias 
            SET ${updateFields.join(', ')}
            WHERE id_categoria = @id_categoria
        `;
        
        await query(sqlQuery, updateParams);
        return this.obtenerPorId(id_categoria);
    }
    

    async eliminar(id_categoria) {
        // Verificar si tiene productos
        const checkQuery = `SELECT COUNT(*) AS total FROM productos WHERE id_categoria = @id_categoria AND activo = 1`;
        const checkResult = await query(checkQuery, { id_categoria });
        
        if (checkResult.recordset[0].total > 0) {
            throw new Error(`No se puede eliminar la categoría porque tiene ${checkResult.recordset[0].total} productos asociados`);
        }
        
        const sqlQuery = `DELETE FROM categorias WHERE id_categoria = @id_categoria`;
        await query(sqlQuery, { id_categoria });
        return true;
    }
    
    async buscar(termino) {
        const sqlQuery = `
            SELECT 
                id_categoria,
                nombre_categoria,
                descripcion,
                activo,
                (SELECT COUNT(*) FROM productos WHERE id_categoria = c.id_categoria) AS total_productos
            FROM categorias c
            WHERE nombre_categoria LIKE @termino OR descripcion LIKE @termino
            ORDER BY nombre_categoria ASC
        `;
        
        const result = await query(sqlQuery, { termino: `%${termino}%` });
        return result.recordset;
    }
}

module.exports = new CategoriaModel();