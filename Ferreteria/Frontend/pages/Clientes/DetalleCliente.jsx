import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clienteService from '../../api/clientesAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const DetalleCliente = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarCliente();
    }, [id]);

    const cargarCliente = async () => {
          setLoading(true);
    try {
        const response = await clienteService.obtenerPorId(id);
 
        if (response.success) {
            setCliente(response.data);
        } else {
            toast.error(response.message || 'Error al cargar cliente');
            navigate('/clientes');
        }
    } catch (error) {
        console.error('Error al cargar cliente:', error);
        toast.error('Error al cargar datos del cliente');
        navigate('/clientes');
    } finally {
        setLoading(false);
    }
};

    if (loading) {
        return <div className="loading">Cargando datos del cliente...</div>;
    }

    if (!cliente) {
        return <div className="error">Cliente no encontrado</div>;
    }

    return (
        <div className="detalle-cliente-container">
            <div className="page-header">
                <h1>Detalle del Cliente</h1>
                <button onClick={() => navigate('/clientes')} className="btn-volver">
                    ← Volver a la lista
                </button>
            </div>

            <div className="cliente-info">
                {/* Información personal */}
                <div className="info-card">
                    <h3>Información Personal</h3>
                    <div className="info-row">
                        <div className="info-label">Nombre completo:</div>
                        <div className="info-value">
                            {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno || ''}
                        </div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Email:</div>
                        <div className="info-value">{cliente.email || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Teléfono:</div>
                        <div className="info-value">{cliente.telefono || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Celular:</div>
                        <div className="info-value">{cliente.celular || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">RFC:</div>
                        <div className="info-value">{cliente.rfc || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">CURP:</div>
                        <div className="info-value">{cliente.curp || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Fecha de nacimiento:</div>
                        <div className="info-value">
                            {cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString() : 'No registrada'}
                        </div>
                    </div>
                </div>

                {/* Dirección */}
                <div className="info-card">
                    <h3>Dirección</h3>
                    <div className="info-row">
                        <div className="info-label">Calle:</div>
                        <div className="info-value">{cliente.calle || 'No registrada'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Número:</div>
                        <div className="info-value">
                            Ext: {cliente.numero_exterior || 'S/N'} 
                            {cliente.numero_interior && ` Int: ${cliente.numero_interior}`}
                        </div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Colonia:</div>
                        <div className="info-value">{cliente.asentamiento || 'No registrada'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Municipio:</div>
                        <div className="info-value">{cliente.municipio || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Estado:</div>
                        <div className="info-value">{cliente.estado || 'No registrado'}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Código Postal:</div>
                        <div className="info-value">{cliente.codigo_postal || 'No registrado'}</div>
                    </div>
                    {cliente.referencias && (
                        <div className="info-row">
                            <div className="info-label">Referencias:</div>
                            <div className="info-value">{cliente.referencias}</div>
                        </div>
                    )}
                </div>

                {/* Datos comerciales */}
                <div className="info-card">
                    <h3>Datos Comerciales</h3>
                    <div className="info-row">
                        <div className="info-label">Tipo de cliente:</div>
                        <div className="info-value">
                            <span className="tipo-badge">{cliente.nombre_tipo}</span>
                        </div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Descuento base:</div>
                        <div className="info-value">{cliente.descuento_base}%</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Descuento extra:</div>
                        <div className="info-value">{cliente.factor_descuento_extra || 0}%</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Total en compras:</div>
                        <div className="info-value">${Number(cliente.total_compras || 0).toLocaleString()}</div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">Crédito autorizado:</div>
                        <div className="info-value">{cliente.credito_autorizado ? 'Sí' : 'No'}</div>
                    </div>
                    {cliente.credito_autorizado && (
                        <div className="info-row">
                            <div className="info-label">Límite de crédito:</div>
                            <div className="info-value">${Number(cliente.limite_credito || 0).toLocaleString()}</div>
                        </div>
                    )}
                    <div className="info-row">
                        <div className="info-label">Fecha de registro:</div>
                        <div className="info-value">
                            {new Date(cliente.fecha_registro).toLocaleDateString()}
                        </div>
                    </div>
                    {cliente.ultima_compra && (
                        <div className="info-row">
                            <div className="info-label">Última compra:</div>
                            <div className="info-value">
                                {new Date(cliente.ultima_compra).toLocaleDateString()}
                            </div>
                        </div>
                    )}
                    <div className="info-row">
                        <div className="info-label">Estado:</div>
                        <div className="info-value">
                            <span className={`estado-badge ${cliente.activo ? 'activo' : 'inactivo'}`}>
                                {cliente.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="acciones-card">
                    <button onClick={() => navigate(`/clientes/${id}/editar`)} className="btn-editar">
                        Editar Cliente
                    </button>
                    <button onClick={() => navigate('/ventas/nueva', { state: { id_cliente: id }})} className="btn-venta">
                        Registrar Venta
                    </button>
                </div>
            </div>

            <style jsx>{`
                .detalle-cliente-container {
                    padding: 20px;
                    max-width: 1000px;
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
                .info-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .info-card h3 {
                    margin: 0 0 15px 0;
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 5px;
                    display: inline-block;
                }
                .info-row {
                    display: flex;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .info-label {
                    width: 180px;
                    font-weight: 600;
                    color: #555;
                }
                .info-value {
                    flex: 1;
                    color: #333;
                }
                .tipo-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    background: #007bff;
                    color: white;
                    border-radius: 3px;
                    font-size: 12px;
                }
                .estado-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                }
                .estado-badge.activo {
                    background: #28a745;
                    color: white;
                }
                .estado-badge.inactivo {
                    background: #dc3545;
                    color: white;
                }
                .acciones-card {
                    display: flex;
                    gap: 15px;
                    justify-content: flex-end;
                    padding: 20px;
                }
                .btn-editar {
                    padding: 10px 20px;
                    background: #ffc107;
                    color: #333;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn-venta {
                    padding: 10px 20px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    font-size: 18px;
                    color: #666;
                }
                .error {
                    text-align: center;
                    padding: 40px;
                    font-size: 18px;
                    color: #dc3545;
                }
            `}</style>
        </div>
    );
};

export default DetalleCliente;