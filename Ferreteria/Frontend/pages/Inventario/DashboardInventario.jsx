import React, { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  ExclamationTriangleIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArchiveBoxIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { inventarioService } from '../../api/inventario';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TarjetaResumen from '../../pages/Inventario/TarjetaResumen';

const DashboardInventario = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    setLoading(true);
    try {
      const response = await inventarioService.dashboard();
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;
  if (!dashboard) return null;

  const stats = dashboard.estadisticas;

  const tarjetas = [
    {
      titulo: 'Total Productos',
      valor: stats.total_productos,
      icono: CubeIcon,
      color: 'blue',
      subtitulo: 'activos en catálogo'
    },
    {
      titulo: 'Productos Agotados',
      valor: stats.productos_agotados,
      icono: ExclamationTriangleIcon,
      color: 'red',
      subtitulo: 'stock = 0'
    },
    {
      titulo: 'Stock Bajo',
      valor: stats.productos_stock_bajo,
      icono: ClockIcon,
      color: 'yellow',
      subtitulo: 'por debajo del mínimo'
    },
    {
      titulo: 'Valor Inventario',
      valor: `$${stats.valor_inventario?.toLocaleString() || 0}`,
      icono: CurrencyDollarIcon,
      color: 'green',
      subtitulo: 'en productos'
    },
    {
      titulo: 'Total Unidades',
      valor: stats.total_unidades?.toLocaleString() || 0,
      icono: ArchiveBoxIcon,
      color: 'purple',
      subtitulo: 'en existencia'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {tarjetas.map((tarjeta, index) => (
          <TarjetaResumen key={index} {...tarjeta} />
        ))}
      </div>

      {/* Movimientos por tipo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Movimientos por Tipo (Últimos 30 días)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Movimientos</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Entradas</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Salidas</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Total Unidades</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.movimientos_por_tipo?.map((mov, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-700">{mov.nombre_movimiento}</td>
                  <td className="py-3 text-sm text-right text-gray-600">{mov.total_movimientos}</td>
                  <td className="py-3 text-sm text-right text-green-600">{mov.entradas?.toLocaleString() || 0}</td>
                  <td className="py-3 text-sm text-right text-red-600">{mov.salidas?.toLocaleString() || 0}</td>
                  <td className="py-3 text-sm text-right font-medium text-gray-700">{mov.total_unidades?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Últimos Movimientos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-sm font-medium text-gray-500">Fecha</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Producto</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Cantidad</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Stock Final</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.ultimos_movimientos?.slice(0, 10).map((mov) => (
                <tr key={mov.id_movimiento} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 text-sm text-gray-600">{mov.fecha_formato}</td>
                  <td className="py-3 text-sm font-medium text-gray-800">{mov.nombre_producto}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      mov.tipo_movimiento === 'ENTRADA' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {mov.nombre_movimiento}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-right font-medium text-gray-700">
                    {mov.cantidad.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-right text-gray-600">{mov.stock_despues}</td>
                  <td className="py-3 text-sm text-gray-500">{mov.usuario_nombre || 'Sistema'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top productos más movidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Productos más Movidos (Últimos 90 días)</h2>
        <div className="space-y-3">
          {dashboard.top_productos?.map((producto, index) => (
            <div key={producto.id_producto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                <div>
                  <p className="font-medium text-gray-800">{producto.nombre_producto}</p>
                  <p className="text-xs text-gray-400">{producto.total_movimientos} movimientos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{producto.total_unidades_movidas.toLocaleString()}</p>
                <p className="text-xs text-gray-400">unidades movidas</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardInventario;