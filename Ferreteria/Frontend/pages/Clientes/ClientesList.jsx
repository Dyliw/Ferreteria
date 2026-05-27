import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronUpDownIcon,
  FunnelIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import clienteService from '../../api/clientesAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Pagination from '../../components/Common/Pagination';
import toast from 'react-hot-toast';

const ClientesList = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [tipos, setTipos] = useState([]);
  const [pagination, setPagination] = useState({ pagina: 1, total_paginas: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const params = { 
        pagina: pagination.pagina,
        limite: 10
      };
      if (searchTerm) params.termino = searchTerm;
      if (filtroTipo) params.id_tipo_cliente = filtroTipo;
      if (filtroActivo !== '') params.activo = filtroActivo;
      
      const response = await clienteService.listar(params);
      setClientes(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    clienteService.obtenerTipos().then(res => setTipos(res.data));
  }, [pagination.pagina, searchTerm, filtroTipo, filtroActivo]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, pagina: 1 }));
  };

  const handleCambiarEstado = async (id, activo) => {
    if (confirm(`¿${activo ? 'desactivar' : 'activar'} este cliente?`)) {
      try {
        await clienteService.cambiarEstado(id, !activo);
        toast.success(`Cliente ${!activo ? 'activado' : 'desactivado'}`);
        cargarClientes();
      } catch (error) {
        toast.error('Error al cambiar estado');
      }
    }
  };

  const getTipoBadge = (nombreTipo) => {
    const badges = {
      'PÚBLICO': 'bg-gray-100 text-gray-700',
      'HERRERO': 'bg-orange-100 text-orange-700',
      'MAYOREO': 'bg-blue-100 text-blue-700'
    };
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';
    for (const [key, value] of Object.entries(badges)) {
      if (nombreTipo?.includes(key)) return `${baseClass} ${value}`;
    }
    return `${baseClass} bg-gray-100 text-gray-700`;
  };

  if (loading && clientes.length === 0) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Clientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total} clientes registrados en total
          </p>
        </div>
        <Link to="/clientes/nuevo" className="btn-primary flex items-center gap-2">
          <UserPlusIcon className="h-5 w-5" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary px-6">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
            </button>
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 animate-fade-in">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="input-field w-48"
              >
                <option value="">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo.id_tipo_cliente} value={tipo.id_tipo_cliente}>
                    {tipo.nombre_tipo}
                  </option>
                ))}
              </select>
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
                className="input-field w-40"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
              {(filtroTipo || filtroActivo) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroTipo('');
                    setFiltroActivo('');
                    setPagination(prev => ({ ...prev, pagina: 1 }));
                  }}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Compras</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id_cliente} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {cliente.nombre?.charAt(0)}{cliente.apellido_paterno?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{cliente.nombre_completo}</p>
                        <p className="text-xs text-gray-400">ID: {cliente.id_cliente}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{cliente.telefono || '—'}</p>
                    <p className="text-xs text-gray-400">{cliente.email || '—'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={getTipoBadge(cliente.nombre_tipo)}>
                      {cliente.nombre_tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-700">${cliente.total_compras?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">{cliente.ultima_compra_formato || 'Sin compras'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      cliente.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cliente.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/clientes/${cliente.id_cliente}`}
                        className="p-1.5 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/clientes/${cliente.id_cliente}/editar`}
                        className="p-1.5 text-gray-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleCambiarEstado(cliente.id_cliente, cliente.activo)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title={cliente.activo ? 'Desactivar' : 'Activar'}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {clientes.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_paginas > 1 && (
        <Pagination
          currentPage={pagination.pagina}
          totalPages={pagination.total_paginas}
          onPageChange={(page) => setPagination(prev => ({ ...prev, pagina: page }))}
        />
      )}
    </div>
  );
};

export default ClientesList;