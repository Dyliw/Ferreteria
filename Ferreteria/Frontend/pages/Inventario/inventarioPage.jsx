import React, { useState } from 'react';
import { 
  ArrowPathIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import MovimientosList from './MovimientosList';
import EntradaForm from './EntradaForm';
import AjusteForm from './AjusteForm';
import Reportes from './Reportes';
import DashboardInventario from './DashboardInventario';


const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'movimientos', name: 'Movimientos', icon: ClipboardDocumentListIcon },
  { id: 'entrada', name: 'Entrada', icon: PlusIcon },
  { id: 'ajuste', name: 'Ajuste', icon: ArrowPathIcon },
  { id: 'reportes', name: 'Reportes', icon: ChartBarIcon }
];

const InventarioLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardInventario />;
      case 'movimientos':
        return <MovimientosList />;
      case 'entrada':
        return <EntradaForm onSuccess={() => setActiveTab('movimientos')} />;
      case 'ajuste':
        return <AjusteForm onSuccess={() => setActiveTab('movimientos')} />;
      case 'reportes':
        return <Reportes />;
      default:
        return <DashboardInventario />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">
            Control de entradas, salidas y movimientos de mercancía
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all
                ${activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
};

export default InventarioLayout;