import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clientesAPI } from '../../api/clientesAPI';
import BuscarCP from '../../components/clientes/BuscarCP';
import TipoClienteSelect from '../../components/clientes/TipoClientes';
const NuevoCliente = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [direccionData, setDireccionData] = useState(null);
    
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

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
        if (!direccionData) {
            toast.error('Debes buscar un código postal válido');
            return;
        }

        setLoading(true);
        
        try {
            const clienteData = {
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
                id_codigo_postal: direccionData.id_codigo_postal,
                referencias: data.referencias || null,
                
                // Datos de cliente
                id_tipo_cliente: data.id_tipo_cliente,
                credito_autorizado: data.credito_autorizado === 'true' ? 1 : 0,
                limite_credito: data.credito_autorizado === 'true' ? (data.limite_credito || 0) : 0,
                factor_descuento_extra: data.factor_descuento_extra || 0
            };
            
            const response = await clientesAPI.registrar(clienteData);
            
            if (response.data.success) {
                toast.success('Cliente registrado exitosamente');
                navigate('/clientes');
            }
        } catch (error) {
            console.error('Error al registrar:', error);
            toast.error(error.response?.data?.message || 'Error al registrar cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nuevo-cliente-container">
            <div className="page-header">
                <h1>Registrar Nuevo Cliente</h1>
                <button onClick={() => navigate('/clientes')} className="btn-volver">
                    ← Volver a la lista
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="cliente-form">
                {/* Búsqueda de código postal */}
                <BuscarCP 
                    onDireccionFound={handleDireccionFound}
                    onClear={handleClearDireccion}
                />

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

                {/* Dirección */}
                <div className="form-section">
                    <h3>Dirección</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Calle *</label>
                            <input 
                                type="text" 
                                {...register('calle', { required: 'La calle es requerida' })}
                                disabled={!direccionData}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Número Exterior *</label>
                            <input 
                                type="text" 
                                {...register('numero_exterior', { required: 'El número exterior es requerido' })}
                                disabled={!direccionData}
                            />
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
                            <strong>Dirección completa:</strong>
                            <p>{direccionData.direccion_completa}</p>
                        </div>
                    )}
                </div>

                {/* Datos de cliente */}
                <div className="form-section">
                    <h3>Datos de Cliente</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo de Cliente *</label>
                            <TipoClienteSelect 
                                register={register}
                                {...register('id_tipo_cliente', { required: 'El tipo de cliente es requerido' })}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Descuento Extra (%)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                {...register('factor_descuento_extra')}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                <input type="checkbox" {...register('credito_autorizado')} />
                                Autorizar Crédito
                            </label>
                        </div>
                        
                        <div className="form-group">
                            <label>Límite de Crédito</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                {...register('limite_credito')}
                                disabled={!register('credito_autorizado')}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/clientes')} className="btn-cancelar">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="btn-guardar">
                        {loading ? 'Registrando...' : 'Registrar Cliente'}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .nuevo-cliente-container {
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
                .page-header h1 {
                    margin: 0;
                    color: #333;
                }
                .btn-volver {
                    padding: 8px 16px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .cliente-form {
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
                .form-group input:focus, 
                .form-group select:focus, 
                .form-group textarea:focus {
                    outline: none;
                    border-color: #007bff;
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
                    padding-top: 20px;
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
                .btn-guardar:hover {
                    background: #218838;
                }
                .btn-cancelar:hover {
                    background: #5a6268;
                }
            `}</style>
        </div>
    );
};

export default NuevoCliente;