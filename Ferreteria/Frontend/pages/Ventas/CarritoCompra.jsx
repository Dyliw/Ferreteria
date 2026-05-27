import React from 'react';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const CarritoCompras = ({ productos, onActualizarCantidad, onEliminarProducto, onActualizarDescuento }) => {
  
  const calcularSubtotalProducto = (producto) => {
    const subtotal = producto.cantidad * producto.precio_unitario;
    const descuento = subtotal * (producto.descuento_linea / 100);
    return subtotal - descuento;
  };

  if (productos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-400">No hay productos agregados</p>
        <p className="text-sm text-gray-400 mt-1">Busca y agrega productos arriba</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Cabecera */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
        <div className="col-span-5">PRODUCTO</div>
        <div className="col-span-2 text-center">CANT</div>
        <div className="col-span-2 text-right">P/U</div>
        <div className="col-span-2 text-right">SUBTOTAL</div>
        <div className="col-span-1 text-center"></div>
      </div>

      {/* Lista de productos */}
      {productos.map((producto, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
          <div className="col-span-5">
            <p className="font-medium text-gray-800 text-sm">{producto.nombre_producto}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-gray-400">Peso: {producto.peso_actual_kg || producto.peso_kg || 'N/A'} kg</span>
              <input
                type="number"
                value={producto.descuento_linea || 0}
                onChange={(e) => onActualizarDescuento(idx, parseFloat(e.target.value) || 0)}
                className="w-16 px-1 py-0.5 text-xs border border-gray-200 rounded"
                placeholder="Desc %"
                step="0.5"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="col-span-2 flex items-center justify-center gap-1">
            <button
              onClick={() => onActualizarCantidad(idx, producto.cantidad - 1)}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              disabled={producto.cantidad <= 1}
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium">{producto.cantidad}</span>
            <button
              onClick={() => onActualizarCantidad(idx, producto.cantidad + 1)}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="col-span-2 text-right">
            <span className="text-gray-600">${producto.precio_unitario.toFixed(2)}</span>
          </div>
          
          <div className="col-span-2 text-right">
            <span className="font-medium text-gray-800">
              ${calcularSubtotalProducto(producto).toFixed(2)}
            </span>
          </div>
          
          <div className="col-span-1 text-center">
            <button
              onClick={() => onEliminarProducto(idx)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}

      {/* Nota sobre el precio */}
      <div className="mt-2 pt-2 text-xs text-gray-400 text-center border-t border-gray-100">
        El precio incluye costo logístico (flete, seguro, descarga) e IVA
      </div>
    </div>
  );
};

export default CarritoCompras;