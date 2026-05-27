import api from './axiosConfig';

const clienteService = {

    async listar(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        const response = await api.get(`/clientes?${params}`);
        return response.data;
    },

    async obtenerPorId(id) {
        try {
            const response = await api.get(`/clientes/${id}`);
            return {
                success: true,
                data: response.data.data || response.data
            };
        } catch (error) {
            console.error('Error en obtenerPorId:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener cliente'
            };
        }
    },
    async crear(datos) {
        const response = await api.post('/clientes', datos);
        return response.data;
    },

    async actualizar(id, datos) {
        const response = await api.put(`/clientes/${id}`, datos);
        return response.data;
    },

    async cambiarTipo(id, id_tipo_cliente) {
        const response = await api.patch(`/clientes/${id}/tipo`, { id_tipo_cliente });
        return response.data;
    },
    async cambiarEstado(id, activo) {
        const response = await api.patch(`/clientes/${id}/estado`, { activo });
        return response.data;
    },
    async buscarPorCP(cp) {
        try {
            const response = await api.get(`/clientes/codigo-postal/${cp}`);
            return response.data;
        } catch (error) {
            console.error('Error en buscarPorCP:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión'
            };
        }
    },

    async obtenerTipos() {
        const response = await api.get('/clientes/catalogos/tipos');
        return response.data;
    },

    async obtenerEstadisticas() {
        const response = await api.get('/clientes/estadisticas/resumen');
        return response.data;
    },
};

export default clienteService;