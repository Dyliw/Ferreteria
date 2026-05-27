import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, UserIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import usuarioService from '../../api/usuariosAPI';
import empleadoService from '../../api/empleadosAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const UsuarioFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  
  const [formData, setFormData] = useState({
    id_empleado: '',
    username: '',
    password: '',
    id_rol: ''
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
       const [empleadosSinUsuarioRes, rolesRes, usuarioRes] = await Promise.all([
              usuarioService.obtenerEmpleadosSinUsuario(),
              usuarioService.obtenerRoles(),
              isEditing ? usuarioService.obtenerPorId(id) : Promise.resolve(null)
          ]);

          setEmpleados(empleadosSinUsuarioRes.data);
          setRoles(rolesRes.data);
        
        if (isEditing && usuarioRes?.success && usuarioRes.data) {
          const user = usuarioRes.data;
          setFormData({
            id_empleado: user.id_empleado,
            username: user.username,
            password: '',
            id_rol: user.id_rol
          });
          // Cargar info del empleado
          const emp = await empleadoService.obtenerPorId(user.id_empleado);
          setEmpleadoSeleccionado(emp.data);
        }
      } catch (error) {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [id, isEditing]);

  const handleEmpleadoChange = async (id_empleado) => {
    setFormData({ ...formData, id_empleado });
    if (id_empleado) {
      try {
        const emp = await empleadoService.obtenerPorId(id_empleado);
        setEmpleadoSeleccionado(emp.data);
      } catch {
        setEmpleadoSeleccionado(null);
      }
    } else {
      setEmpleadoSeleccionado(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_empleado) {
      toast.error('Debes seleccionar un empleado');
      return;
    }
    
    if (!formData.username) {
      toast.error('El nombre de usuario es requerido');
      return;
    }
    
    if (!isEditing && !formData.password) {
      toast.error('La contraseña es requerida');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (!formData.id_rol) {
      toast.error('Debes seleccionar un rol');
      return;
    }
    
    setSaving(true);
    try {
      if (isEditing) {
        const updateData = {
          username: formData.username,
          id_rol: formData.id_rol
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usuarioService.actualizar(id, updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usuarioService.crear(formData);
        toast.success('Usuario creado exitosamente');
      }
      navigate('/usuarios');
    } catch (error) {
      toast.error(isEditing ? 'Error al actualizar' : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEditing ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario para un empleado'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Información del Empleado */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-primary-500 rounded-full" />
            <UserIcon className="h-5 w-5 text-primary-500" />
            Empleado
          </h2>
          
          {!isEditing ? (
            <select
              value={formData.id_empleado}
              onChange={(e) => handleEmpleadoChange(parseInt(e.target.value))}
              className="input-field"
              required
            >
              <option value="">Selecciona un empleado</option>
              {empleados.map(emp => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp.nombre_completo} - {emp.nombre_puesto} ({emp.numero_empleado})
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-800">{empleadoSeleccionado?.nombre_completo}</p>
              <p className="text-sm text-gray-500">{empleadoSeleccionado?.nombre_puesto}</p>
              <p className="text-sm text-gray-500">{empleadoSeleccionado?.numero_empleado}</p>
            </div>
          )}
          
          {empleadoSeleccionado && !isEditing && (
            <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              Creando usuario para: <strong>{empleadoSeleccionado.nombre_completo}</strong>
            </div>
          )}
        </div>

        {/* Credenciales */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-500 rounded-full" />
            <KeyIcon className="h-5 w-5 text-purple-500" />
            Credenciales de Acceso
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Usuario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className="input-field"
                placeholder="usuario.ejemplo"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && <span className="text-xs text-gray-400 ml-2">(Dejar en blanco para no cambiar)</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                required={!isEditing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.id_rol}
                onChange={(e) => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                <option value="">Selecciona un rol</option>
                {roles.map(rol => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre_rol} - {rol.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Crear Usuario'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsuarioFormPage;