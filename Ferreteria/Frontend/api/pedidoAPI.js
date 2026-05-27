import api from './axiosConfig';

const pedidoService = {
  listar: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return api.get(`/pedidos?${params}`);
  },
  obtener: (id) => api.get(`/pedidos/${id}`),

   async crear(data) {
        let usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        let id_empleado = data.id_empleado || usuario.id_empleado;
        
        if (!id_empleado || id_empleado === 0 || id_empleado === 'undefined') {
            console.warn('⚠️ Usuario sin id_empleado, usando fallback: 2002');
            id_empleado = 2002; 
        }
        
        const payload = {
            id_cliente: parseInt(data.id_cliente),
            id_empleado: parseInt(id_empleado),
            fecha_entrega_estimada: data.fecha_entrega_estimada,
            productos: data.productos.map(p => ({
                id_producto: parseInt(p.id_producto),
                cantidad: parseInt(p.cantidad)
            })),
            observaciones: data.observaciones || null
        };
        
        console.log('📦 Payload enviado a backend:', payload);
        
        const response = await api.post('/pedidos', payload);
        return response.data;
    },
  actualizarEstado: (id, id_estado, observaciones) =>
    api.put(`/pedidos/${id}/estado`, { id_estado, observaciones }),

  obtenerEstados: () => api.get('/pedidos/catalogos/estados'),
  obtenerEstadisticas: () => api.get('/pedidos/estadisticas/resumen'),
};

export default pedidoService;