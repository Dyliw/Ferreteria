import React from 'react';

import ProductoCard from './ProductoCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const ProductoList = ({ 
  productos, 
  loading, 
  onEdit, 
  onToggleStatus, 
  onUpdateWeight, 
  onRegisterBatch,
  canEdit 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay productos registrados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {productos.map((producto) => (
        <ProductoCard
          key={producto.id_producto}
          producto={producto}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onUpdateWeight={onUpdateWeight}
          onRegisterBatch={onRegisterBatch}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
};

export default ProductoList;