import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  MapPinIcon, 
  BriefcaseIcon,
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import empleadoService from '../../api/empleadosAPI';
import usuarioService from '../../api/usuariosAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const EmpleadoFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [puestos, setPuestos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cpBuscando, setCpBuscando] = useState(false);
  const [crearUsuario, setCrearUsuario] = useState(false);
  
  const [formData, setFormData] = useState({
    // Datos personales
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: '',
    celular: '',
    rfc: '',
    curp: '',
    fechaNacimiento: '',
    // Datos laborales
    id_puesto: '',
    salario: '',
    comision_por_venta: 0,
    fechaContratacion: new Date().toISOString().split('T')[0],
    // Datos de usuario
    crear_usuario: false,
    username: '',
    password: '',
    id_rol: '',
    // Dirección
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    codigo_postal: '',
    idCodigoPostal: null,
    referencias: ''
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [puestosRes, rolesRes, empleadoRes] = await Promise.all([
          empleadoService.obtenerPuestos(),
          usuarioService.obtenerRoles(),
          isEditing ? empleadoService.obtenerPorId(id) : Promise.resolve(null)
        ]);
        
        setPuestos(puestosRes.data);
        setRoles(rolesRes.data);
        
        if (isEditing && empleadoRes?.success && empleadoRes.data) {
    const emp = empleadoRes.data;
          setFormData({
            nombre: emp.nombre || '',
            apellidoPaterno: emp.apellido_paterno || '',
            apellidoMaterno: emp.apellido_materno || '',
            email: emp.email || '',
            telefono: emp.telefono || '',
            celular: emp.celular || '',
            rfc: emp.rfc || '',
            curp: emp.curp || '',
            fechaNacimiento: emp.fecha_nacimiento?.split('T')[0] || '',
            id_puesto: emp.id_puesto || '',
            salario: emp.salario || '',
            comision_por_venta: emp.comision_por_venta || 0,
            fechaContratacion: emp.fecha_contratacion?.split('T')[0] || new Date().toISOString().split('T')[0],
            crear_usuario: !!emp.username,
            username: emp.username || '',
            password: '',
            id_rol: emp.id_rol || '',
            calle: emp.calle || '',
            numeroExterior: emp.numero_exterior || '',
            numeroInterior: emp.numero_interior || '',
            codigo_postal: emp.codigo_postal || '',
            idCodigoPostal: emp.id_codigo_postal || null,
            referencias: emp.referencias || ''
          });
          setCrearUsuario(!!emp.username);
        }
      } catch (error) {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [id, isEditing]);

  const handleBuscarCP = async () => {
    if (!formData.codigo_postal || formData.codigo_postal.length !== 5) {
      toast.error('Ingresa un código postal válido de 5 dígitos');
      return;
    }
    
    setCpBuscando(true);
    try {
      const clienteService = (await import('../../api/clientesAPI')).default;
      const response = await clienteService.buscarPorCP(formData.codigo_postal);
      if (response.success && response.data) {
        setFormData(prev => ({
          ...prev,
          idCodigoPostal: response.data.idcp
        }));
        toast.success('Código postal encontrado');
      } else {
        toast.error('Código postal no encontrado');
      }
    } catch (error) {
      toast.error('Error al buscar código postal');
    } finally {
      setCpBuscando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellidoPaterno) {
      toast.error('Nombre y apellido paterno son requeridos');
      return;
    }
    
    if (!formData.id_puesto) {
      toast.error('Debes seleccionar un puesto');
      return;
    }
    
    if (crearUsuario && (!formData.username || !formData.password || !formData.id_rol)) {
      toast.error('Para crear usuario, completa usuario, contraseña y rol');
      return;
    }
    
    setSaving(true);
    try {
      const datosEnviar = {
        ...formData,
        crear_usuario: crearUsuario
      };
      
      if (isEditing) {
        await empleadoService.actualizar(id, datosEnviar);
        toast.success('Empleado actualizado exitosamente');
      } else {
        await empleadoService.crear(datosEnviar);
        toast.success('Empleado registrado exitosamente');
      }
      navigate('/empleados');
    } catch (error) {
      toast.error(isEditing ? 'Error al actualizar' : 'Error al registrar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/empleados')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEditing ? 'Modifica la información del empleado' : 'Ingresa los datos del nuevo empleado'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-primary-500 rounded-full" />
            <UserIcon className="h-5 w-5 text-primary-500" />
            Información Personal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido Paterno <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.apellidoPaterno}
                onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido Materno
              </label>
              <input
                type="text"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="input-field"
                placeholder="10 dígitos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                type="tel"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                className="input-field"
                placeholder="10 dígitos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RFC
              </label>
              <input
                type="text"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                className="input-field uppercase"
                placeholder="RFC con homoclave"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CURP
              </label>
              <input
                type="text"
                value={formData.curp}
                onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                className="input-field uppercase"
                placeholder="CURP"
              />
            </div>
          </div>
        </div>

        {/* Información Laboral */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-green-500 rounded-full" />
            <BriefcaseIcon className="h-5 w-5 text-green-500" />
            Información Laboral
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puesto <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.id_puesto}
                onChange={(e) => setFormData({ ...formData, id_puesto: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                <option value="">Selecciona un puesto</option>
                {puestos.map(puesto => (
                  <option key={puesto.id_puesto} value={puesto.id_puesto}>
                    {puesto.nombre_puesto} {puesto.salario_base ? `($${puesto.salario_base.toLocaleString()})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Contratación
              </label>
              <input
                type="date"
                value={formData.fechaContratacion}
                onChange={(e) => setFormData({ ...formData, fechaContratacion: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: parseFloat(e.target.value) })}
                  className="input-field pl-7"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comisión por Venta (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.comision_por_venta}
                  onChange={(e) => setFormData({ ...formData, comision_por_venta: parseFloat(e.target.value) })}
                  className="input-field pr-7"
                  step="0.5"
                  min="0"
                  max="100"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-yellow-500 rounded-full" />
            <MapPinIcon className="h-5 w-5 text-yellow-500" />
            Dirección
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    className="input-field"
                    placeholder="5 dígitos"
                    maxLength="5"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarCP}
                    disabled={cpBuscando}
                    className="btn-secondary px-4 whitespace-nowrap"
                  >
                    {cpBuscando ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle
                </label>
                <input
                  type="text"
                  value={formData.calle}
                  onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número Exterior
                </label>
                <input
                  type="text"
                  value={formData.numeroExterior}
                  onChange={(e) => setFormData({ ...formData, numeroExterior: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número Interior
                </label>
                <input
                  type="text"
                  value={formData.numeroInterior}
                  onChange={(e) => setFormData({ ...formData, numeroInterior: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencias
              </label>
              <textarea
                value={formData.referencias}
                onChange={(e) => setFormData({ ...formData, referencias: e.target.value })}
                className="input-field"
                rows="2"
                placeholder="Entre calles, puntos de referencia, etc."
              />
            </div>
          </div>
        </div>

        {/* Acceso al Sistema (Usuario) */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-500 rounded-full" />
            <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
            Acceso al Sistema
          </h2>
          
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={crearUsuario}
                onChange={(e) => setCrearUsuario(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Crear usuario para acceso al sistema</span>
            </label>
          </div>

          {crearUsuario && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                      className="input-field pl-10"
                      placeholder="usuario.ejemplo"
                      required={crearUsuario}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    required={crearUsuario && !isEditing}
                  />
                  {isEditing && (
                    <p className="text-xs text-gray-400 mt-1">Dejar en blanco para mantener la contraseña actual</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.id_rol}
                    onChange={(e) => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                    className="input-field"
                    required={crearUsuario}
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
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/empleados')}
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
                {isEditing ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmpleadoFormPage;