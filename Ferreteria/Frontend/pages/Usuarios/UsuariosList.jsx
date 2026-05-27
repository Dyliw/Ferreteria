import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import usuarioService from '../../api/usuariosAPI'
import empleadoService from '../../api/empleadosAPI'
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';

const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [roles, setRoles] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password_nueva: '',
    confirm_password: ''
  });
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.termino = searchTerm;
      if (filtroRol) params.id_rol = filtroRol;
      if (filtroActivo !== '') params.activo = filtroActivo;
      
      const response = await usuarioService.listar(params);
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    usuarioService.obtenerRoles().then(res => setRoles(res.data));
  }, [searchTerm, filtroRol, filtroActivo]);

  const handleCambiarEstado = async (id, activo) => {
    if (confirm(`¿${activo ? 'desactivar' : 'activar'} este usuario?`)) {
      try {
        await usuarioService.cambiarEstado(id, !activo);
        toast.success(`Usuario ${!activo ? 'activado' : 'desactivado'}`);
        cargarUsuarios();
      } catch (error) {
        toast.error('Error al cambiar estado');
      }
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.password_nueva !== passwordData.confirm_password) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (passwordData.password_nueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setCambiandoPassword(true);
    try {
      await usuarioService.cambiarPassword(
        selectedUsuario.id_usuario,
        passwordData.password_actual,
        passwordData.password_nueva
      );
      toast.success('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setPasswordData({ password_actual: '', password_nueva: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setCambiandoPassword(false);
    }
  };

  const getRolBadge = (nombreRol) => {
    const badges = {
      'ADMIN': 'bg-red-100 text-red-700',
      'VENTAS': 'bg-blue-100 text-blue-700',
      'ALMACEN': 'bg-yellow-100 text-yellow-700',
      'CONSULTA': 'bg-gray-100 text-gray-700'
    };
    return badges[nombreRol] || 'bg-gray-100 text-gray-700';
  };

  const formatUltimoAcceso = (fecha) => {
    if (!fecha) return 'Nunca';
    const diff = Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60));
    if (diff < 1) return 'Hace menos de 1 hora';
    if (diff < 24) return `Hace ${diff} horas`;
    return new Date(fecha).toLocaleDateString();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Usuarios del Sistema
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {usuarios.length} usuarios registrados
          </p>
        </div>
        <Link to="/usuarios/nuevo" className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Nuevo Usuario
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por usuario o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="input-field w-40"
          >
            <option value="">Todos los roles</option>
            {roles.map(rol => (
              <option key={rol.id_rol} value={rol.id_rol}>
                {rol.nombre_rol}
              </option>
            ))}
          </select>
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="input-field w-36"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          {(searchTerm || filtroRol || filtroActivo) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroRol('');
                setFiltroActivo('');
              }}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id_usuario} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ${
                        usuario.activo ? 'bg-gradient-to-br from-primary-400 to-primary-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        {usuario.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{usuario.username}</p>
                        <p className="text-xs text-gray-400">{usuario.nombre_completo}</p>
                        {usuario.numero_empleado && (
                          <p className="text-xs text-gray-400">{usuario.numero_empleado}</p>
                        )}
                      </div>
                    </div>
                   </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRolBadge(usuario.nombre_rol)}`}>
                      <ShieldCheckIcon className="h-3 w-3" />
                      {usuario.nombre_rol}
                    </span>
                    {usuario.nombre_puesto && (
                      <p className="text-xs text-gray-400 mt-1">{usuario.nombre_puesto}</p>
                    )}
                   </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatUltimoAcceso(usuario.ultimo_acceso)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Creado: {new Date(usuario.fecha_creacion).toLocaleDateString()}
                    </p>
                   </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                   </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedUsuario(usuario);
                          setShowPasswordModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                        title="Cambiar contraseña"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/usuarios/${usuario.id_usuario}/editar`}
                        className="p-1.5 text-gray-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleCambiarEstado(usuario.id_usuario, usuario.activo)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title={usuario.activo ? 'Desactivar' : 'Activar'}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {usuarios.length === 0 && (
          <div className="text-center py-12">
            <UserCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Cambiar Contraseña Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({ password_actual: '', password_nueva: '', confirm_password: '' });
        }}
        title={`Cambiar Contraseña - ${selectedUsuario?.username}`}
        size="sm"
      >
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={passwordData.password_actual}
              onChange={(e) => setPasswordData({ ...passwordData, password_actual: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={passwordData.password_nueva}
              onChange={(e) => setPasswordData({ ...passwordData, password_nueva: e.target.value })}
              className="input-field"
              required
              minLength="6"
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({ password_actual: '', password_nueva: '', confirm_password: '' });
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cambiandoPassword}
              className="btn-primary"
            >
              {cambiandoPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsuariosList;