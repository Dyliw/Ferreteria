export const formatters = {
  // Formato de moneda (MXN)
  currency: (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  },

  // Formato de números
  number: (value, decimals = 0) => {
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  // Formato de peso (kg)
  weight: (value) => {
    if (value === null || value === undefined) return '0 kg';
    return `${formatters.number(value, 2)} kg`;
  },

  // Nivel de stock con badge
  stockLevel: (stock, min) => {
    if (stock <= 0) return { text: 'AGOTADO', color: 'bg-red-100 text-red-800' };
    if (stock < min) return { text: 'STOCK BAJO', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'DISPONIBLE', color: 'bg-green-100 text-green-800' };
  },

  // Estado del producto
  status: (activo) => ({
    text: activo ? 'ACTIVO' : 'INACTIVO',
    color: activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
  }),
};