import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, CurrencyDollarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import empleadoService from '../../api/empleadosAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const EmpleadoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEmpleado = async () => {
      try {
        const response = await empleadoService.obtenerPorId(id);
        if (response.success) {
          setEmpleado(response.data);
        } else {
          toast.error('Empleado no encontrado');
          navigate('/empleados');
        }
      } catch (error) {
        toast.error('Error al cargar empleado');
        navigate('/empleados');
      } finally {
        setLoading(false);
      }
    };
    cargarEmpleado();
  }, [id, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!empleado) return null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/empleados')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{empleado.nombre_completo}</h1>
            <p className="text-gray-500 text-sm">ID: {empleado.numero_empleado}</p>
          </div>
        </div>
        <Link
          to={`/empleados/${id}/editar`}
          className="btn-primary flex items-center gap-2"
        >
          <PencilIcon className="h-4 w-4" />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Foto y datos básicos */}
        <div className="card p-6 text-center">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {empleado.nombre?.charAt(0)}{empleado.apellido_paterno?.charAt(0)}
          </div>
          <h2 className="mt-4 text-xl font-semibold">{empleado.nombre_completo}</h2>
          <p className="text-primary-600 font-medium">{empleado.nombre_puesto}</p>
          <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${empleado.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-2 h-2 rounded-full ${empleado.activo ? 'bg-green-500' : 'bg-red-500'}`} />
            {empleado.activo ? 'Activo' : 'Inactivo'}
          </div>
        </div>

        {/* Columna derecha - Detalles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de contacto */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5 text-primary-500" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm">{empleado.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Teléfono</p>
                  <p className="text-sm">{empleado.telefono || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Fecha de contratación</p>
                  <p className="text-sm">{empleado.fecha_contratacion_formato || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Salario</p>
                  <p className="text-sm">${empleado.salario?.toLocaleString() || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Datos laborales */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-primary-500" />
              Datos Laborales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Puesto</p>
                <p className="font-medium">{empleado.nombre_puesto}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Comisión por venta</p>
                <p className="font-medium">{empleado.comision_por_venta}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Número de empleado</p>
                <p className="font-medium">{empleado.numero_empleado}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Antigüedad</p>
                <p className="font-medium">{empleado.antiguedad_anios || 0} años</p>
              </div>
            </div>
          </div>

          {/* Datos de usuario */}
          {empleado.username && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-primary-500" />
                Acceso al Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Usuario</p>
                  <p className="font-medium">{empleado.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rol</p>
                  <p className="font-medium">{empleado.nombre_rol}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Último acceso</p>
                  <p className="font-medium">{empleado.ultimo_acceso ? new Date(empleado.ultimo_acceso).toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmpleadoDetail;