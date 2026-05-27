import React, { useState, useEffect } from 'react';
import { CreditCardIcon, BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import ventaService from '../../api/ventasAPI';

const MetodoPagoSelector = ({ value, onChange, onTransferenciaData }) => {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferenciaData, setTransferenciaData] = useState({
    banco_emisor: '',
    banco_receptor: '',
    cuenta_origen: '',
    cuenta_destino: '',
    referencia: '',
    monto: 0
  });

  useEffect(() => {
    const cargarMetodos = async () => {
      try {
        const response = await ventaService.obtenerMetodosPago();
        setMetodos(response.data);
      } catch (error) {
        console.error('Error cargando métodos de pago:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarMetodos();
  }, []);

  const handleTransferenciaChange = (field, val) => {
    const newData = { ...transferenciaData, [field]: val };
    setTransferenciaData(newData);
    onTransferenciaData?.(newData);
  };

  const getIcono = (nombre) => {
    switch (nombre) {
      case 'EFECTIVO': return <BanknotesIcon className="h-5 w-5" />;
      case 'TRANSFERENCIA': return <BuildingLibraryIcon className="h-5 w-5" />;
      default: return <CreditCardIcon className="h-5 w-5" />;
    }
  };

  if (loading) return <div className="text-center py-4">Cargando métodos de pago...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metodos.map((metodo) => (
          <button
            key={metodo.id_metodo_pago}
            onClick={() => onChange(metodo.id_metodo_pago)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              value === metodo.id_metodo_pago
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            {getIcono(metodo.nombre_metodo)}
            <span className="font-medium">{metodo.nombre_metodo}</span>
          </button>
        ))}
      </div>

      {/* Datos de transferencia */}
      {value === 2 && ( 
        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
          <p className="text-sm font-medium text-gray-700">Datos de la transferencia</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Banco emisor"
              value={transferenciaData.banco_emisor}
              onChange={(e) => handleTransferenciaChange('banco_emisor', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="Banco receptor"
              value={transferenciaData.banco_receptor}
              onChange={(e) => handleTransferenciaChange('banco_receptor', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="Cuenta origen"
              value={transferenciaData.cuenta_origen}
              onChange={(e) => handleTransferenciaChange('cuenta_origen', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="Cuenta destino"
              value={transferenciaData.cuenta_destino}
              onChange={(e) => handleTransferenciaChange('cuenta_destino', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="Referencia"
              value={transferenciaData.referencia}
              onChange={(e) => handleTransferenciaChange('referencia', e.target.value)}
              className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MetodoPagoSelector;