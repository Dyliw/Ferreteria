import React from 'react';
import { ShoppingBagIcon, CurrencyDollarIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const ResumenVentas = ({ estadisticas }) => {
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const cards = [
    {
      titulo: 'Ventas Totales',
      valor: estadisticas.total_ventas || 0,
      subtitulo: 'ventas registradas',
      icono: ShoppingBagIcon,
      color: 'bg-blue-300'
    },
    {
      titulo: 'Ingresos Totales',
      valor: formatMonto(estadisticas.total_ingresos || 0),
      subtitulo: 'monto acumulado',
      icono: CurrencyDollarIcon,
      color: 'bg-green-300'
    },
    {
      titulo: 'Ventas Hoy',
      valor: estadisticas.ventas_hoy || 0,
      subtitulo: `($${formatMonto(estadisticas.ingresos_hoy || 0)})`,
      icono: ChartBarIcon,
      color: 'bg-orange-300'
    },
    {
      titulo: 'Clientes Activos',
      valor: estadisticas.clientes_activos || 0,
      subtitulo: 'han comprado',
      icono: UsersIcon,
      color: 'bg-purple-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="card p-4 flex items-center gap-4">
          <div className={`${card.color} rounded-xl p-3 text-white`}>
            <card.icono className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{card.titulo}</p>
            <p className="text-2xl font-bold text-gray-800">{card.valor}</p>
            <p className="text-xs text-gray-400">{card.subtitulo}</p>
          </div>
        </div>
      ))}
      
      {estadisticas.producto_mas_vendido && (
        <div className="card p-4 col-span-1 sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-600 uppercase tracking-wider">🏆 Producto más vendido</p>
              <p className="text-lg font-semibold text-gray-800">{estadisticas.producto_mas_vendido}</p>
            </div>
            {estadisticas.empleado_del_mes && (
              <div className="text-right">
                <p className="text-xs text-primary-600 uppercase tracking-wider">⭐ Empleado del mes</p>
                <p className="text-lg font-semibold text-gray-800">{estadisticas.empleado_del_mes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenVentas;