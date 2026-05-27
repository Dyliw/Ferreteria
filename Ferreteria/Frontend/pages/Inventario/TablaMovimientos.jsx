import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

const TablaMovimientos = ({ movimientos, onVerDetalle }) => {
  if (movimientos.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500">No hay movimientos registrados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock Final</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movimientos.map((mov) => (
              <tr key={mov.id_movimiento} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">{mov.fecha_formato}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{mov.nombre_producto}</p>
                  <p className="text-xs text-gray-400">{mov.sku}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    mov.tipo_movimiento === 'ENTRADA' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {mov.nombre_movimiento}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${
                    mov.tipo_movimiento === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}{mov.cantidad.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-700">{mov.stock_despues}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{mov.usuario_nombre || 'Sistema'}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onVerDetalle(mov.id_movimiento)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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

export default TablaMovimientos;