import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  BriefcaseIcon, 
  UserCircleIcon,
  ShoppingBagIcon,
  CubeIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/dashboard', name: 'Dashboard', icon: HomeIcon, roles: ['ADMIN', 'VENTAS', 'ALMACEN', 'CONSULTA'] },
  { path: '/clientes', name: 'Clientes', icon: UsersIcon, roles: ['ADMIN', 'VENTAS'] },
  { path: '/empleados', name: 'Empleados', icon: BriefcaseIcon, roles: ['ADMIN'] },
  { path: '/usuarios', name: 'Usuarios', icon: UserCircleIcon, roles: ['ADMIN'] },
  { path: '/productos', name: 'Productos', icon: CubeIcon, roles: ['ADMIN', 'ALMACEN', 'VENTAS'] },
  { path: '/ventas', name: 'Ventas', icon: ShoppingBagIcon, roles: ['ADMIN', 'VENTAS'] },
  {path: '/inventario', name: 'Inventario', icon: ClipboardDocumentListIcon, roles: ['ADMIN', 'ALMACEN']},
    { path: '/pedidos', name: 'Pedidos', icon: DocumentTextIcon, roles: ['ADMIN', 'VENTAS'] },
];

const Sidebar = () => {
  const { usuario, logout, hasRole } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredMenu = menuItems.filter(item => 
    item.roles.some(role => hasRole([role]))
  );

  const sidebarContent = (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-primary-400 text-2xl">🏪</span>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ferretería
          </span>
        </h1>
        <p className="text-xs text-gray-400 mt-1 truncate">{usuario?.nombre_completo}</p>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-gray-800 transition duration-200 group ${
                isActive ? 'bg-gray-800 text-white border-r-4 border-primary-500' : ''
              }`
            }
          >
            <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full transition duration-200"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </div>
    </>
  );
};
export default Sidebar;