const { executeFunction } = require('../config/database');

class CodigoPostalModel {
    async buscar(cp) {
        const rows = await executeFunction('buscar_cp', { cp: cp.toString().trim() });
        
        if (!rows || rows.length === 0) {
            return null;
        }
        
        // Agrupar asentamientos
        const asentamientos = rows.map(row => ({
            id_asentamiento: row.idasentamiento,
            asentamiento: row.asentamiento,
            id_tipo_asentamiento: row.idtipo_asentamiento,
            tipo_asentamiento: row.tipo_asentamiento,
            id_ciudad: row.id_ciudad,
            ciudad: row.ciudad
        }));
        
        // Datos comunes del codigo postal
        const primera = rows[0];
        
        return {
            id_codigo_postal: primera.id_codigo_postal,
            idcp: primera.id_codigo_postal,
            cp: primera.CodigoPostal,
            id_estado: primera.idestado,
            estado: primera.estado,
            id_municipio: primera.id_municipio,
            municipio: primera.municipio,
            zona: primera.zona,
            asentamientos: asentamientos
        };
    }
    
    // Método para validar existencia 
    async existe(cp) {
        const rows = await executeFunction('buscar_cp', { cp: cp.toString().trim() });
        return rows && rows.length > 0;
    }
}

module.exports = new CodigoPostalModel();