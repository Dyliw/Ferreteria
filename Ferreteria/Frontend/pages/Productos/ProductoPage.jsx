import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useProductos } from '../../hooks/useProductos';
import ProductoList from './ProductoList';
import ProductoFilters from './ProductoFilters';
import ProductoForm from './ProductoForm';
import Modal from '../../components/Common/Modal';
import Pagination from '../../components/Common/Pagination';
import productoService from '../../api/productosAPI';
import toast from 'react-hot-toast';


const ProductosPage = () => {
  const { hasRole } = useAuth();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  
  const [showPesoModal, setShowPesoModal] = useState(false);
  const [modoActualizacion, setModoActualizacion] = useState('peso');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [cantidadNuevaTanda, setCantidadNuevaTanda] = useState('');
  const [lote, setLote] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const {
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
    loadProductos,
  } = useProductos();

  const canEdit = hasRole(['ADMIN', 'ALMACEN']);

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setEditingProducto(null);
    setShowFormModal(true);
  };

  const handleSubmit = async (data) => {
    if (editingProducto) {
      await updateProducto(editingProducto.id_producto, data);
    } else {
      await createProducto(data);
    }
    setShowFormModal(false);
  };

  const handleOpenPesoModal = (producto) => {
    setProductoSeleccionado(producto);
    setNuevoPeso(producto.peso_actual_kg || producto.peso_kg || '');
    setCantidadNuevaTanda('');
    setLote('');
    setProveedor('');
    setModoActualizacion('peso');
    setShowPesoModal(true);
  };

  const handleOpenTandaModal = (producto) => {
    setProductoSeleccionado(producto);
    setNuevoPeso(producto.peso_actual_kg || producto.peso_kg || '');
    setCantidadNuevaTanda('');
    setLote('');
    setProveedor('');
    setModoActualizacion('tanda');
    setShowPesoModal(true);
  };

  const handleUpdateWeight = async () => {
    if (!nuevoPeso || parseFloat(nuevoPeso) <= 0) {
      toast.error('Ingrese un peso válido');
      return;
    }
    
    setUpdating(true);
    try {
      await productoService.updateWeight(productoSeleccionado.id_producto, {
        nuevo_peso_kg: parseFloat(nuevoPeso),
        lote: lote || null,
        proveedor: proveedor || null,
        observaciones: `Actualización manual de peso`
      });
      
      toast.success('Peso actualizado correctamente');
      setShowPesoModal(false);
      if (loadProductos) await loadProductos(); 
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar peso');
    } finally {
      setUpdating(false);
    }
  };
  const handleRegisterNewBatch = async () => {
    if (!nuevoPeso || parseFloat(nuevoPeso) <= 0) {
      toast.error('Ingrese un peso válido');
      return;
    }
    
    if (!cantidadNuevaTanda || parseInt(cantidadNuevaTanda) <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }
    
    setUpdating(true);
    try {
      await productoService.registerNewBatch(productoSeleccionado.id_producto, {
        nuevo_peso_kg: parseFloat(nuevoPeso),
        cantidad_nueva_tanda: parseInt(cantidadNuevaTanda),
        lote: lote || null,
        proveedor: proveedor || null,
        observaciones: `Nueva tanda registrada`
      });
      
      toast.success(`Nueva tanda registrada: +${cantidadNuevaTanda} unidades`);
      setShowPesoModal(false);
      if (loadProductos) await loadProductos();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al registrar nueva tanda');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona el catálogo de productos y sus precios</p>
        </div>
        {canEdit && (
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <ProductoFilters
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Lista de productos */}
      <ProductoList
        productos={productos}
        loading={loading}
        onEdit={handleEdit}
        onToggleStatus={toggleStatus}
        onUpdateWeight={handleOpenPesoModal}  
        onRegisterBatch={handleOpenTandaModal} 
        canEdit={canEdit}
      />

      {/* Paginación */}
      {pagination.total_paginas > 1 && (
        <Pagination
          currentPage={pagination.pagina}
          totalPages={pagination.total_paginas}
          onPageChange={changePage}
        />
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <ProductoForm
          producto={editingProducto}
          onSubmit={handleSubmit}
          onClose={() => setShowFormModal(false)}
        />
      </Modal>

      {/* Modal para actualizar peso */}
      {showPesoModal && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {modoActualizacion === 'peso' ? 'Actualizar peso' : 'Registrar nueva tanda'}
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Producto: <span className="font-semibold">{productoSeleccionado.nombre_producto}</span>
            </p>
            
            {/* Peso actual */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Peso actual registrado:</p>
              <p className="font-bold text-lg">
                {productoSeleccionado.peso_actual_kg || productoSeleccionado.peso_kg || 0} kg
              </p>
              {productoSeleccionado.peso_anterior_kg > 0 && (
                <p className="text-xs text-gray-500">
                  Peso anterior: {productoSeleccionado.peso_anterior_kg} kg
                </p>
              )}
            </div>
            
            {/* Nuevo peso */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Nuevo peso de la tanda (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={nuevoPeso}
                onChange={(e) => setNuevoPeso(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 2.5"
                required
              />
            </div>
            
            {/* Cantidad (solo para nueva tanda) */}
            {modoActualizacion === 'tanda' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Cantidad de la nueva tanda (unidades) *
                </label>
                <input
                  type="number"
                  step="1"
                  value={cantidadNuevaTanda}
                  onChange={(e) => setCantidadNuevaTanda(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stock actual: {productoSeleccionado.stock_actual || 0} unidades
                </p>
              </div>
            )}
            
            {/* Lote */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Lote (opcional)
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: LOTE-2024-001"
              />
            </div>
            
            {/* Proveedor */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Proveedor (opcional)
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Aceros Nacionales"
              />
            </div>
            
            {/* Información del promedio */}
            {modoActualizacion === 'peso' && productoSeleccionado.peso_actual_kg > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">📊 Nuevo promedio calculado:</p>
                <p className="text-sm text-blue-700">
                  ({productoSeleccionado.peso_actual_kg || productoSeleccionado.peso_kg || 0} + {nuevoPeso || 0}) / 2 ={' '}
                  <span className="font-bold">
                    {((parseFloat(productoSeleccionado.peso_actual_kg || productoSeleccionado.peso_kg || 0) + parseFloat(nuevoPeso || 0)) / 2).toFixed(2)} kg
                  </span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  El precio se recalculará automáticamente con este nuevo peso promedio
                </p>
              </div>
            )}
            
            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPesoModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modoActualizacion === 'peso' ? handleUpdateWeight : handleRegisterNewBatch}
                disabled={updating || !nuevoPeso || (modoActualizacion === 'tanda' && !cantidadNuevaTanda)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Guardando...' : modoActualizacion === 'peso' ? 'Actualizar peso' : 'Registrar tanda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosPage;