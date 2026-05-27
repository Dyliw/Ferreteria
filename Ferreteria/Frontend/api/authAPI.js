import api from './axiosConfig';

const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.success) {
      const { token, usuario } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      return { success: true, usuario };
    }
    return { success: false, message: response.data.message };
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  getCurrentUser() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async verificarToken() {
    try {
      const response = await api.get('/auth/verificar');
      return response.data.success;
    } catch {
      return false;
    }
  },

  async getPerfil() {
    const response = await api.get('/auth/perfil');
    return response.data.data;
  },
};

export default authService;