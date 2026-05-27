import React from 'react';

const TarjetaResumen = ({ titulo, valor, icono: Icono, color, subtitulo }) => {
  const colores = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{valor}</p>
          {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colores[color]}`}>
          <Icono className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default TarjetaResumen;