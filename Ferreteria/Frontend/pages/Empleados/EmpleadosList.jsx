import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import empleadoService from '../../api/empleadosAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const EmpleadosList = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPuesto, setFiltroPuesto] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [puestos, setPuestos] = useState([]);
  const [pagination, setPagination] = useState({ pagina: 1, total_paginas: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // En EmpleadosList.jsx, cuando recibes los datos:
// En EmpleadosList.jsx
const cargarEmpleados = async () => {
  setLoading(true);
  try {
    const params = { 
      pagina: pagination.pagina,
      limite: 10
    };
    if (searchTerm) params.termino = searchTerm;
    if (filtroPuesto) params.id_puesto = filtroPuesto;
    if (filtroActivo !== '') params.activo = filtroActivo;
    
    const response = await empleadoService.listar(params);
  
    
    const empleadosValidos = (response.data || []).filter(emp => {
  
      if (!emp || typeof emp !== 'object') return false;
      
      if (emp.id_empleado) return true;
      
      if (emp.id) return true;
      
      return false;
    });
    
    console.log('Empleados válidos después de filtrar:', empleadosValidos);
    
    setEmpleados(empleadosValidos);
    setPagination(response.pagination || { pagina: 1, total_paginas: 1, total: 0 });
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    toast.error('Error al cargar empleados');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
  cargarEmpleados();
  empleadoService.obtenerPuestos().then(res => {
    const puestosValidos = (res.data || []).filter(p => p && p.id_puesto);
    setPuestos(puestosValidos);
  });
}, [pagination.pagina, searchTerm, filtroPuesto, filtroActivo]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, pagina: 1 }));
  };

  const handleCambiarEstado = async (id, activo) => {
    if (confirm(`¿${activo ? 'desactivar' : 'activar'} a este empleado?`)) {
      try {
        await empleadoService.cambiarEstado(id, !activo);
        toast.success(`Empleado ${!activo ? 'activado' : 'desactivado'}`);
        cargarEmpleados();
      } catch (error) {
        toast.error('Error al cambiar estado');
      }
    }
  };

  const getAntiguedadBadge = (anios) => {
    if (anios >= 5) return 'bg-green-100 text-green-700';
    if (anios >= 2) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading && empleados.length === 0) return <LoadingSpinner fullScreen />;
  
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Empleados
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total} empleados en el sistema
          </p>
        </div>
        <Link to="/empleados/nuevo" className="btn-primary flex items-center gap-2">
          <UserPlusIcon className="h-5 w-5" />
          Nuevo Empleado
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
                  placeholder="Buscar por nombre, email o número de empleado..."
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
                value={filtroPuesto}
                onChange={(e) => setFiltroPuesto(e.target.value)}
                className="input-field w-48"
              >
                <option value="">Todos los puestos</option>
                {puestos.map(puesto => (
                  <option key={puesto.id_puesto} value={puesto.id_puesto}>
                    {puesto.nombre_puesto}
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
              {(filtroPuesto || filtroActivo) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroPuesto('');
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">{pagination.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {empleados.filter(e => e.activo).length}
          </p>
          <p className="text-xs text-gray-500">Activos</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {empleados.filter(e => e.username).length}
          </p>
          <p className="text-xs text-gray-500">Con Usuario</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {Math.round(empleados.reduce((acc, e) => acc + (e.antiguedad_anios || 0), 0) / (empleados.length || 1))}
          </p>
          <p className="text-xs text-gray-500">Prom. Antigüedad</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Antigüedad</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empleados.map((empleado) => (
                <tr key={empleado.id_empleado} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {empleado.nombre?.charAt(0)}{empleado.apellido_paterno?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{empleado.nombre_completo}</p>
                        <p className="text-xs text-gray-400">{empleado.numero_empleado}</p>
                      </div>
                    </div>
                   </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{empleado.nombre_puesto}</span>
                    </div>
                    {empleado.salario && (
                      <p className="text-xs text-gray-400 mt-1">${empleado.salario?.toLocaleString()}</p>
                    )}
                   </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{empleado.telefono || '—'}</p>
                    <p className="text-xs text-gray-400">{empleado.email || '—'}</p>
                   </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getAntiguedadBadge(empleado.antiguedad_anios)}`}>
                      <CalendarIcon className="h-3 w-3" />
                      {empleado.antiguedad_anios || 0} años
                    </span>
                   </td>
                  <td className="py-3 px-4">
                    {empleado.username ? (
                      <div className="flex items-center gap-1">
                        <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">{empleado.username}</span>
                        <span className="text-xs text-gray-400 ml-1">({empleado.nombre_rol})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Sin usuario</span>
                    )}
                   </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      empleado.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${empleado.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                   </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/empleados/${empleado.id_empleado}`}
                        className="p-1.5 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/empleados/${empleado.id_empleado}/editar`}
                        className="p-1.5 text-gray-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleCambiarEstado(empleado.id_empleado, empleado.activo)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title={empleado.activo ? 'Desactivar' : 'Activar'}
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
        
        {empleados.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No se encontraron empleados</p>
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

export default EmpleadosList;