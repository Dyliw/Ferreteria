import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import ventaService from '../../api/ventasAPI';

const BuscadorProducto = ({ onAgregarProducto }) => {
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const buscadorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setMostrarResultados(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const buscar = async () => {
      if (termino.length < 2) {
        setResultados([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await ventaService.buscarProductos(termino);
        setResultados(response.data);
        setMostrarResultados(true);
      } catch (error) {
        console.error('Error buscando productos:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [termino]);

  const handleAgregar = (producto) => {
    onAgregarProducto({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      precio_unitario: producto.precio_estimado || producto.precio_base,
      stock: producto.stock_actual,
      cantidad: 1,
      descuento_linea: 0
    });
    setTermino('');
    setMostrarResultados(false);
  };

  return (
    <div ref={buscadorRef} className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          onFocus={() => termino.length >= 2 && setMostrarResultados(true)}
          placeholder="Buscar producto por nombre o SKU..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {mostrarResultados && (termino.length >= 2) && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          ) : resultados.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No se encontraron productos</div>
          ) : (
            resultados.map((producto) => (
              <div
                key={producto.id_producto}
                onClick={() => handleAgregar(producto)}
                className="flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{producto.nombre_producto}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                    <span>SKU: {producto.sku}</span>
                    <span>Stock: {producto.stock_actual}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">${producto.precio_estimado?.toFixed(2)}</p>
                  <button className="mt-1 text-primary-500 hover:text-primary-700">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorProducto;