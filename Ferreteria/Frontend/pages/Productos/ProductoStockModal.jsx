import React, { useState } from 'react';
import Modal from '../../components/Common/Modal';
import { formatters } from '../../utils/formatters';
import productoService from '../../api/productosAPI';
import toast from 'react-hot-toast';

const ProductoStockModal = ({ isOpen, onClose, producto }) => {
  const [updating, setUpdating] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [lote, setLote] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!producto) return null;

  const handleUpdateWeight = async () => {
    if (!nuevoPeso || nuevoPeso <= 0) {
      toast.error('Ingrese un peso válido');
      return;
    }

    setUpdating(true);
    try {
      await productoService.updateWeight(producto.id_producto, {
        nuevo_peso_kg: parseFloat(nuevoPeso),
        lote,
        proveedor,
        observaciones,
      });
      toast.success('Peso actualizado exitosamente');
      setNuevoPeso('');
      setLote('');
      setProveedor('');
      setObservaciones('');
      onClose();
    } catch (error) {
      toast.error('Error al actualizar peso');
    } finally {
      setUpdating(false);
    }
  };

  const stockLevel = formatters.stockLevel(producto.stock_actual, producto.stock_minimo);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stock - ${producto.nombre_producto}`} size="md">
      <div className="space-y-4">
        {/* Información actual */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Información actual</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Stock actual:</span>
              <p className="font-semibold text-lg">{formatters.number(producto.stock_actual)}</p>
            </div>
            <div>
              <span className="text-gray-500">Stock mínimo:</span>
              <p className="font-semibold">{formatters.number(producto.stock_minimo)}</p>
            </div>
            <div>
              <span className="text-gray-500">Nivel:</span>
              <p><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stockLevel.color}`}>{stockLevel.text}</span></p>
            </div>
            <div>
              <span className="text-gray-500">Peso actual:</span>
              <p className="font-semibold">{formatters.weight(producto.peso_actual_kg)}</p>
            </div>
            {producto.peso_anterior_kg && (
              <div className="col-span-2">
                <span className="text-gray-500">Peso anterior:</span>
                <p className="text-sm">{formatters.weight(producto.peso_anterior_kg)} (cambio el {new Date(producto.fecha_ultimo_peso).toLocaleDateString()})</p>
              </div>
            )}
          </div>
        </div>

        {/* Actualizar peso (nueva tanda) */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Registrar nueva tanda</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo peso (kg) *</label>
              <input
                type="number"
                value={nuevoPeso}
                onChange={(e) => setNuevoPeso(e.target.value)}
                step="0.01"
                min="0"
                className="input-field"
                placeholder="Ej: 2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de lote</label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="input-field"
                placeholder="LOTE-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="input-field"
                placeholder="Nombre del proveedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows="2"
                className="input-field"
                placeholder="Notas sobre esta tanda..."
              />
            </div>
          </div>
          <button
            onClick={handleUpdateWeight}
            disabled={updating || !nuevoPeso}
            className="btn-primary w-full mt-4"
          >
            {updating ? 'Actualizando...' : 'Actualizar peso y registrar tanda'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductoStockModal;