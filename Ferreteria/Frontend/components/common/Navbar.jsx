import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BellIcon, 
  UserCircleIcon, 
  ChevronDownIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
      <div className="px-4 lg:px-8 py-3 flex justify-between items-center">
        <div className="ml-12 lg:ml-0">
          <h2 className="text-lg lg:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            ¡Hola, {usuario?.nombre_completo?.split(' ')[0] || 'Usuario'}! 👋
          </h2>
          <p className="text-xs text-gray-400 hidden sm:block">
            {usuario?.nombre_rol} • Hoy es {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notificaciones */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {usuario?.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up z-50">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{usuario?.nombre_completo}</p>
                  <p className="text-sm text-gray-500">{usuario?.email}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ShieldCheckIcon className="h-4 w-4 text-primary-500" />
                    <span className="text-xs text-primary-600 font-medium">{usuario?.nombre_rol}</span>
                  </div>
                </div>
                <div className="p-2">
                  <button className="flex items-center gap-3 w-full p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <UserIcon className="h-4 w-4" />
                    <span className="text-sm">Mi Perfil</span>
                  </button>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-3 w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    <span className="text-sm">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;