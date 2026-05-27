import api from './axiosConfig';


const ventaService = {
  async registrar(datos) {
    try {
        const { flete, seguro_descarga, ...datosLimpios } = datos;
        
        const response = await api.post('/ventas', datosLimpios);
        console.log(' Respuesta raw:', response);
        console.log('Response data:', response.data);
        
        if (!response.data) {
            throw new Error('No hay datos en la respuesta');
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error en servicio registrar:', error.response?.data || error.message);
        throw error;
    }
  },

  async listar(params = {}) {
    const response = await api.get('/ventas', { params });
    return response.data;
  },

  async obtenerPorId(id) {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  },

  async cancelar(id, motivo) {
    const response = await api.put(`/ventas/${id}/cancelar`, { motivo });
    return response.data;
  },
  async obtenerMetodosPago() {
    const response = await api.get('/ventas/catalogos/metodos-pago');
    return response.data;
  },

  async generarTicketPDF(id) {
    const response = await api.get(`/ventas/${id}/ticket/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  async obtenerEstadisticas(params = {}) {
    const response = await api.get('/ventas/estadisticas/resumen', { params });
    return response.data;
  },

  async buscarProductos(termino) {
    const response = await api.get('/productos', {
      params: { termino, activo: true, limite: 10 }
    });
    return response.data;
  },

  async buscarClientes(termino) {
    const response = await api.get('/clientes/buscar', {
      params: { termino, activo: true }
    });
    return response.data;
  }
};

export default ventaService;