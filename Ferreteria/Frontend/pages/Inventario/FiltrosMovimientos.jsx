import React from 'react';


const FiltrosMovimientos = ({ filtros, onChange, productos }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleReset = () => {
    onChange({
      fecha_desde: '',
      fecha_hasta: '',
      tipo: '',
      id_producto: ''
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800">Filtros</h3>
        <button
          onClick={handleReset}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Limpiar filtros
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fecha Desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Desde
          </label>
          <input
            type="date"
            name="fecha_desde"
            value={filtros.fecha_desde || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Hasta
          </label>
          <input
            type="date"
            name="fecha_hasta"
            value={filtros.fecha_hasta || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Tipo de Movimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            name="tipo"
            value={filtros.tipo || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </select>
        </div>

        {/* Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto
          </label>
          <select
            name="id_producto"
            value={filtros.id_producto || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los productos</option>
            {(productos || []).map(p => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre_producto}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltrosMovimientos;