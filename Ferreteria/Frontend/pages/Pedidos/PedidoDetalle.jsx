import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Toast from '../../components/Common/Toast';
import Modal from '../../components/Common/Modal';
import pedidoService from '../../api/pedidoAPI';


const PedidoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState([]);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacionesEstado, setObservacionesEstado] = useState('');
  const [toast, setToast] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    cargarPedido();
    cargarEstados();
  }, [id]);

  const cargarPedido = async () => {
    setLoading(true);
    try {
      const res = await pedidoService.obtener(id);
      setPedido(res.data.data);
    } catch (error) {
      setToast({ type: 'error', message: 'Error al cargar el pedido' });
    } finally {
      setLoading(false);
    }
  };

  const cargarEstados = async () => {
    try {
        const res = await pedidoService.obtenerEstados();
        console.log('Estados desde backend:', res.data.data); // Depuración
        setEstados(res.data.data || []);
    } catch (error) {
        console.error('Error cargando estados', error);
    }
};

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    setCambiandoEstado(true);
    try {
      await pedidoService.actualizarEstado(id, nuevoEstado, observacionesEstado);
      setToast({ type: 'success', message: 'Estado actualizado correctamente' });
      setShowEstadoModal(false);
      cargarPedido();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Error al actualizar estado' });
    } finally {
      setCambiandoEstado(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const config = {
      COTIZACION: { color: 'bg-gray-100 text-gray-700', icon: ClockIcon },
      APROBADO: { color: 'bg-blue-100 text-blue-700', icon: CheckCircleIcon },
      EN_PRODUCCION: { color: 'bg-yellow-100 text-yellow-700', icon: TruckIcon },
      ENVIADO: { color: 'bg-purple-100 text-purple-700', icon: TruckIcon },
      ENTREGADO: { color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
      CANCELADO: { color: 'bg-red-100 text-red-700', icon: XCircleIcon },
    };
    const { color, icon: Icon } = config[estado] || config.COTIZACION;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        {estado}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (!pedido) return <div className="text-center py-12 text-gray-500">Pedido no encontrado</div>;

  const transicionesPermitidas = {
    COTIZACION: ['APROBADO', 'CANCELADO'],
    APROBADO: ['EN_PRODUCCION', 'CANCELADO'],
    EN_PRODUCCION: ['ENVIADO', 'CANCELADO'],
    ENVIADO: ['ENTREGADO', 'CANCELADO'],
    ENTREGADO: [],
    CANCELADO: [],
  };
  const estadosDisponibles = estados.filter(est =>
    transicionesPermitidas[pedido.nombre_estado]?.includes(est.nombre_estado)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/pedidos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeftIcon className="h-4 w-4" /> Volver
      </button>

      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{pedido.folio}</h1>
            <p className="text-gray-500 mt-1">Cliente: {pedido.cliente_nombre} | Vendedor: {pedido.vendedor_nombre}</p>
          </div>
          <div className="flex items-center gap-3">
            {getEstadoBadge(pedido.nombre_estado)}
            {estadosDisponibles.length > 0 && (
              <button
                onClick={() => setShowEstadoModal(true)}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
              >
                Cambiar Estado
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información de fechas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">Fecha de pedido</p>
          <p className="font-medium">{pedido.fecha_formato}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">Entrega estimada</p>
          <p className={`font-medium ${pedido.dias_restantes < 0 ? 'text-red-600' : ''}`}>
            {pedido.fecha_entrega_estimada_formato}
            {pedido.dias_restantes < 0 && <span className="ml-2 text-xs text-red-500">(atrasado)</span>}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-bold text-xl">${pedido.total?.toFixed(2)}</p>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Productos del Pedido</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Precio Unit.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedido.productos?.map(prod => (
                <tr key={prod.id_detalle_pedido}>
                  <td className="px-4 py-3">{prod.nombre_producto}</td>
                  <td className="px-4 py-3">{prod.cantidad}</td>
                  <td className="px-4 py-3">${prod.precio_unitario?.toFixed(2)}</td>
                  <td className="px-4 py-3">${prod.subtotal_linea?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="px-4 py-3 text-right font-medium">Total:</td>
                <td className="px-4 py-3 font-bold">${pedido.total?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Historial de cambios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Historial de Cambios</h2>
        </div>
        <div className="p-4">
          {pedido.historial?.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No hay registros</p>
          ) : (
            <div className="space-y-4">
              {pedido.historial?.map((h, idx) => (
                <div key={h.id_historial} className="flex gap-4">
                  <div className="w-32 text-sm text-gray-500">{h.fecha_formato}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {h.estado_anterior && (
                        <>
                          <span className="text-gray-600">{h.estado_anterior}</span>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <span className="font-medium text-primary-600">{h.estado_nuevo}</span>
                    </div>
                    {h.observaciones && <p className="text-sm text-gray-500 mt-1">{h.observaciones}</p>}
                    <p className="text-xs text-gray-400 mt-1">por {h.usuario_nombre || 'sistema'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal cambio de estado */}
      <Modal isOpen={showEstadoModal} onClose={() => setShowEstadoModal(false)} title="Cambiar Estado" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nuevo Estado</label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="">Seleccione...</option>
              {estadosDisponibles.map(est => (
                <option key={est.id_estado} value={est.id_estado}>{est.nombre_estado}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea
              rows="2"
              value={observacionesEstado}
              onChange={(e) => setObservacionesEstado(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowEstadoModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
            <button
              onClick={handleCambiarEstado}
              disabled={!nuevoEstado || cambiandoEstado}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg disabled:opacity-50"
            >
              {cambiandoEstado ? <LoadingSpinner size="sm" /> : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PedidoDetalle;