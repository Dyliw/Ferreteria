import React, { useState, useEffect } from 'react';
import Modal from '../../components/Common/Modal';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowDownIcon, PrinterIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ventaService from '../../api/ventasAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';


const DetalleVenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  useEffect(() => {
    if (id) {
      cargarVenta();
    }
  }, [id]);

  const cargarVenta = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Cargando venta ID:', id);
      const response = await ventaService.obtenerPorId(id);
      console.log('📦 Respuesta:', response);
      
      if (response.success && response.data) {
        setVenta(response.data);
      } else {
        setError('No se encontró la venta');
      }
    } catch (error) {
      console.error('Error cargando venta:', error);
      if (error.response?.status === 404) {
        setError(`La venta con ID ${id} no existe`);
      } else {
        setError('Error al cargar la venta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarTicket = async () => {
    try {
      const pdfBlob = await ventaService.generarTicketPDF(id);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${venta?.folio || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Ticket descargado', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al descargar ticket', type: 'error' });
    }
  };

  const handleCancelarVenta = async () => {
    if (!motivoCancelacion) {
      setToast({ message: 'Ingrese un motivo de cancelación', type: 'error' });
      return;
    }
    try {
      await ventaService.cancelar(id, motivoCancelacion);
      setToast({ message: 'Venta cancelada exitosamente', type: 'success' });
      setCancelModalOpen(false);
      cargarVenta();
    } catch (error) {
      setToast({ message: 'Error al cancelar venta', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg">{error}</p>
        <button onClick={() => navigate('/ventas')} className="mt-4 text-primary-600 hover:underline">
          Volver a ventas
        </button>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Venta no encontrada</p>
        <button onClick={() => navigate('/ventas')} className="mt-4 text-primary-600 hover:underline">
          Volver a ventas
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ventas')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{venta.folio}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Registrada el {new Date(venta.fecha_venta).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDescargarTicket}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Ticket PDF
          </button>
          {!venta.cancelada && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
              Cancelar Venta
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Datos del Cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{venta.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de cliente</p>
                <p className="font-medium">{venta.cliente_tipo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p>{venta.cliente_telefono || 'No registrado'}</p>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Producto</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">Cantidad</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Precio Unitario</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {venta.detalles?.map((detalle, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{detalle.nombre_producto}</p>
                        <p className="text-xs text-gray-400">SKU: {detalle.sku}</p>
                      </td>
                      <td className="px-5 py-3 text-center">{detalle.cantidad}</td>
                      <td className="px-5 py-3 text-right">${detalle.precio_unitario?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-medium">${detalle.total_linea?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          {venta.observaciones && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-2">Observaciones</h2>
              <p className="text-gray-600">{venta.observaciones}</p>
            </div>
          )}
        </div>

        {/* Columna derecha - Resumen */}
        <div className="space-y-6">
          {/* Estado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Estado</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${venta.cancelada ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              <span className={`h-2 w-2 rounded-full ${venta.cancelada ? 'bg-red-500' : 'bg-green-500'}`} />
              {venta.cancelada ? 'Cancelada' : 'Activa'}
            </div>
            {venta.motivo_cancelacion && (
              <p className="mt-3 text-sm text-gray-500">Motivo: {venta.motivo_cancelacion}</p>
            )}
          </div>

          {/* Resumen financiero */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span>${venta.subtotal?.toFixed(2)}</span>
              </div>
              {venta.descuento_total > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${venta.descuento_total?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">IVA (16%):</span>
                <span>${venta.iva?.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL:</span>
                  <span className="text-primary-600">${venta.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Método de Pago</h2>
            <p className="font-medium text-gray-800">{venta.metodo_pago}</p>
          </div>

          {/* Vendedor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Vendedor</h2>
            <p className="font-medium">{venta.vendedor_nombre}</p>
          </div>
        </div>
      </div>

      {/* Modal de cancelación */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancelar Venta" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de cancelar la venta <strong>{venta?.folio}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </p>
          <textarea
            placeholder="Motivo de cancelación (requerido)"
            value={motivoCancelacion}
            onChange={(e) => setMotivoCancelacion(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCancelarVenta}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancelar Venta
            </button>
            <button
              onClick={() => setCancelModalOpen(false)}
              className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Volver
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DetalleVenta;