import React, { useState, useEffect } from 'react';
import Modal from '../../components/Common/Modal';
import productoService from '../../api/productosApi';
import { formatters } from '../../utils/formatters';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';


const ProductoPreciosModal = ({
  isOpen,
  onClose,
  productoId,
  productoNombre,
}) => {
  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiposCliente, setTiposCliente] = useState([]);
  const [precioEditando, setPrecioEditando] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState({
    precio_unitario: 0,
  });

  useEffect(() => {
    if (isOpen && productoId) {
      loadPrecios();
      loadTiposCliente();
    }
  }, [isOpen, productoId]);

  const loadPrecios = async () => {
    setLoading(true);

    try {
      const response = await productoService.getPrices(productoId);

      const preciosData = response?.data || response || [];

      setPrecios(Array.isArray(preciosData) ? preciosData : []);
    } catch (error) {
      console.error('Error cargando precios:', error);

      toast.error('Error al cargar precios');

      setPrecios([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTiposCliente = async () => {
    try {
      const response = await productoService.getPriceLists();

      const tiposData = response?.data || response || [];

      setTiposCliente(Array.isArray(tiposData) ? tiposData : []);
    } catch (error) {
      console.error('Error cargando tipos:', error);

      setTiposCliente([]);
    }
  };

  const handleEditPrecio = (idTipoCliente, precioActual) => {
    setPrecioEditando(idTipoCliente);

    setNuevoPrecio({
      precio_unitario: precioActual || 0,
    });
  };

  const handleSavePrecio = async (idTipoCliente) => {
    if (
      !nuevoPrecio.precio_unitario ||
      nuevoPrecio.precio_unitario <= 0
    ) {
      toast.error('Ingrese un precio válido');
      return;
    }

    setSaving(true);

    try {
      await productoService.setSpecialPrice(productoId, {
        id_tipo_cliente: idTipoCliente,
        precio_unitario: nuevoPrecio.precio_unitario,
        cantidad_minima: 1,
      });

      toast.success('Precio actualizado exitosamente');

      setPrecioEditando(null);

      await loadPrecios();
    } catch (error) {
      console.error('Error guardando precio:', error);

      toast.error(
        error.response?.data?.message ||
          'Error al guardar precio'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePrecio = (e) => {
    setNuevoPrecio({
      precio_unitario: parseFloat(e.target.value) || 0,
    });
  };

  const getFactorColor = (factor) => {
    if (factor >= 1.13) return 'text-red-600 font-bold';
    if (factor >= 1.10) return 'text-orange-600 font-bold';
    if (factor >= 1.09) return 'text-green-600 font-bold';

    return 'text-blue-600';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Precios - ${productoNombre || 'Producto'}`}
      size="lg"
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <p>
              💡 Los precios se calculan automáticamente según
              el peso del producto y el tipo de cliente.
            </p>

            <p className="text-xs mt-1">
              Puedes configurar precios especiales manualmente
              en esta pantalla.
            </p>
          </div>

          <div className="overflow-x-auto">
            {precios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay precios disponibles para este producto
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">
                      Tipo de cliente
                    </th>

                    <th className="text-center py-2 px-3 font-semibold text-gray-600">
                      1 pieza
                    </th>

                    <th className="text-center py-2 px-3 font-semibold text-gray-600">
                      25 piezas
                    </th>

                    <th className="text-center py-2 px-3 font-semibold text-gray-600">
                      50 piezas
                    </th>

                    <th className="text-center py-2 px-3 font-semibold text-gray-600">
                      100 piezas
                    </th>

                    <th className="text-center py-2 px-3 font-semibold text-gray-600">
                      Factor
                    </th>

                    <th className="text-center py-2 px-3 font-semibold text-gray-600">
                      Precio especial
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {precios.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 font-medium">
                        {item.nombre_tipo ||
                          item.nombre_cliente ||
                          `Tipo ${item.id_tipo_cliente}`}
                      </td>

                      <td className="text-center py-2 px-3 font-mono">
                        {formatters.currency(
                          item.precio_calculado_1 ||
                            item.precio_1 ||
                            0
                        )}
                      </td>

                      <td className="text-center py-2 px-3 font-mono">
                        {formatters.currency(
                          item.precio_calculado_25 ||
                            item.precio_25 ||
                            0
                        )}
                      </td>

                      <td className="text-center py-2 px-3 font-mono">
                        {formatters.currency(
                          item.precio_calculado_50 ||
                            item.precio_50 ||
                            0
                        )}
                      </td>

                      <td className="text-center py-2 px-3 font-mono">
                        {formatters.currency(
                          item.precio_calculado_100 ||
                            item.precio_100 ||
                            0
                        )}
                      </td>

                      <td
                        className={`text-center py-2 px-3 ${getFactorColor(
                          item.factor
                        )}`}
                      >
                        {item.factor
                          ? `×${item.factor}`
                          : '—'}
                      </td>

                      <td className="text-center py-2 px-3">
                        {precioEditando ===
                        item.id_tipo_cliente ? (
                          <div className="flex gap-1 justify-center">
                            <input
                              type="number"
                              value={
                                nuevoPrecio.precio_unitario
                              }
                              onChange={handleChangePrecio}
                              className="w-24 px-2 py-1 text-sm border rounded"
                              step="0.01"
                              placeholder="Precio"
                            />

                            <button
                              onClick={() =>
                                handleSavePrecio(
                                  item.id_tipo_cliente
                                )
                              }
                              disabled={saving}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Guardar
                            </button>

                            <button
                              onClick={() =>
                                setPrecioEditando(null)
                              }
                              className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleEditPrecio(
                                item.id_tipo_cliente,
                                item.precio_especial
                              )
                            }
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            {item.precio_especial
                              ? 'Editar'
                              : 'Configurar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {tiposCliente.length > 0 &&
            tiposCliente.some((t) => t.id_lista) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-700 mb-2">
                  📋 Listas de precios disponibles
                </h4>

                <div className="space-y-2">
                  {tiposCliente
                    .filter((t) => t.id_lista)
                    .map((lista, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 text-sm"
                      >
                        <p className="font-medium">
                          {lista.nombre_lista}
                        </p>

                        <p className="text-gray-500 text-xs">
                          Tipo de cliente:{' '}
                          {lista.nombre_tipo_cliente}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}
    </Modal>
  );
};

export default ProductoPreciosModal;