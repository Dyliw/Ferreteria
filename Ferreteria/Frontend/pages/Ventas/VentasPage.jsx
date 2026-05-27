
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ventaService from '../../api/ventasAPI';
import clienteService from '../../api/clientesAPI';
import BuscadorProducto from './BuscarVenta';
import CarritoCompras from './CarritoCompra';
import MetodoPagoSelector from './MetodoPago';
import Toast from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import useVentas from '../../hooks/useVentas';
import Pagination from '../../components/common/Pagination';


const VentasPage = () => {
  const navigate = useNavigate();
  const { ventas, loading, pagination, filters, actualizarFiltros, limpiarFiltros, cambiarPagina } = useVentas();
  const [toast, setToast] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString();
  };

  const handleVerDetalle = (id) => {
    navigate(`/ventas/${id}`);
  };

  const handleDescargarTicket = async (venta) => {
    try {
      const pdfBlob = await ventaService.generarTicketPDF(venta.id_venta);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${venta.folio}.pdf`;
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
      await ventaService.cancelar(selectedVenta.id_venta, motivoCancelacion);
      setToast({ message: 'Venta cancelada exitosamente', type: 'success' });
      setCancelModalOpen(false);
      setSelectedVenta(null);
      setMotivoCancelacion('');
      cambiarPagina(1); // Recargar
    } catch (error) {
      setToast({ message: 'Error al cancelar venta', type: 'error' });
    }
  };

  const getBadgeColor = (cancelada) => {
    return cancelada 
      ? 'bg-red-100 text-red-700' 
      : 'bg-green-100 text-green-700';
  };

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de ventas realizadas</p>
        </div>
        <button
          onClick={() => navigate('/ventas/nueva')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-600 block mb-1">Fecha desde</label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => actualizarFiltros({ fecha_desde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-600 block mb-1">Fecha hasta</label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => actualizarFiltros({ fecha_hasta: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="w-40">
            <label className="text-sm text-gray-600 block mb-1">Estado</label>
            <select
              value={filters.cancelada}
              onChange={(e) => actualizarFiltros({ cancelada: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="false">Activas</option>
              <option value="true">Canceladas</option>
              <option value="">Todas</option>
            </select>
          </div>
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : ventas.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            No hay ventas registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventas.map((venta) => (
                  <tr key={venta.id_venta} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{venta.folio}</td>
                    <td className="px-6 py-4 text-gray-600">{venta.cliente_nombre}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatearFecha(venta.fecha_venta)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      ${venta.total?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(venta.cancelada)}`}>
                        {venta.cancelada ? 'Cancelada' : 'Activa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalle(venta.id_venta)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDescargarTicket(venta)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Descargar ticket"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.total_paginas > 1 && (
        <Pagination
          currentPage={pagination.pagina}
          totalPages={pagination.total_paginas}
          onPageChange={cambiarPagina}
        />
      )}

      {/* Modal de cancelación */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancelar Venta"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de cancelar la venta <strong>{selectedVenta?.folio}</strong>?
          </p>
          <textarea
            placeholder="Motivo de cancelación"
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

export default VentasPage;