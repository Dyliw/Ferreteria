import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  UserCircleIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TruckIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import clienteService from '../../api/clientesAPI';
import empleadoService from '../../api/empleadosAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const { usuario, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    clientes: { total: 0, activos: 0, total_compras: 0 },
    empleados: { total: 0, activos: 0, salario_promedio: 0 },
    loading: true
  });

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const [clientesStats, empleadosStats] = await Promise.all([
          clienteService.obtenerEstadisticas(),
          isAdmin() ? empleadoService.obtenerEstadisticas() : Promise.resolve({ data: {} })
        ]);
        
        setStats({
          clientes: clientesStats.data,
          empleados: empleadosStats.data,
          loading: false
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    cargarEstadisticas();
  }, [isAdmin]);

  const cards = [
    {
      title: 'Clientes',
      value: stats.clientes?.total || 0,
      subvalue: `${stats.clientes?.clientes_activos || 0} activos`,
      icon: UsersIcon,
      gradient: 'from-blue-500 to-blue-600',
      link: '/clientes'
    },
    {
      title: 'Empleados',
      value: stats.empleados?.total || 0,
      subvalue: `${stats.empleados?.empleados_activos || 0} activos`,
      icon: BriefcaseIcon,
      gradient: 'from-green-500 to-green-600',
      link: '/empleados',
      adminOnly: true
    },
    {
      title: 'Usuarios',
      value: stats.empleados?.empleados_con_usuario || 0,
      subvalue: 'con acceso al sistema',
      icon: UserCircleIcon,
      gradient: 'from-purple-500 to-purple-600',
      link: '/usuarios',
      adminOnly: true
    },
    {
      title: 'Ventas',
      value: `$${stats.clientes?.total_compras?.toLocaleString() || 0}`,
      subvalue: 'histórico de ventas',
      icon: CurrencyDollarIcon,
      gradient: 'from-yellow-500 to-yellow-600',
      link: '/ventas'
    }
  ];

  const quickActions = [
    { name: 'Nuevo Cliente', icon: UsersIcon, href: '/clientes/nuevo', color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    { name: 'Nuevo Empleado', icon: BriefcaseIcon, href: '/empleados/nuevo', color: 'bg-green-500', hover: 'hover:bg-green-600', adminOnly: true },
    { name: 'Nuevo Usuario', icon: UserCircleIcon, href: '/usuarios/nuevo', color: 'bg-purple-500', hover: 'hover:bg-purple-600', adminOnly: true },
    { name: 'Nueva Venta', icon: ShoppingCartIcon, href: '/ventas/nueva', color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
  ];

  const recentActivities = [
    { icon: UserGroupIcon, text: 'Nuevo cliente registrado', time: 'Hace 5 minutos', color: 'text-blue-500', bg: 'bg-blue-100' },
    { icon: ShoppingCartIcon, text: 'Venta realizada por $5,000', time: 'Hace 2 horas', color: 'text-green-500', bg: 'bg-green-100' },
    { icon: TruckIcon, text: 'Entrada de inventario', time: 'Hace 3 horas', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  ];

  const filteredCards = cards.filter(card => !card.adminOnly || isAdmin());
  const filteredActions = quickActions.filter(action => !action.adminOnly || isAdmin());

  if (stats.loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-400 rounded-full opacity-20 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary-500 rounded-full opacity-20 blur-2xl" />
        
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold">
            ¡Bienvenido, {usuario?.nombre_completo?.split(' ')[0]}! 👋
          </h1>
          <p className="text-primary-100 mt-2 max-w-md">
            Hoy es {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-4 flex gap-3">
            <span className="inline-flex items-center gap-1 text-sm bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Sistema activo
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="group card p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.subvalue}</p>
              </div>
              <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-primary-600 text-sm font-medium group-hover:gap-2 transition-all">
              Ver detalles
              <ArrowTrendingUpIcon className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-primary-500 rounded-full" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {filteredActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className={`${action.color} ${action.hover} rounded-xl p-4 text-center text-white transition-all transform hover:scale-105 shadow-lg hover:shadow-xl`}
            >
              <action.icon className="h-8 w-8 mx-auto mb-2" />
              <span className="text-sm font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-5 w-5 text-primary-500" />
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`${activity.bg} p-2 rounded-full`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary-500" />
            Resumen de Ventas
          </h2>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Gráfica de ventas mensuales</p>
              <p className="text-gray-300 text-xs">Próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;