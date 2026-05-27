import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ChartBarIcon, TagIcon, ScaleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatters } from '../../utils/formatters';
import ProductoStockModal from './ProductoStockModal';
import ProductoPreciosModal from './ProductosPreciosModal';
import ProductoImpuestosModal from './ProductoImpuestoModal';


const ProductoCard = ({ 
  producto, 
  onEdit, 
  onToggleStatus, 
  onUpdateWeight, 
  canEdit, 
  onDelete,
  onRegisterBatch 
}) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [showPricesModal, setShowPricesModal] = useState(false);
  const [showTaxesModal, setShowTaxesModal] = useState(false);

  const stockLevel = formatters.stockLevel(producto.stock_actual, producto.stock_minimo);
  const status = formatters.status(producto.activo);

  const handleOpenPesoModal = () => {
    onUpdateWeight(producto); 
  };

  const handleOpenTandaModal = () => {
    if (onRegisterBatch) onRegisterBatch(producto);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 group">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800 text-lg">{producto.nombre_producto}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockLevel.color}`}>
                {stockLevel.text}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{producto.descripcion || 'Sin descripción'}</p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
              <span className="text-gray-500">SKU: <span className="font-mono text-gray-700">{producto.sku}</span></span>
              <span className="text-gray-500">Categoría: <span className="text-gray-700">{producto.nombre_categoria}</span></span>
              <span className="text-gray-500">Unidad: <span className="text-gray-700">{producto.unidad_medida}</span></span>
              <span className="text-gray-500">Peso actual: <span className="text-gray-700">{formatters.weight( producto.peso_kg || producto.peso_actual_kg )}</span></span>
            </div>
            
            <div className="flex items-center gap-6 mt-3">
              <div>
                <span className="text-xs text-gray-400">Stock actual</span>
                <p className="font-bold text-xl">{formatters.number(producto.stock_actual)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Stock mínimo</span>
                <p className="font-semibold">{formatters.number(producto.stock_minimo)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Precio base</span>
                <p className="font-bold text-primary-600">{formatters.currency(producto.precio_base)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Precio público</span>
                <p className="font-bold text-green-600">{formatters.currency(producto.precio_estimado)}</p>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowStockModal(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver stock"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowPricesModal(true)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Precios por cliente"
              >
                <TagIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowTaxesModal(true)}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Impuestos"
              >
                <ChartBarIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleOpenPesoModal} 
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Actualizar peso"
              >
                <ScaleIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit && onEdit(producto)}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onToggleStatus && onToggleStatus(producto.id_producto, !producto.activo)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={producto.activo ? 'Desactivar' : 'Activar'}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ProductoStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        producto={producto}
      />
      <ProductoPreciosModal
        isOpen={showPricesModal}
        onClose={() => setShowPricesModal(false)}
        productoId={producto.id_producto}
        productoNombre={producto.nombre_producto}
      />
      <ProductoImpuestosModal
        isOpen={showTaxesModal}
        onClose={() => setShowTaxesModal(false)}
        productoId={producto.id_producto}
        productoNombre={producto.nombre_producto}
      />
    </>
  );
};

export default ProductoCard;