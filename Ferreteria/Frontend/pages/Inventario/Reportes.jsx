import React, { useState } from 'react';
import { inventarioService } from '../../api/inventario';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Reportes = () => {
  const [activeReporte, setActiveReporte] = useState('rotacion');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dias, setDias] = useState(30);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeReporte) {
        case 'rotacion':
          response = await inventarioService.reporteRotacion({ dias });
          const rotacionData = response.data.data || response.data;
          setData(rotacionData);
          break;
        case 'valor':
          response = await inventarioService.reporteValor();
          const valorData = response.data.data || response.data;
          setData(valorData);
          break;
        case 'stockBajo':
          response = await inventarioService.reporteStockBajo();
          const stockData = response.data.data || response.data;
          setData(stockData);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargarReporte();
  }, [activeReporte, dias]);

  const renderRotacion = () => {
    if (!data) return null;
    
    if (!Array.isArray(data)) {
      console.error('La data de rotación no es un array:', data);
      return (
        <div className="text-center py-10 text-red-500">
          Error: Formato de datos incorrecto para el reporte de rotación
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No hay datos de rotación disponibles
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días a analizar
            </label>
            <input
              type="number"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              min={1}
              max={365}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            Total productos: {data.length}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Producto</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Stock</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Vendido</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Rotación</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((item, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="p-3">
                    <p className="font-medium text-gray-800">{item.nombre_producto}</p>
                    <p className="text-xs text-gray-400">{item.sku}</p>
                  </td>
                  <td className="p-3 text-right text-gray-600">{item.stock_actual}</td>
                  <td className="p-3 text-right text-gray-600">
                    {item.vendido_ultimos_30_dias || item.vendido_ultimos_30_dias === 0 
                      ? item.vendido_ultimos_30_dias 
                      : item.item[`vendido_ultimos_${dias}_dias`] || 0}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      item.nivel_rotacion === 'ROTACIÓN RÁPIDA' ? 'bg-green-100 text-green-700' :
                      item.nivel_rotacion === 'ROTACIÓN MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.nivel_rotacion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderValor = () => {
    if (!data) return null;
    
    // Extraer por_categoria y total_general según el formato de la respuesta
    const porCategoria = data.por_categoria || [];
    const totalGeneral = data.total_general || {
      valor_inventario: 0,
      total_unidades: 0,
      total_productos: 0
    };
    
    if (porCategoria.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No hay datos de valor de inventario disponibles
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-primary-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">Valor Total del Inventario</p>
          <p className="text-3xl font-bold text-primary-600">
            ${(totalGeneral.valor_inventario || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {(totalGeneral.total_unidades || 0).toLocaleString()} unidades
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Categoría</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Productos</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Unidades</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Valor</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">%</th>
              </tr>
            </thead>
            <tbody>
              {porCategoria.map((cat, idx) => {
                const porcentaje = totalGeneral.valor_inventario 
                  ? ((cat.valor_inventario / totalGeneral.valor_inventario) * 100).toFixed(1)
                  : '0';
                return (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="p-3 font-medium text-gray-800">{cat.nombre_categoria}</td>
                    <td className="p-3 text-right text-gray-600">{cat.total_productos}</td>
                    <td className="p-3 text-right text-gray-600">{cat.total_unidades?.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-800 font-medium">${cat.valor_inventario?.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-500">{porcentaje}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStockBajo = () => {
    if (!data) return null;
    
    // Extraer productos del data
    const productosStockBajo = data.productos || [];
    const totalCriticos = data.total_criticos || 0;
    const totalBajos = data.total_bajos || 0;
    const totalFaltante = data.total_faltante || 0;
    
    if (productosStockBajo.length === 0) {
      return (
        <div className="text-center py-10 text-green-500">
          ✅ No hay productos con stock bajo
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-red-700">Productos con stock bajo</p>
            <p className="text-2xl font-bold text-red-700">{totalCriticos + totalBajos}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-red-600">Faltante total: {totalFaltante} unidades</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Producto</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Stock</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Mínimo</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Faltante</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {productosStockBajo.map((prod, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="p-3">
                    <p className="font-medium text-gray-800">{prod.nombre_producto}</p>
                    <p className="text-xs text-gray-400">{prod.sku}</p>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-800">{prod.stock_actual}</td>
                  <td className="p-3 text-right text-gray-600">{prod.stock_minimo}</td>
                  <td className="p-3 text-right text-red-600">{prod.faltante}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      prod.nivel === 'CRÍTICO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {prod.nivel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs de reportes */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveReporte('rotacion')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeReporte === 'rotacion'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Rotación de Inventario
        </button>
        <button
          onClick={() => setActiveReporte('valor')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeReporte === 'valor'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Valor de Inventario
        </button>
        <button
          onClick={() => setActiveReporte('stockBajo')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeReporte === 'stockBajo'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Stock Bajo
        </button>
      </div>

      {/* Contenido del reporte */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {activeReporte === 'rotacion' && renderRotacion()}
          {activeReporte === 'valor' && renderValor()}
          {activeReporte === 'stockBajo' && renderStockBajo()}
        </div>
      )}
    </div>
  );
};

export default Reportes;