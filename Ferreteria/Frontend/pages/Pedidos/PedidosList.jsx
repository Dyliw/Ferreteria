import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Pagination from '../../components/Common/Pagination';
import Toast from '../../components/Common/Toast';
import pedidoService from '../../api/pedidoAPI';

const PedidosList = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pagina: 1, total_paginas: 1, total: 0 });
  const [filters, setFilters] = useState({
    pagina: 1,
    limite: 10,
    folio: '',
    id_cliente: '',
    estado_nombre: '',
    atrasados: false,
  });
  const [estados, setEstados] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarEstados();
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [filters]);

  const cargarEstados = async () => {
    try {
      const res = await pedidoService.obtenerEstados();
      setEstados(res.data.data || []);
    } catch (error) {
      console.error('Error cargando estados', error);
    }
  };

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const res = await pedidoService.listar(filters);
      setPedidos(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (error) {
      setToast({ type: 'error', message: 'Error al cargar pedidos' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      pagina: 1, // resetear página al filtrar
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, pagina: page }));
  };

  const getEstadoColor = (estado) => {
    const colors = {
      COTIZACION: 'bg-gray-100 text-gray-700',
      APROBADO: 'bg-blue-100 text-blue-700',
      EN_PRODUCCION: 'bg-yellow-100 text-yellow-700',
      ENVIADO: 'bg-purple-100 text-purple-700',
      ENTREGADO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-700',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <Link
          to="/pedidos/nuevo"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Pedido
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Folio</label>
            <input
              type="text"
              name="folio"
              value={filters.folio}
              onChange={handleFilterChange}
              placeholder="Buscar por folio"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm text-gray-600 mb-1">Estado</label>
            <select
              name="estado_nombre"
              value={filters.estado_nombre}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              {estados.map(est => (
                <option key={est.id_estado} value={est.nombre_estado}>{est.nombre_estado}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                name="atrasados"
                checked={filters.atrasados}
                onChange={handleFilterChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Solo atrasados
            </label>
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, folio: '', estado_nombre: '', atrasados: false, pagina: 1 }))}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrega Estimada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidos.map(pedido => (
                    <tr key={pedido.id_pedido} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{pedido.folio}</td>
                      <td className="px-6 py-4 text-gray-600">{pedido.cliente_nombre}</td>
                      <td className="px-6 py-4 text-gray-600">{pedido.fecha_formato}</td>
                      <td className="px-6 py-4">
                        <span className={`${pedido.dias_restantes < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {pedido.fecha_entrega_estimada_formato}
                          {pedido.dias_restantes < 0 && <span className="ml-1 text-xs">(atrasado)</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.nombre_estado)}`}>
                          {pedido.nombre_estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">${pedido.total?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/pedidos/${pedido.id_pedido}`}
                          className="text-primary-600 hover:text-primary-800 transition"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            currentPage={pagination.pagina}
            totalPages={pagination.total_paginas}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PedidosList;