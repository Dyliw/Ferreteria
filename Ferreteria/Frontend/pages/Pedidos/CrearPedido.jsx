import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Toast from '../../components/Common/Toast';
import Modal from '../../components/Common/Modal';
import pedidoService from '../../api/pedidoAPI';
import clienteService from '../../api/clientesAPI';
import productoService from '../../api/productosAPI';



const CrearPedido = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [productosBusqueda, setProductosBusqueda] = useState([]);
  const [showProductosModal, setShowProductosModal] = useState(false);
  const [termBusqueda, setTermBusqueda] = useState('');
  const [toast, setToast] = useState(null);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);

  const [formData, setFormData] = useState({
    id_cliente: '',
    fecha_entrega_estimada: '',
    productos: [],
    observaciones: '',
  });
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const res = await clienteService.listar({ activo: true, limite: 100 });
      console.log('Respuesta de clientes:', res);
    
      if (res && res.success && res.data) {
        setClientes(res.data);
      } else if (res && res.data) {
        setClientes(res.data);
      } else if (Array.isArray(res)) {
        setClientes(res);
      } else {
        setClientes([]);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setToast({ type: 'error', message: 'Error cargando clientes' });
    } finally {
      setLoadingClientes(false);
    }
  };

  const buscarProductos = async (termino) => {
    if (!termino || termino.length < 2) {
      setProductosBusqueda([]);
      return;
    }
    
    setLoadingProductos(true);
    try {
      const res = await productoService.getAll({ 
        termino, 
        activo: true, 
        limite: 20 
      });
      
      console.log('Respuesta de productos:', res);
      
      let productosArray = [];
      if (res && res.success && res.data) {
        productosArray = res.data;
      } else if (res && res.data) {
        productosArray = res.data;
      } else if (Array.isArray(res)) {
        productosArray = res;
      }
      
      setProductosBusqueda(productosArray);
    } catch (error) {
      console.error('Error buscando productos:', error);
      setToast({ type: 'error', message: 'Error al buscar productos' });
    } finally {
      setLoadingProductos(false);
    }
  };

  const agregarProducto = (producto) => {
    if (formData.productos.some(p => p.id_producto === producto.id_producto)) {
      setToast({ type: 'error', message: 'Producto ya agregado' });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      productos: [
        ...prev.productos,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre_producto,
          cantidad: 1,
          precio_unitario: producto.precio_estimado || producto.precio_base || 0,
          subtotal: (producto.precio_estimado || producto.precio_base || 0)
        }
      ]
    }));
    setShowProductosModal(false);
    setTermBusqueda('');
    setProductosBusqueda([]);
  };

  const actualizarCantidad = (index, cantidad) => {
    const nuevos = [...formData.productos];
    const nuevaCantidad = parseInt(cantidad) || 1;
    nuevos[index].cantidad = nuevaCantidad;
    nuevos[index].subtotal = nuevaCantidad * nuevos[index].precio_unitario;
    setFormData(prev => ({ ...prev, productos: nuevos }));
  };

  const eliminarProducto = (index) => {
    const nuevos = formData.productos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, productos: nuevos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_cliente) {
      setToast({ type: 'error', message: 'Seleccione un cliente' });
      return;
    }
    if (!formData.fecha_entrega_estimada) {
      setToast({ type: 'error', message: 'Indique fecha de entrega estimada' });
      return;
    }
    if (formData.productos.length === 0) {
      setToast({ type: 'error', message: 'Agregue al menos un producto' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id_cliente: parseInt(formData.id_cliente),
        id_empleado: 2002,
        fecha_entrega_estimada: formData.fecha_entrega_estimada,
        productos: formData.productos.map(p => ({ 
          id_producto: p.id_producto, 
          cantidad: p.cantidad 
        })),
        observaciones: formData.observaciones,
      };
      
      const res = await pedidoService.crear(payload);
      console.log('Pedido creado:', res);
      
      setToast({ type: 'success', message: 'Pedido creado exitosamente' });
      setTimeout(() => {
        if (res && res.data && res.data.id_pedido) {
          navigate(`/pedidos/${res.data.id_pedido}`);
        } else if (res && res.data && res.data.data && res.data.data.id_pedido) {
          navigate(`/pedidos/${res.data.data.id_pedido}`);
        } else {
          navigate('/pedidos');
        }
      }, 1500);
    } catch (error) {
      console.error('Error al crear pedido:', error);
      setToast({ type: 'error', message: error.response?.data?.message || 'Error al crear pedido' });
    } finally {
      setLoading(false);
    }
  };

  const subtotalTotal = formData.productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (termBusqueda && termBusqueda.length >= 2) {
        buscarProductos(termBusqueda);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [termBusqueda]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Pedido</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
          <select
            value={formData.id_cliente}
            onChange={(e) => setFormData(prev => ({ ...prev, id_cliente: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            required
            disabled={loadingClientes}
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map(cli => (
              <option key={cli.id_cliente} value={cli.id_cliente}>
                {cli.nombre_completo || `${cli.nombre} ${cli.apellido_paterno}`}
              </option>
            ))}
          </select>
          {loadingClientes && <p className="text-xs text-gray-400 mt-1">Cargando clientes...</p>}
          {!loadingClientes && clientes.length === 0 && (
            <p className="text-xs text-red-500 mt-1">No hay clientes disponibles</p>
          )}
        </div>

        {/* Fecha Entrega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega Estimada *</label>
          <input
            type="date"
            value={formData.fecha_entrega_estimada}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Productos */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">Productos</label>
            <button
              type="button"
              onClick={() => setShowProductosModal(true)}
              className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" /> Agregar producto
            </button>
          </div>

          {formData.productos.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
              No hay productos agregados
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio Unit.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.productos.map((prod, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{prod.nombre}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={prod.cantidad}
                          onChange={(e) => actualizarCantidad(idx, e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-2">${prod.precio_unitario?.toFixed(2)}</td>
                      <td className="px-4 py-2">${prod.subtotal?.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => eliminarProducto(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                    <td className="px-4 py-2">${subtotalTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea
            rows="3"
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
            placeholder="Instrucciones especiales para el pedido..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/pedidos')}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            Crear Pedido
          </button>
        </div>
      </form>

      {/* Modal para buscar producto */}
      <Modal isOpen={showProductosModal} onClose={() => setShowProductosModal(false)} title="Agregar Producto" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={termBusqueda}
              onChange={(e) => setTermBusqueda(e.target.value)}
              placeholder="Buscar por nombre o SKU (mínimo 2 caracteres)"
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg"
              autoFocus
            />
          </div>
          
          {loadingProductos && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          )}
          
          {!loadingProductos && (
            <div className="max-h-96 overflow-y-auto">
              {productosBusqueda.length === 0 && termBusqueda.length >= 2 && (
                <p className="text-center text-gray-400 py-8">No se encontraron productos</p>
              )}
              {productosBusqueda.length === 0 && termBusqueda.length < 2 && (
                <p className="text-center text-gray-400 py-8">Escribe al menos 2 caracteres para buscar</p>
              )}
              {productosBusqueda.map(prod => (
                <div
                  key={prod.id_producto}
                  onClick={() => agregarProducto(prod)}
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center transition"
                >
                  <div>
                    <p className="font-medium">{prod.nombre_producto}</p>
                    <p className="text-sm text-gray-500">SKU: {prod.sku || 'N/A'}</p>
                    <p className="text-xs text-gray-400">Stock: {prod.stock_actual || 0}</p>
                  </div>
                  <p className="text-primary-600 font-semibold">
                    ${(prod.precio_estimado || prod.precio_base || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CrearPedido;