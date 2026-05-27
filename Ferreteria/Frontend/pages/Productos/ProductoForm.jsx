import React, { useState, useEffect } from 'react';
import productoService from '../../api/productosApi';
import CategoriaSelector from './CategoriaSelector';


const ProductoForm = ({ producto, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    descripcion: '',
    id_categoria: '',
    sku: '',
    precio_base: '',
    unidad_medida: 'PZA',
    stock_actual: '0',
    stock_minimo: '10',
    peso_kg: '0',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre_producto: producto.nombre_producto || '',
        descripcion: producto.descripcion || '',
        id_categoria: producto.id_categoria || '',
        sku: producto.sku || '',
        precio_base: producto.precio_base || '',
        unidad_medida: producto.unidad_medida || 'PZA',
        stock_actual: producto.stock_actual?.toString() || '0',
        stock_minimo: producto.stock_minimo?.toString() || '10',
        peso_kg: producto.peso_kg?.toString() || '0',
      });
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre_producto.trim()) newErrors.nombre_producto = 'El nombre es requerido';
    if (!formData.id_categoria) newErrors.id_categoria = 'La categoría es requerida';
    if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) newErrors.precio_base = 'El precio base debe ser mayor a 0';
    if (parseInt(formData.stock_minimo) < 0) newErrors.stock_minimo = 'El stock mínimo no puede ser negativo';
    if (parseFloat(formData.peso_kg) < 0) newErrors.peso_kg = 'El peso no puede ser negativo';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        precio_base: parseFloat(formData.precio_base),
        stock_actual: parseInt(formData.stock_actual),
        stock_minimo: parseInt(formData.stock_minimo),
        peso_kg: parseFloat(formData.peso_kg),
      };
      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nombre_producto"
            value={formData.nombre_producto}
            onChange={handleChange}
            className={`input-field ${errors.nombre_producto ? 'border-red-500' : ''}`}
            placeholder="Ej: Clavos de acero 2\"
          />
          {errors.nombre_producto && <p className="text-xs text-red-500 mt-1">{errors.nombre_producto}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            className="input-field"
            placeholder="Descripción detallada del producto..."
          />
        </div>

        {/* Selector de categorías integrado */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          <CategoriaSelector
            value={formData.id_categoria}
            onChange={(id) => setFormData({...formData, id_categoria: id})}
            error={errors.id_categoria}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Código)</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="input-field"
            placeholder="Auto-generado si se deja vacío"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio base <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="precio_base"
              value={formData.precio_base}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`input-field pl-7 ${errors.precio_base ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
          </div>
          {errors.precio_base && <p className="text-xs text-red-500 mt-1">{errors.precio_base}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
          <select
            name="unidad_medida"
            value={formData.unidad_medida}
            onChange={handleChange}
            className="input-field"
          >
            <option value="PZA">Pieza (PZA)</option>
            <option value="KG">Kilogramo (KG)</option>
            <option value="LITRO">Litro (L)</option>
            <option value="CAJA">Caja (CAJA)</option>
            <option value="BULTO">Bulto (BULTO)</option>
            <option value="METRO">Metro (M)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
          <input
            type="number"
            name="stock_actual"
            value={formData.stock_actual}
            onChange={handleChange}
            step="1"
            min="0"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
          <input
            type="number"
            name="stock_minimo"
            value={formData.stock_minimo}
            onChange={handleChange}
            step="1"
            min="0"
            className={`input-field ${errors.stock_minimo ? 'border-red-500' : ''}`}
          />
          {errors.stock_minimo && <p className="text-xs text-red-500 mt-1">{errors.stock_minimo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
          <input
            type="number"
            name="peso_kg"
            value={formData.peso_kg}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`input-field ${errors.peso_kg ? 'border-red-500' : ''}`}
            placeholder="0.00"
          />
          {errors.peso_kg && <p className="text-xs text-red-500 mt-1">{errors.peso_kg}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : producto ? 'Actualizar' : 'Registrar'}
        </button>
      </div>
    </form>
  );
};

export default ProductoForm;