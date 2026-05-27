
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, UserIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ventaService from '../../api/ventasAPI';
import clienteService from '../../api/clientesAPI';
import BuscadorProducto from './BuscarVenta';
import CarritoCompras from './CarritoCompra';
import MetodoPagoSelector from './MetodoPago';
import Toast from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';


const RegistroVenta = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Datos de la venta
  const [cliente, setCliente] = useState(null);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [metodoPago, setMetodoPago] = useState(null);
  const [transferenciaData, setTransferenciaData] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // Buscar clientes
  useEffect(() => {
    const buscar = async () => {
      if (buscarCliente.length < 2) {
        setClientesSugeridos([]);
        return;
      }
      try {
        const response = await clienteService.buscar(buscarCliente);
        setClientesSugeridos(response.data);
      } catch (error) {
        console.error('Error buscando clientes:', error);
      }
    };
    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [buscarCliente]);
  const calcularSubtotal = () => {
    return productos.reduce((total, p) => total + (p.cantidad * p.precio_unitario), 0);
  };

  const calcularDescuento = () => {
    return productos.reduce((total, p) => {
      const descuento = (p.cantidad * p.precio_unitario) * (p.descuento_linea / 100);
      return total + descuento;
    }, 0);
  };

  const calcularIVA = () => {
    return (calcularSubtotal() - calcularDescuento()) * 0.16;
  };

  const calcularTotal = () => {
    return calcularSubtotal() - calcularDescuento() + calcularIVA();
  };

  // Manejar productos
  const handleAgregarProducto = (producto) => {
    setProductos(prev => {
      const existente = prev.find(p => p.id_producto === producto.id_producto);
      if (existente) {
        return prev.map(p =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, {
        ...producto,
        cantidad: 1,
        descuento_linea: 0
      }];
    });
  };

  const handleActualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleEliminarProducto(index);
      return;
    }
    setProductos(prev => prev.map((p, i) => i === index ? { ...p, cantidad: nuevaCantidad } : p));
  };

  const handleEliminarProducto = (index) => {
    setProductos(prev => prev.filter((_, i) => i !== index));
  };

  const handleActualizarDescuento = (index, descuento) => {
    setProductos(prev => prev.map((p, i) => i === index ? { ...p, descuento_linea: descuento } : p));
  };

  // Registrar venta
  const handleRegistrarVenta = async () => {
    if (!cliente) {
      setToast({ message: 'Seleccione un cliente', type: 'error' });
      return;
    }
    if (productos.length === 0) {
      setToast({ message: 'Agregue al menos un producto', type: 'error' });
      return;
    }
    if (!metodoPago) {
      setToast({ message: 'Seleccione un método de pago', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const datosVenta = {
        id_cliente: cliente.id_cliente,
        id_empleado: 2002,
        productos: productos.map(p => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
          descuento_linea: p.descuento_linea
        })),
        id_metodo_pago: metodoPago,
        observaciones: observaciones || null
      };

      if (metodoPago === 2 && transferenciaData) {
        datosVenta.transferencia = transferenciaData;
      }

      const response = await ventaService.registrar(datosVenta);
      
      setToast({ message: `Venta ${response.data.folio} registrada exitosamente`, type: 'success' });
      
      setTimeout(() => {
        navigate(`/ventas/${response.data.id_venta}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error registrando venta:', error);
      setToast({ 
        message: error.response?.data?.message || 'Error al registrar la venta', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nueva Venta</h1>
        <p className="text-gray-500 text-sm mt-1">Registrar una nueva venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Productos y cliente */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold text-gray-800">Cliente</h2>
            </div>
            
            {cliente ? (
              <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{cliente.nombre_completo}</p>
                  <p className="text-sm text-gray-500">Tipo: {cliente.nombre_tipo}</p>
                  <p className="text-xs text-gray-400">Factor: {cliente.factor_precio || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setCliente(null)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={buscarCliente}
                  onChange={(e) => setBuscarCliente(e.target.value)}
                  placeholder="Buscar cliente por nombre o teléfono..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
                {clientesSugeridos.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                    {clientesSugeridos.map(c => (
                      <div
                        key={c.id_cliente}
                        onClick={() => {
                          setCliente(c);
                          setBuscarCliente('');
                          setClientesSugeridos([]);
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      >
                        <p className="font-medium text-gray-800">{c.nombre_completo}</p>
                        <p className="text-sm text-gray-500">{c.telefono || 'Sin teléfono'} • {c.nombre_tipo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buscador de productos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Agregar Productos</h2>
            <BuscadorProducto onAgregarProducto={handleAgregarProducto} />
          </div>

          {/* Carrito */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Carrito de Compra</h2>
            <CarritoCompras
              productos={productos}
              onActualizarCantidad={handleActualizarCantidad}
              onEliminarProducto={handleEliminarProducto}
              onActualizarDescuento={handleActualizarDescuento}
            />
          </div>
        </div>

        {/* Columna derecha - Totales y pago */}
        <div className="space-y-6">
          {/* Resumen de totales (sin flete/seguro) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCartIcon className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold text-gray-800">Resumen</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span>${calcularSubtotal().toFixed(2)}</span>
              </div>
              {calcularDescuento() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${calcularDescuento().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">IVA (16%):</span>
                <span>${calcularIVA().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL:</span>
                  <span className="text-primary-600">${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              
              <h2 className="font-semibold text-gray-800">Método de Pago</h2>
            </div>
            <MetodoPagoSelector
              value={metodoPago}
              onChange={setMetodoPago}
              onTransferenciaData={setTransferenciaData}
            />
          </div>

          {/* Observaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <textarea
              placeholder="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
            />
          </div>

          {/* Botón registrar */}
          <button
            onClick={handleRegistrarVenta}
            disabled={loading || productos.length === 0 || !cliente || !metodoPago}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : (
              <>
                <ShoppingCartIcon className="h-5 w-5" />
                Registrar Venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistroVenta;