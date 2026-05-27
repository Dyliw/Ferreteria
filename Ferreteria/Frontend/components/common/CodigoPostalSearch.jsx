import React, { useState } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clienteService from '../../api/clientesAPI';
import toast from 'react-hot-toast';

const CodigoPostalSearch = ({ onSelect, initialValue = '', className = '' }) => {
  const [cp, setCp] = useState(initialValue);
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [asentamientoSeleccionado, setAsentamientoSeleccionado] = useState(null);

const handleBuscar = async () => {
  if (!cp || cp.length !== 5) {
    toast.error('Ingresa un código postal válido de 5 dígitos');
    return;
  }

  setBuscando(true);
  try {
    const response = await clienteService.buscarPorCP(cp);

    if (response.success && response.data) {
      const dataCP = response.data;
      const asentamientos = dataCP.asentamientos || [];

      setResultados({
        ...dataCP,
        asentamientos
      });
      setShowResults(true);

      if (asentamientos.length === 1) {
        handleSelectAsentamiento(asentamientos[0], dataCP);
      }
    } else {
      toast.error(response.message || 'Código postal no encontrado');
      setResultados(null);
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al buscar código postal');
    setResultados(null);
  } finally {
    setBuscando(false);
  }
};

const handleSelectAsentamiento = (asentamiento) => {
  setAsentamientoSeleccionado(asentamiento);
  setShowResults(false);

  if (onSelect && resultados) {
    onSelect({
      id_codigo_postal: resultados.id_codigo_postal ?? resultados.idcp,
      cp: resultados.cp,
      id_estado: resultados.id_estado,
      estado: resultados.estado,
      id_municipio: resultados.id_municipio,
      municipio: resultados.municipio,
      id_asentamiento: asentamiento.id_asentamiento,
      asentamiento: asentamiento.asentamiento,
      id_tipo_asentamiento: asentamiento.id_tipo_asentamiento,
      tipo_asentamiento: asentamiento.tipo_asentamiento,
      id_ciudad: asentamiento.id_ciudad,
      ciudad: asentamiento.ciudad
    });
  }
};
 const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      console.log('Tecla Enter presionada');
    }
  };
  const handleLimpiar = () => {
  setCp('');
  setResultados(null);
  setAsentamientoSeleccionado(null);
  setShowResults(false);

  if (onSelect) {
    onSelect(null);
  }
};
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Código Postal
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={cp}
            onChange={(e) => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyPress={handleKeyPress}
            className="input-field pl-9"
            placeholder="Código postal (5 dígitos)"
            maxLength="5"
          />
        </div>
        <button
          type="button"
          onClick={handleBuscar}
          disabled={buscando}
          className="btn-secondary px-4 whitespace-nowrap flex items-center gap-1"
        >
          {buscando ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <MagnifyingGlassIcon className="h-4 w-4" />
          )}
          Buscar
        </button>
      </div>

      {/* Resultados desplegables */}
      {showResults && resultados && resultados.asentamientos && resultados.asentamientos.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
          {/* Información de ubicación */}
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="font-medium text-gray-700">CP: {resultados.cp}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">{resultados.municipio || 'Municipio no disponible'}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">{resultados.estado || 'Estado no disponible'}</span>
            </div>
          </div>
          
          {/* Lista de asentamientos */}
          <div className="max-h-60 overflow-y-auto">
            {resultados.asentamientos.map((asentamiento, index) => (
              <button
                key={asentamiento.id_asentamiento || index}
                type="button"
                onClick={() => handleSelectAsentamiento(asentamiento)}
                className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-primary-700">
                    {asentamiento.asentamiento}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {asentamiento.tipo_asentamiento && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {asentamiento.tipo_asentamiento}
                      </span>
                    )}
                    {asentamiento.ciudad && (
                      <span className="text-xs text-gray-400">
                        {asentamiento.ciudad}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Seleccionar →
                </div>
              </button>
            ))}
          </div>
          
          {/* Botón para cerrar */}
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => setShowResults(false)}
              className="text-xs text-gray-400 hover:text-gray-600 w-full text-center"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {showResults && resultados && (!resultados.asentamientos || resultados.asentamientos.length === 0) && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 text-center">
            <MapPinIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No se encontraron asentamientos</p>
            <p className="text-gray-400 text-xs mt-1">Código postal {resultados.cp} no tiene colonias registradas</p>
          </div>
        </div>
      )}

      {/* Resumen de selección */}
      {asentamientoSeleccionado && !showResults && (
        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 text-sm animate-fade-in">
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800">
                {asentamientoSeleccionado.asentamiento}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {resultados?.municipio}, {resultados?.estado} • CP: {resultados?.cp}
              </p>
              {asentamientoSeleccionado.tipo_asentamiento && (
                <p className="text-xs text-green-500 mt-1">
                  {asentamientoSeleccionado.tipo_asentamiento}
                  {asentamientoSeleccionado.ciudad && ` • ${asentamientoSeleccionado.ciudad}`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLimpiar}
              className="text-xs text-green-600 hover:text-green-800"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodigoPostalSearch;