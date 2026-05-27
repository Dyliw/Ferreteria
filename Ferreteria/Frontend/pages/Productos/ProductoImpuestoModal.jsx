import React, { useState, useEffect } from 'react';
import Modal from '../../components/Common/Modal';
import productoService from '../../api/productosAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductoImpuestosModal = ({ isOpen, onClose, productoId, productoNombre }) => {
  const [impuestos, setImpuestos] = useState([]);
  const [impuestosDisponibles, setImpuestosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && productoId) {
      loadData();
    }
  }, [isOpen, productoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [impuestosRes, disponiblesRes] = await Promise.all([
        productoService.getTaxes(productoId),
        productoService.getTaxesList(),
      ]);
      setImpuestos(impuestosRes.data.data || []);
      setImpuestosDisponibles(disponiblesRes.data.data || []);
    } catch (error) {
      console.error('Error cargando impuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTax = async (id_impuesto, aplica) => {
    setSaving(true);
    try {
      await productoService.assignTax(productoId, id_impuesto, !aplica);
      toast.success(`Impuesto ${!aplica ? 'aplicado' : 'quitado'}`);
      await loadData();
    } catch (error) {
      toast.error('Error al modificar impuesto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Impuestos - ${productoNombre}`} size="md">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
            <p>💰 Los impuestos se aplican automáticamente al calcular el total de la venta.</p>
            <p className="text-xs mt-1">IVA: 16% | IEPS: 8% o 25% según el producto.</p>
          </div>

          <div className="space-y-2">
            {impuestosDisponibles.map((impuesto) => {
              const aplica = impuestos.find(i => i.id_impuesto === impuesto.id_impuesto)?.aplica || false;
              return (
                <div
                  key={impuesto.id_impuesto}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{impuesto.nombre_impuesto}</p>
                    <p className="text-sm text-gray-500">{impuesto.porcentaje}% - {impuesto.tipo_impuesto}</p>
                  </div>
                  <button
                    onClick={() => handleToggleTax(impuesto.id_impuesto, aplica)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      aplica
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {aplica ? 'Aplicado ✓' : 'No aplica'}
                  </button>
                </div>
              );
            })}
          </div>

          {impuestosDisponibles.length === 0 && (
            <p className="text-center text-gray-400 py-4">No hay impuestos configurados en el sistema</p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ProductoImpuestosModal;