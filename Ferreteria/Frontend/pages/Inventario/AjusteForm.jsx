import React, { useState, useEffect } from 'react';
import { inventarioService } from '../../api/inventario';
import productoService from '../../api/productosAPI';

const AjusteForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [stockActual, setStockActual] = useState(null);
  const [formData, setFormData] = useState({
    id_producto: '',
    cantidad: '',
    tipo_ajuste: 'DECREMENTO',
    motivo: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (formData.id_producto) {
      const producto = productos.find(p => p.id_producto === parseInt(formData.id_producto));
      setStockActual(producto?.stock_actual || 0);
    } else {
      setStockActual(null);
    }
  }, [formData.id_producto, productos]);

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
    if (!formData.motivo) newErrors.motivo = 'El motivo del ajuste es requerido';
    
    if (formData.tipo_ajuste === 'DECREMENTO' && parseInt(formData.cantidad) > stockActual) {
      newErrors.cantidad = `No puedes disminuir más de ${stockActual} unidades (stock actual)`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await inventarioService.registrarAjuste({
        ...formData,
        cantidad: parseInt(formData.cantidad)
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al registrar ajuste:', error);
      alert(error.response?.data?.message || 'Error al registrar el ajuste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Registrar Ajuste de Inventario</h2>
        
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
                {p.nombre_producto} (Stock: {p.stock_actual})
              </option>
            ))}
          </select>
          {errors.id_producto && (
            <p className="text-xs text-red-500 mt-1">{errors.id_producto}</p>
          )}
        </div>

        {/* Stock actual */}
        {stockActual !== null && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600">
              Stock actual: <span className="font-bold text-gray-800">{stockActual}</span> unidades
            </p>
          </div>
        )}

        {/* Tipo de ajuste y cantidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Ajuste <span className="text-red-500">*</span>
            </label>
            <select
              name="tipo_ajuste"
              value={formData.tipo_ajuste}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="INCREMENTO">📈 Incrementar stock</option>
              <option value="DECREMENTO">📉 Disminuir stock</option>
            </select>
          </div>

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
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo del Ajuste <span className="text-red-500">*</span>
          </label>
          <textarea
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            placeholder="Ej: Producto dañado, diferencias de inventario, etc."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
              errors.motivo ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.motivo && (
            <p className="text-xs text-red-500 mt-1">{errors.motivo}</p>
          )}
        </div>

        {/* Info box dinámica */}
        <div className={`rounded-lg p-4 mt-4 ${
          formData.tipo_ajuste === 'INCREMENTO' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={`text-sm ${
            formData.tipo_ajuste === 'INCREMENTO' ? 'text-green-700' : 'text-yellow-700'
          }`}>
            <strong>Información:</strong> 
            {formData.tipo_ajuste === 'INCREMENTO' 
              ? ' Se aumentará el stock del producto en la cantidad indicada.' 
              : ' Se disminuirá el stock del producto. Asegúrate de que la cantidad no supere el stock actual.'}
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
          className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
            formData.tipo_ajuste === 'INCREMENTO' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Registrando...
            </>
          ) : (
            formData.tipo_ajuste === 'INCREMENTO' ? 'Incrementar Stock' : 'Disminuir Stock'
          )}
        </button>
      </div>
    </form>
  );
};

export default AjusteForm;