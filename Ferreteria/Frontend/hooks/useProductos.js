import { useState, useEffect, useCallback } from 'react';
import productoService from '../api/productosAPI';
import toast from 'react-hot-toast';

export const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 20,
    total: 0,
    total_paginas: 0,
  });
  const [filters, setFilters] = useState({
    termino: '',
    id_categoria: '',
    activo: 'true',
    stock_bajo: '',
    sin_stock: '',
  });

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        pagina: pagination.pagina,
        limite: pagination.limite,
        ...filters,
      };
      const response = await productoService.getAll(params);
      setProductos(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        total_paginas: response.pagination?.total_paginas || 0,
      }));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error(error.response?.data?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [pagination.pagina, pagination.limite, filters]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const changePage = (nuevaPagina) => {
    setPagination(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const updateFilters = (nuevosFiltros) => {
    setFilters(prev => ({ ...prev, ...nuevosFiltros }));
    setPagination(prev => ({ ...prev, pagina: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      termino: '',
      id_categoria: '',
      activo: 'true',
      stock_bajo: '',
      sin_stock: '',
    });
    setPagination(prev => ({ ...prev, pagina: 1 }));
  };

  const createProducto = async (data) => {
    try {
      const response = await productoService.create(data);
      toast.success('Producto registrado exitosamente');
      fetchProductos();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar producto';
      toast.error(message);
      throw error;
    }
  };

  const updateProducto = async (id, data) => {
    try {
      const response = await productoService.update(id, data);
      toast.success('Producto actualizado exitosamente');
      fetchProductos();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar producto';
      toast.error(message);
      throw error;
    }
  };

  const toggleStatus = async (id, activo) => {
    try {
      await productoService.changeStatus(id, activo);
      toast.success(`Producto ${activo ? 'activado' : 'desactivado'}`);
      fetchProductos();
    } catch (error) {
      toast.error('Error al cambiar estado del producto');
    }
  };

  const updateWeight = async (id, data) => {
    try {
      const response = await productoService.updateWeight(id, data);
      toast.success('Peso actualizado exitosamente');
      fetchProductos();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar peso';
      toast.error(message);
      throw error;
    }
  };

  return {
    productos,
    loading,
    pagination,
    filters,
    changePage,
    updateFilters,
    resetFilters,
    createProducto,
    updateProducto,
    toggleStatus,
    updateWeight,
    refetch: fetchProductos,
  };
};