import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { empleadosAPI } from '../../api/empleadosAPI';
import BuscarCP from '../../components/clientes/BuscarCP';

const NuevoEmpleado = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [puestos, setPuestos] = useState([]);
    const [direccionData, setDireccionData] = useState(null);
    
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        cargarPuestos();
    }, []);

    const cargarPuestos = async () => {
        try {
            const response = await empleadosAPI.getPuestos();
            if (response.data.success) {
                setPuestos(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar puestos:', error);
            toast.error('Error al cargar puestos');
        }
    };

    const handleDireccionFound = (direccion) => {
        setDireccionData(direccion);
        setValue('id_codigo_postal', direccion.id_codigo_postal);
        toast.success('Dirección cargada automáticamente');
    };

    const handleClearDireccion = () => {
        setDireccionData(null);
        setValue('id_codigo_postal', '');
    };

    const onSubmit = async (data) => {
        setLoading(true);
        
        try {
            const empleadoData = {
                // Datos personales
                nombre: data.nombre,
                apellido_paterno: data.apellido_paterno,
                apellido_materno: data.apellido_materno || null,
                email: data.email || null,
                telefono: data.telefono || null,
                celular: data.celular || null,
                rfc: data.rfc || null,
                curp: data.curp || null,
                fecha_nacimiento: data.fecha_nacimiento || null,
                
                // Dirección
                calle: data.calle,
                numero_exterior: data.numero_exterior,
                numero_interior: data.numero_interior || null,
                id_codigo_postal: direccionData ? direccionData.id_codigo_postal : null,
                referencias: data.referencias || null,
                
                // Datos de empleado
                id_puesto: data.id_puesto,
                numero_empleado: data.numero_empleado,
                fecha_contratacion: data.fecha_contratacion,
                salario: data.salario || null,
                comision_por_venta: data.comision_por_venta || 0
            };
            
            const response = await empleadosAPI.registrar(empleadoData);
            
            if (response.data.success) {
                toast.success('Empleado registrado exitosamente');
                navigate('/empleados');
            }
        } catch (error) {
            console.error('Error al registrar:', error);
            toast.error(error.response?.data?.message || 'Error al registrar empleado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nuevo-empleado-container">
            <div className="page-header">
                <h1>Registrar Nuevo Empleado</h1>
                <button onClick={() => navigate('/empleados')} className="btn-volver">
                    ← Volver a la lista
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="empleado-form">
                {/* Búsqueda de código postal (opcional) */}
                <div className="form-section">
                    <h3>Dirección (Opcional)</h3>
                    <BuscarCP 
                        onDireccionFound={handleDireccionFound}
                        onClear={handleClearDireccion}
                    />
                </div>

                {/* Datos personales */}
                <div className="form-section">
                    <h3>Datos Personales</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input 
                                type="text" 
                                {...register('nombre', { required: 'El nombre es requerido' })}
                            />
                            {errors.nombre && <span className="error">{errors.nombre.message}</span>}
                        </div>
                        
                        <div className="form-group">
                            <label>Apellido Paterno *</label>
                            <input 
                                type="text" 
                                {...register('apellido_paterno', { required: 'El apellido paterno es requerido' })}
                            />
                            {errors.apellido_paterno && <span className="error">{errors.apellido_paterno.message}</span>}
                        </div>
                        
                        <div className="form-group">
                            <label>Apellido Materno</label>
                            <input type="text" {...register('apellido_materno')} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" {...register('email')} />
                        </div>
                        
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input type="tel" {...register('telefono')} />
                        </div>
                        
                        <div className="form-group">
                            <label>Celular</label>
                            <input type="tel" {...register('celular')} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>RFC</label>
                            <input type="text" {...register('rfc')} maxLength="13" />
                        </div>
                        
                        <div className="form-group">
                            <label>CURP</label>
                            <input type="text" {...register('curp')} maxLength="18" />
                        </div>
                        
                        <div className="form-group">
                            <label>Fecha de Nacimiento</label>
                            <input type="date" {...register('fecha_nacimiento')} />
                        </div>
                    </div>
                </div>

                {/* Dirección completa */}
                <div className="form-section">
                    <h3>Dirección</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Calle</label>
                            <input type="text" {...register('calle')} />
                        </div>
                        
                        <div className="form-group">
                            <label>Número Exterior</label>
                            <input type="text" {...register('numero_exterior')} />
                        </div>
                        
                        <div className="form-group">
                            <label>Número Interior</label>
                            <input type="text" {...register('numero_interior')} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Referencias</label>
                        <textarea {...register('referencias')} rows="2" />
                    </div>

                    {direccionData && (
                        <div className="direccion-preview">
                            <strong>Dirección encontrada:</strong>
                            <p>{direccionData.direccion_completa}</p>
                        </div>
                    )}
                </div>

                {/* Datos laborales */}
                <div className="form-section">
                    <h3>Datos Laborales</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Número de Empleado *</label>
                            <input 
                                type="text" 
                                {...register('numero_empleado', { required: 'El número de empleado es requerido' })}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Puesto *</label>
                            <select {...register('id_puesto', { required: 'El puesto es requerido' })}>
                                <option value="">Seleccionar puesto</option>
                                {puestos.map(puesto => (
                                    <option key={puesto.id_puesto} value={puesto.id_puesto}>
                                        {puesto.nombre_puesto} - ${puesto.salario_base?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha de Contratación *</label>
                            <input 
                                type="date" 
                                {...register('fecha_contratacion', { required: 'La fecha de contratación es requerida' })}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Salario</label>
                            <input type="number" step="0.01" {...register('salario')} />
                        </div>
                        
                        <div className="form-group">
                            <label>Comisión por Venta (%)</label>
                            <input type="number" step="0.01" {...register('comision_por_venta')} />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/empleados')} className="btn-cancelar">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="btn-guardar">
                        {loading ? 'Registrando...' : 'Registrar Empleado'}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .nuevo-empleado-container {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .btn-volver {
                    padding: 8px 16px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .empleado-form {
                    background: white;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .form-section {
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .form-section h3 {
                    margin: 0 0 20px 0;
                    color: #007bff;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                .form-group label {
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #555;
                }
                .form-group input, 
                .form-group select, 
                .form-group textarea {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .error {
                    color: #dc3545;
                    font-size: 12px;
                    margin-top: 5px;
                }
                .direccion-preview {
                    margin-top: 15px;
                    padding: 10px;
                    background: #e7f3ff;
                    border-radius: 4px;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    margin-top: 30px;
                }
                .btn-cancelar {
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn-guardar {
                    padding: 10px 20px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default NuevoEmpleado;