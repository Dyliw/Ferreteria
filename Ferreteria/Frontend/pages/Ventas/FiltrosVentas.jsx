import React, { useState } from 'react';
import { MagnifyingGlassIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FiltrosVentas = ({ filtros, onFiltrosChange, onRefresh }) => {
  const [termino, setTermino] = useState(filtros.termino || '');
  const [fechaDesde, setFechaDesde] = useState(filtros.fecha_desde || '');
  const [fechaHasta, setFechaHasta] = useState(filtros.fecha_hasta || '');
  const [estado, setEstado] = useState(filtros.cancelada || '');
  const [showFiltros, setShowFiltros] = useState(false);

const aplicarFiltros = () => {
  onFiltrosChange({
    termino,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    cancelada: estado === '' ? undefined : (estado === 'activas' ? false : true)
  });
};

  const limpiarFiltros = () => {
    setTermino('');
    setFechaDesde('');
    setFechaHasta('');
    setEstado('');
    onFiltrosChange({});
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') aplicarFiltros();
  };

  return (
    <div className="card p-4 space-y-3">
      {/* Búsqueda rápida */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={aplicarFiltros}
          className="btn-primary px-4"
        >
          Buscar
        </button>
        <button
          onClick={() => setShowFiltros(!showFiltros)}
          className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filtros avanzados */}
      {showFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="input-field"
            >
              <option value="">Todos</option>
              <option value="activas">Activas</option>
              <option value="canceladas">Canceladas</option>
            </select>
          </div>
        </div>
      )}

      {/* Filtros activos */}
      {(termino || fechaDesde || fechaHasta || estado) && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-gray-500">Filtros activos:</span>
          {termino && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-full">
              Búsqueda: {termino}
              <button onClick={() => setTermino('')}>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {fechaDesde && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-full">
              Desde: {fechaDesde}
              <button onClick={() => setFechaDesde('')}>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {fechaHasta && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-full">
              Hasta: {fechaHasta}
              <button onClick={() => setFechaHasta('')}>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {estado && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-full">
              {estado === 'activas' ? 'Activas' : 'Canceladas'}
              <button onClick={() => setEstado('')}>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={limpiarFiltros}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
};

export default FiltrosVentas;