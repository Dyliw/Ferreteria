import { useState, useEffect, useCallback } from 'react';
import ventaService from '../api/ventasAPI';


export const useVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 20,
    total: 0,
    total_paginas: 0
  });
  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    cancelada: 'false'
  });

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        pagina: pagination.pagina,
        limite: pagination.limite,
        ...filters
      };
      const response = await ventaService.listar(params);
      setVentas(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.pagina, pagination.limite, filters]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const cambiarPagina = (nuevaPagina) => {
    setPagination(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const actualizarFiltros = (nuevosFiltros) => {
    setFilters(prev => ({ ...prev, ...nuevosFiltros }));
    setPagination(prev => ({ ...prev, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setFilters({
      fecha_desde: '',
      fecha_hasta: '',
      cancelada: 'false'
    });
    setPagination(prev => ({ ...prev, pagina: 1 }));
  };

  return {
    ventas,
    loading,
    pagination,
    filters,
    cargarVentas,
    cambiarPagina,
    actualizarFiltros,
    limpiarFiltros
  };
};

export default useVentas;