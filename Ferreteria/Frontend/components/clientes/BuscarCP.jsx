import React, { useState } from 'react';
import { clientesAPI } from '../../api/clientesAPI';
import toast from 'react-hot-toast';

const BuscarCP = ({ onDireccionFound, onClear }) => {
    const [cp, setCp] = useState('');
    const [loading, setLoading] = useState(false);
    const [direccion, setDireccion] = useState(null);

    const handleBuscar = async () => {
        if (!cp || cp.length !== 5) {
            toast.error('Ingresa un código postal válido de 5 dígitos');
            return;
        }

        setLoading(true);
        try {
            const response = await clientesAPI.buscarCP(cp);
            
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                setDireccion(data);
                
                // Formatear dirección completa
                const direccionCompleta = {
                    id_codigo_postal: data.idcp,
                    cp: data.cp,
                    asentamiento: data.asentamiento,
                    tipo_asentamiento: data.tipo_asentamiento,
                    municipio: data.municipio,
                    estado: data.estado,
                    zona: data.zona,
                    direccion_completa: `${data.tipo_asentamiento} ${data.asentamiento}, ${data.municipio}, ${data.estado}, CP ${data.cp}`
                };
                
                onDireccionFound(direccionCompleta);
                toast.success('Código postal encontrado');
            }
        } catch (error) {
            console.error('Error al buscar CP:', error);
            toast.error('Código postal no encontrado');
            setDireccion(null);
            onClear();
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setCp('');
        setDireccion(null);
        onClear();
    };

    return (
        <div className="buscar-cp-container">
            <div className="cp-input-group">
                <label>Código Postal *</label>
                <div className="input-with-button">
                    <input
                        type="text"
                        maxLength="5"
                        value={cp}
                        onChange={(e) => setCp(e.target.value)}
                        placeholder="Ej: 25010"
                        className="cp-input"
                    />
                    <button 
                        type="button" 
                        onClick={handleBuscar}
                        disabled={loading}
                        className="btn-buscar"
                    >
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                    {direccion && (
                        <button 
                            type="button" 
                            onClick={handleClear}
                            className="btn-clear"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {direccion && (
                <div className="direccion-info">
                    <div className="info-card">
                        <h4>Dirección encontrada:</h4>
                        <p><strong>{direccion.tipo_asentamiento}:</strong> {direccion.asentamiento}</p>
                        <p><strong>Municipio:</strong> {direccion.municipio}</p>
                        <p><strong>Estado:</strong> {direccion.estado}</p>
                        <p><strong>Zona:</strong> {direccion.zona}</p>
                    </div>
                </div>
            )}

            <style jsx>{`
                .buscar-cp-container {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .cp-input-group {
                    margin-bottom: 10px;
                }
                .cp-input-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                }
                .input-with-button {
                    display: flex;
                    gap: 10px;
                }
                .cp-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                }
                .btn-buscar {
                    padding: 8px 20px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn-buscar:hover {
                    background: #0056b3;
                }
                .btn-clear {
                    padding: 8px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn-clear:hover {
                    background: #545b62;
                }
                .direccion-info {
                    margin-top: 15px;
                }
                .info-card {
                    background: white;
                    padding: 15px;
                    border-radius: 4px;
                    border-left: 4px solid #28a745;
                }
                .info-card h4 {
                    margin: 0 0 10px 0;
                    color: #28a745;
                }
                .info-card p {
                    margin: 5px 0;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
};

export default BuscarCP;