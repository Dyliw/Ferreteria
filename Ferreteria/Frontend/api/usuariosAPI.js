import axios from 'axios';
import api from './axiosConfig';

const usuarioService = {
  async listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/usuarios?${params}`);
    return response.data;
  },

  async obtenerPorId(id) {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  async crear(datos) {
    const response = await api.post('/usuarios', datos);
    return response.data;
  },
  async actualizar(id, datos) {
    const response = await api.put(`/usuarios/${id}`, datos);
    return response.data;
  },
  async cambiarEstado(id, activo) {
    const response = await api.patch(`/usuarios/${id}/estado`, { activo });
    return response.data;
  },
  async cambiarPassword(id, password_actual, password_nueva) {
    const response = await api.patch(`/usuarios/${id}/password`, { password_actual, password_nueva });
    return response.data;
  },

  async obtenerRoles() {
    const response = await api.get('/usuarios/catalogos/roles');
    return response.data;
  },
};

export default usuarioService;