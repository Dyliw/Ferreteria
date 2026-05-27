import api from './axiosConfig'

export const inventarioService = {
  listarMovimientos: (params = {}) => api.get('/inventario/movimientos', { params }),
  obtenerMovimiento: (id) => api.get(`/inventario/movimientos/${id}`),
  obtenerMovimientosPorProducto: (id, params = {}) => 
    api.get(`/inventario/movimientos/producto/${id}`, { params }),

  registrarEntrada: (data) => api.post('/inventario/entrada', data),
  registrarAjuste: (data) => api.post('/inventario/ajuste', data),
  
  obtenerTiposMovimiento: () => api.get('/inventario/tipos-movimiento'),

  reporteRotacion: (params = {}) => api.get('/inventario/reportes/rotacion', { params }),
  reporteValor: () => api.get('/inventario/reportes/valor'),
  reporteStockBajo: () => api.get('/inventario/reportes/stock-bajo'),
  
  dashboard: () => api.get('/inventario/dashboard')
};