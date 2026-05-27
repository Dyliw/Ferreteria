import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, MapPinIcon } from '@heroicons/react/24/outline';
import clienteService from '../../api/clientesAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import CodigoPostalSearch from '../../components/common/CodigoPostalSearch';


const ClienteFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false); 
    const [tipos, setTipos] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        email: '',
        telefono: '',
        celular: '',
        rfc: '',
        id_tipo_cliente: 1,
        calle: '',
        numeroExterior: '',
        numeroInterior: '',
        idCodigoPostal: null,
        codigo_postal: '',
        asentamiento: '',
        tipo_asentamiento: '',
        municipio: '',
        estado: '',
        ciudad: '',
        referencias: ''
    });

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const [tiposRes, clienteRes] = await Promise.all([
                    clienteService.obtenerTipos(),
                    isEditing ? clienteService.obtenerPorId(id) : Promise.resolve(null)
                ]);

                setTipos(tiposRes.data);

                if (isEditing && clienteRes?.success && clienteRes.data) {
                    const c = clienteRes.data;
                    setFormData({
                        nombre: c.nombre || '',
                        apellidoPaterno: c.apellido_paterno || '', 
                        apellidoMaterno: c.apellido_materno || '',
                        email: c.email || '',
                        telefono: c.telefono || '',
                        celular: c.celular || '',
                        rfc: c.rfc || '',
                        id_tipo_cliente: c.id_tipo_cliente || 1,
                        calle: c.calle || '',
                        numeroExterior: c.numero_exterior || '',
                        numeroInterior: c.numero_interior || '',
                        idCodigoPostal: c.id_codigo_postal || null,
                        codigo_postal: c.codigo_postal || '',
                        asentamiento: c.asentamiento || '',
                        tipo_asentamiento: c.tipo_asentamiento || '',
                        municipio: c.municipio || '',
                        estado:c.estado || '',
                        ciudad: '',
                        referencias:c.referencias || ''
                    });
                }
            } catch (error) {
                toast.error('Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [id, isEditing]);

    // Callback del componente CodigoPostalSearch al seleccionar un asentamiento
    const handleDireccionSeleccionada = (data) => {
        console.log('Dirección recibida del buscador:', data);

        const idCP = data?.id_codigo_postal ?? data?.idcp;

        if (idCP != null) {
            setFormData(prev => ({
                ...prev,
                idCodigoPostal:    idCP,
                codigo_postal:     data.cp || '',
                asentamiento:      data.asentamiento || '',
                tipo_asentamiento: data.tipo_asentamiento || '',
                municipio:         data.municipio || '',
                estado:            data.estado || '',
                ciudad:            data.ciudad || ''
            }));
        } else {
            console.warn('No se recibió id_codigo_postal válido:', data);
            setFormData(prev => ({ ...prev, idCodigoPostal: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((formData.calle || formData.numeroExterior) && !formData.idCodigoPostal) {
            toast.error('Debes seleccionar un código postal válido para guardar la dirección');
            return;
        }

        const datosEnvio = {
            nombre: formData.nombre,
            apellidoPaterno: formData.apellidoPaterno, 
            apellidoMaterno:formData.apellidoMaterno, 
            email:formData.email || null,
            telefono: formData.telefono || null,
            celular: formData.celular || null,
            rfc: formData.rfc || null,
            id_tipo_cliente: formData.id_tipo_cliente,
            calle: formData.calle || null,
            numeroExterior: formData.numeroExterior || null,
            numeroInterior: formData.numeroInterior || null,
            idCodigoPostal: formData.idCodigoPostal || null,
            referencias: formData.referencias || null
        };

        console.log('Enviando al backend:', datosEnvio);

        setSaving(true);
        try {
            if (isEditing) {
                await clienteService.actualizar(id, datosEnvio);
                toast.success('Cliente actualizado exitosamente');
            } else {
                await clienteService.crear(datosEnvio);
                toast.success('Cliente registrado exitosamente');
            }
            navigate('/clientes');
        } catch (error) {
            console.error('Error:', error);
            toast.error(isEditing ? 'Error al actualizar' : 'Error al registrar');
        } finally {
            setSaving(false); 
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/clientes')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isEditing ? 'Modifica la información del cliente' : 'Ingresa los datos del nuevo cliente'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-primary-500 rounded-full" />
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
                                onChange={(e) => handleChange('nombre', e.target.value)}
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
                                onChange={(e) => handleChange('apellidoPaterno', e.target.value)}
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
                                onChange={(e) => handleChange('apellidoMaterno', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Cliente
                            </label>
                            <select
                                value={formData.id_tipo_cliente}
                                onChange={(e) => handleChange('id_tipo_cliente', parseInt(e.target.value))}
                                className="input-field"
                            >
                                {tipos.map(tipo => (
                                    <option key={tipo.id_tipo_cliente} value={tipo.id_tipo_cliente}>
                                        {tipo.nombre_tipo} (Descuento: {tipo.descuento_base}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contacto */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-primary-500 rounded-full" />
                        Información de Contacto
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => handleChange('telefono', e.target.value)}
                                className="input-field"
                                placeholder="10 dígitos"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                            <input
                                type="tel"
                                value={formData.celular}
                                onChange={(e) => handleChange('celular', e.target.value)}
                                className="input-field"
                                placeholder="10 dígitos"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                            <input
                                type="text"
                                value={formData.rfc}
                                onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                                className="input-field uppercase"
                                placeholder="RFC con homoclave"
                                maxLength={13}
                            />
                        </div>
                    </div>
                </div>

    {/* Dirección */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-primary-500 rounded-full" />
                        <MapPinIcon className="h-5 w-5 text-primary-500" />
                        Dirección
                    </h2>
                    <div className="space-y-4">
                        <CodigoPostalSearch
                            onSelect={handleDireccionSeleccionada}
                            initialValue={formData.codigo_postal}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
                                <input
                                    type="text"
                                    value={formData.calle}
                                    onChange={(e) => handleChange('calle', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número Exterior</label>
                                <input
                                    type="text"
                                    value={formData.numeroExterior}
                                    onChange={(e) => handleChange('numeroExterior', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número Interior</label>
                                <input
                                    type="text"
                                    value={formData.numeroInterior}
                                    onChange={(e) => handleChange('numeroInterior', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                    {/* Preview de dirección seleccionada */}
                        {formData.asentamiento && (
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-gray-500">Asentamiento:</span>
                                        <p className="font-medium text-gray-800">{formData.asentamiento}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Tipo:</span>
                                        <p className="font-medium text-gray-800">{formData.tipo_asentamiento}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Municipio:</span>
                                        <p className="font-medium text-gray-800">{formData.municipio}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Estado:</span>
                                        <p className="font-medium text-gray-800">{formData.estado}</p>
                                    </div>
                                    {formData.ciudad && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Ciudad:</span>
                                            <p className="font-medium text-gray-800">{formData.ciudad}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencias</label>
                            <textarea
                                value={formData.referencias}
                                onChange={(e) => handleChange('referencias', e.target.value)}
                                className="input-field"
                                rows="2"
                                placeholder="Entre calles, puntos de referencia, etc."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/clientes')}
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
                                    <circle className="opacity-25" cx="12" cy="12" r="10"
                                        stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

export default ClienteFormPage;