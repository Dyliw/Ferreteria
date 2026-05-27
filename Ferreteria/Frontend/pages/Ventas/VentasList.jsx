import React from 'react';
import { EyeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const ListaVentas = ({ ventas, onVerDetalle }) => {
  const getEstadoBadge = (cancelada) => {
    if (cancelada) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelada</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completada</span>;
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(monto);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (ventas.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-500">No hay ventas registradas</p>
        <p className="text-gray-400 text-sm mt-1">Realiza una nueva venta para comenzar</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Folio</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Productos</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ventas.map((venta) => (
              <tr key={venta.id_venta} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono text-sm font-medium text-gray-800">{venta.folio}</span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-800">{venta.cliente_nombre}</p>
                    <p className="text-xs text-gray-400">Tipo: {venta.cliente_tipo || 'No especificado'}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-600">{formatFecha(venta.fecha_venta)}</p>
                </td>
                <td className="py-3 px-4 text-right">
                  <p className="text-sm text-gray-600">{venta.total_productos || 0} artículos</p>
                  <p className="text-xs text-gray-400">{venta.total_piezas || 0} piezas</p>
                </td>
                <td className="py-3 px-4 text-right">
                  <p className="font-semibold text-gray-800">{formatMonto(venta.total)}</p>
                  <p className="text-xs text-gray-400">IVA: {formatMonto(venta.iva)}</p>
                </td>
                <td className="py-3 px-4 text-center">
                  {getEstadoBadge(venta.cancelada)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onVerDetalle(venta)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    title="Ver detalle"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaVentas;