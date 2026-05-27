import api from './axiosConfig';

export const codigosPostalesAPI = {
    buscar: (cp) => api.get(`/cp/buscar/${cp}`)
};