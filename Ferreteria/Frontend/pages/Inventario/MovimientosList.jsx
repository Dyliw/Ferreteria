import React, { useState, useEffect } from 'react';
import { EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { inventarioService } from '../../api/inventario';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import FiltrosMovimientos from './FiltrosMovimientos';
import TablaMovimientos from './TablaMovimientos';
import productoService from '../../api/productosAPI';

const MovimientosList = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pagina: 1, total: 0, total_paginas: 0 });
  const [resumen, setResumen] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    tipo: '',
    id_producto: '',
    pagina: 1,
    limite: 20
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    cargarMovimientos();
    cargarProductos();
  }, [filtros]);

  const cargarMovimientos = async () => {
    setLoading(true);
    try {
      const response = await inventarioService.listarMovimientos({
        ...filtros,
        incluir_resumen: true
      });
      setMovimientos(response.data.data);
      setPagination(response.data.pagination);
      setResumen(response.data.resumen);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await productoService.getAll({ limite: 500 });
      const productosData = response.data || response;
      setProductos(Array.isArray(productosData) ? productosData : (productosData.data || []));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProductos([]);
    }
  };

  const handleFilterChange = (nuevosFiltros) => {
    setFiltros({ ...filtros, ...nuevosFiltros, pagina: 1 });
  };

  const handleVerDetalle = async (id) => {
    try {
      const response = await inventarioService.obtenerMovimiento(id);
      setSelectedMovimiento(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
    }
  };

  const exportarCSV = () => {
    console.log('Exportar a CSV');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <SearchBar 
            onSearch={(termino) => handleFilterChange({ termino })}
            placeholder="Buscar por producto o referencia..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button
            onClick={exportarCSV}
            className="px-4 py-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <FiltrosMovimientos 
          filtros={filtros}
          onChange={handleFilterChange}
          productos={productos}
        />
      )}

      {/* Resumen de movimientos */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase">Total Movimientos</p>
            <p className="text-2xl font-bold text-gray-800">{resumen.total_movimientos}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase">Entradas</p>
            <p className="text-2xl font-bold text-green-600">{resumen.total_entradas?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase">Salidas</p>
            <p className="text-2xl font-bold text-red-600">{resumen.total_salidas?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase">Productos Afectados</p>
            <p className="text-2xl font-bold text-gray-800">{resumen.productos_afectados}</p>
          </div>
        </div>
      )}

      {/* Tabla de movimientos */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <TablaMovimientos 
            movimientos={movimientos}
            onVerDetalle={handleVerDetalle}
          />
          
          <Pagination
            currentPage={pagination.pagina}
            totalPages={pagination.total_paginas}
            onPageChange={(page) => setFiltros({ ...filtros, pagina: page })}
          />
        </>
      )}

      {/* Modal de detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMovimiento(null);
        }}
        title="Detalle del Movimiento"
        size="lg"
      >
        {selectedMovimiento && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Fecha</p>
                <p className="font-medium">{selectedMovimiento.fecha_completa}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tipo de Movimiento</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  selectedMovimiento.tipo_movimiento === 'ENTRADA' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedMovimiento.nombre_movimiento}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Producto</p>
                <p className="font-medium">{selectedMovimiento.nombre_producto}</p>
                <p className="text-xs text-gray-400">SKU: {selectedMovimiento.sku}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cantidad</p>
                <p className="font-bold text-lg">{selectedMovimiento.cantidad.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Stock Antes</p>
                <p>{selectedMovimiento.stock_antes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Stock Después</p>
                <p>{selectedMovimiento.stock_despues}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Referencia</p>
                <p>{selectedMovimiento.referencia_tabla || 'N/A'}</p>
                {selectedMovimiento.referencia_folio && (
                  <p className="text-xs text-gray-400">Folio: {selectedMovimiento.referencia_folio}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400">Usuario</p>
                <p>{selectedMovimiento.usuario_nombre || 'Sistema'}</p>
              </div>
            </div>
            {selectedMovimiento.observaciones && (
              <div>
                <p className="text-xs text-gray-400">Observaciones</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedMovimiento.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MovimientosList;