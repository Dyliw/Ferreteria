import React, { useState, useEffect } from 'react';
import { inventarioService } from '../../api/inventario';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import productoService from '../../api/productosAPI';

const EntradaForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState({
    id_producto: '',
    cantidad: '',
    lote: '',
    proveedor: '',
    factura: '',
    observaciones: '',
    costo_unitario: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await productoService.getAll({ limite: 500 });
      const productosData = response.data || response;
      setProductos(Array.isArray(productosData) ? productosData : (productosData.data || []));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProductos([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.id_producto) newErrors.id_producto = 'Selecciona un producto';
    if (!formData.cantidad || formData.cantidad <= 0) newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await inventarioService.registrarEntrada({
        ...formData,
        cantidad: parseInt(formData.cantidad),
        costo_unitario: formData.costo_unitario ? parseFloat(formData.costo_unitario) : null
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      alert(error.response?.data?.message || 'Error al registrar la entrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Registrar Entrada de Mercancía</h2>
        
        {/* Select de Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto <span className="text-red-500">*</span>
          </label>
          <select
            name="id_producto"
            value={formData.id_producto}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.id_producto ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona un producto</option>
            {productos.map(p => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre_producto} (Stock actual: {p.stock_actual})
              </option>
            ))}
          </select>
          {errors.id_producto && (
            <p className="text-xs text-red-500 mt-1">{errors.id_producto}</p>
          )}
        </div>

        {/* Cantidad y Costo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.cantidad ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cantidad && (
              <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo Unitario (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              name="costo_unitario"
              value={formData.costo_unitario}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lote y Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote / Lote
            </label>
            <input
              type="text"
              name="lote"
              value={formData.lote}
              onChange={handleChange}
              placeholder="Ej: LOTE-2024-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
              placeholder="Nombre del proveedor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Factura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Factura / Documento
          </label>
          <input
            type="text"
            name="factura"
            value={formData.factura}
            onChange={handleChange}
            placeholder="Número de factura o remisión"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Notas adicionales sobre la entrada"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-700">
            <strong>Información:</strong> Al registrar una entrada, se aumentará automáticamente el stock del producto 
            y se generará un movimiento de tipo "COMPRA" en el historial.
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Registrando...
            </>
          ) : (
            'Registrar Entrada'
          )}
        </button>
      </div>
    </form>
  );
};

export default EntradaForm;