import React, { useState, useEffect } from 'react';
import { clientesAPI } from '../../api/clientesAPI';

const TipoClienteSelect = ({ value, onChange, required = false }) => {
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarTipos();
    }, []);

    const cargarTipos = async () => {
        try {
            const response = await clientesAPI.getTipos();
            if (response.data.success) {
                setTipos(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar tipos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <select disabled><option>Cargando tipos...</option></select>;
    }

    return (
        <select value={value} onChange={onChange} required={required}>
            <option value="">Seleccionar tipo de cliente</option>
            {tipos.map(tipo => (
                <option key={tipo.id_tipo_cliente} value={tipo.id_tipo_cliente}>
                    {tipo.nombre_tipo} - Descuento: {tipo.descuento_base}%
                </option>
            ))}
        </select>
    );
};

export default TipoClienteSelect;