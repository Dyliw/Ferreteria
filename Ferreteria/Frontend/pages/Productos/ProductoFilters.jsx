import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import productoService from '../../api/productosApi';


const ProductoFilters = ({ filters, onFilterChange, onReset }) => {
  const [categorias, setCategorias] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const response = await productoService.getCategoriesCatalog();
      setCategorias(response.data || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? (checked ? 'true' : '') : value;
    onFilterChange({ [name]: val });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="termino"
            value={filters.termino || ''}
            onChange={handleChange}
            placeholder="Buscar por nombre, SKU o descripción..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <FunnelIcon className="h-5 w-5" />
          Filtros
          {(filters.id_categoria || filters.stock_bajo || filters.sin_stock) && (
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
          )}
        </button>
        
        {(filters.id_categoria || filters.termino || filters.stock_bajo || filters.sin_stock || filters.activo !== 'true') && (
          <button 
            onClick={onReset} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <XMarkIcon className="h-5 w-5" />
            Limpiar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              name="id_categoria"
              value={filters.id_categoria || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria} ({cat.total_productos || 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="activo"
              value={filters.activo || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
              <option value="">Todos</option>
            </select>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="stock_bajo"
                checked={filters.stock_bajo === 'true'}
                onChange={(e) => onFilterChange({ stock_bajo: e.target.checked ? 'true' : '', sin_stock: '' })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Stock bajo</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sin_stock"
                checked={filters.sin_stock === 'true'}
                onChange={(e) => onFilterChange({ sin_stock: e.target.checked ? 'true' : '', stock_bajo: '' })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Sin stock</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductoFilters;