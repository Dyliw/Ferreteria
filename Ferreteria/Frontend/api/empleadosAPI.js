import api from './axiosConfig';

const empleadoService = {

    async listar(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        const response = await api.get(`/empleados?${params}`);

        if (!response.data?.data) {
            console.warn('Estructura de respuesta inesperada:', response.data);
            return { data: [], pagination: { total: 0, pagina: 1, total_paginas: 1 } };
        }

        return response.data;
    },
    async obtenerPorId(id) {
        try {
            const response = await api.get(`/empleados/${id}`);
            return {
                success: true,
                data: response.data.data || response.data
            };
        } catch (error) {
            console.error('Error en obtenerPorId:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener empleado'
            };
        }
    },
    async crear(datos) {
        const response = await api.post('/empleados', datos);
        return response.data;
    },
    async actualizar(id, datos) {
        const response = await api.put(`/empleados/${id}`, datos);
        return response.data;
    },
    async cambiarEstado(id, activo) {
        const response = await api.patch(`/empleados/${id}/estado`, { activo });
        return response.data;
    },
    async obtenerPuestos() {
        const response = await api.get('/empleados/catalogos/puestos');

        if (!response.data?.data) {
            return { data: [] };
        }

        return response.data;
    },

    async obtenerPorPuesto(id_puesto) {
        const response = await api.get(`/empleados/puesto/${id_puesto}`);
        return response.data;
    },
    async obtenerDisponibles() {
        const response = await api.get('/empleados/disponibles/lista');
        return response.data;
    },
    async obtenerEstadisticas() {
        const response = await api.get('/empleados/estadisticas/resumen');
        return response.data;
    },
};

export default empleadoService;