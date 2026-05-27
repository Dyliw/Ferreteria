import api from './axiosConfig';

const productoService = {
  
  async getAll(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const url = `/productos${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  async getById(id) {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/productos', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },
  async changeStatus(id, activo) {
    const response = await api.patch(`/productos/${id}/estado`, { activo });
    return response.data;
  },
  async getStock(id) {
    const response = await api.get(`/productos/${id}/stock`);
    return response.data;
  },
  async getMultipleStock(ids) {
    const response = await api.post(`/productos/stock/consultar-multiple`, { ids });
    return response.data;
  },

  async updateWeight(id, data) {
    const response = await api.patch(`/productos/${id}/peso`, data);
    return response.data;
  },

  async registerNewBatch(id, data) {
    const response = await api.patch(`/productos/${id}/peso-stock`, data);
    return response.data;
  },

  async assignTax(id, id_impuesto, aplica = true) {
    const response = await api.post(`/productos/${id}/impuestos`, { id_impuesto, aplica });
    return response.data;
  },

  async getTaxes(id) {
    const response = await api.get(`/productos/${id}/impuestos`);
    return response.data;
  },
  
  async getPrices(id) {
    const response = await api.get(`/productos/${id}/precios`);
    return response.data;
  },

  async setSpecialPrice(id, data) {
    const response = await api.post(`/productos/${id}/precios-especiales`, data);
    return response.data;
  },
  async getAllCategories(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.activo !== undefined && params.activo !== null && params.activo !== '') {
      queryParams.append('activo', params.activo);
    }
    const url = `/productos/categorias${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  async getCategoryById(id) {
    const response = await api.get(`/productos/categorias/${id}`);
    return response.data;
  },

  async searchCategories(termino) {
    const response = await api.get(`/productos/categorias/buscar?termino=${encodeURIComponent(termino)}`);
    return response.data;
  },

  async createCategory(data) {
    const response = await api.post('/productos/categorias', data);
    return response.data;
  },

  async updateCategory(id, data) {
    const response = await api.put(`/productos/categorias/${id}`, data);
    return response.data;
  },
  async deleteCategory(id) {
    const response = await api.delete(`/productos/categorias/${id}`);
    return response.data;
  },
  async getCategoriesCatalog() {
    const response = await api.get('/productos/catalogos/categorias');
    return response.data;
  },

  async getTaxesList() {
    const response = await api.get('/productos/catalogos/impuestos');
    return response.data;
  },
  async getPriceLists() {
    const response = await api.get('/productos/catalogos/listas-precios');
    return response.data;
  },
  async getStats() {
    const response = await api.get('/productos/estadisticas/resumen');
    return response.data;
  },
};

export default productoService;