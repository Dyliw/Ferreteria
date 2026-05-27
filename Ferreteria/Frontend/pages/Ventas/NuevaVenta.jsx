import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ventasAPI } from '../../api/ventasAPI';
import { productosAPI } from '../../api/productosAPI';
import { clientesAPI } from '../../api/clientesAPI';

const NuevaVenta = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [formData, setFormData] = useState({
        id_cliente: '',
        id_metodo_pago: '1',
        flete: 0,
        seguro_descarga: 0,
        observaciones: '',
        detalle: [{ id_producto: '', cantidad: 1, descuento_linea: 0 }]
    });
    const [preciosProductos, setPreciosProductos] = useState({});
    
    useEffect(() => {
        cargarDatos();
    }, []);
    
    const cargarDatos = async () => {
        try {
            const [productosRes, clientesRes] = await Promise.all([
                productosAPI.getAll({ activo: true }),
                clientesAPI.getAll()
            ]);
            setProductos(productosRes.data.productos || []);
            setClientes(clientesRes.data.clientes || []);
            
            // Crear mapa de precios
            const preciosMap = {};
            (productosRes.data.productos || []).forEach(p => {
                preciosMap[p.id_producto] = p.precio_base;
            });
            setPreciosProductos(preciosMap);
        } catch (error) {
            toast.error('Error al cargar datos');
        }
    };
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    
    const handleDetalleChange = (index, field, value) => {
        const newDetalle = [...formData.detalle];
        newDetalle[index][field] = field === 'cantidad' ? parseInt(value) || 0 : value;
        setFormData({ ...formData, detalle: newDetalle });
    };
    
    const agregarProducto = () => {
        setFormData({
            ...formData,
            detalle: [...formData.detalle, { id_producto: '', cantidad: 1, descuento_linea: 0 }]
        });
    };
    
    const eliminarProducto = (index) => {
        const newDetalle = formData.detalle.filter((_, i) => i !== index);
        setFormData({ ...formData, detalle: newDetalle });
    };
    
    const calcularSubtotalLinea = (item) => {
        const precio = preciosProductos[item.id_producto] || 0;
        const subtotal = precio * item.cantidad;
        return subtotal - (item.descuento_linea || 0);
    };
    
    const calcularTotal = () => {
        let subtotal = 0;
        formData.detalle.forEach(item => {
            subtotal += calcularSubtotalLinea(item);
        });
        const iva = subtotal * 0.16;
        const total = subtotal + iva + (parseFloat(formData.flete) || 0) + (parseFloat(formData.seguro_descarga) || 0);
        return { subtotal, iva, total };
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.id_cliente) {
            toast.error('Seleccione un cliente');
            return;
        }
        
        const detalleValido = formData.detalle.every(item => item.id_producto && item.cantidad > 0);
        if (!detalleValido) {
            toast.error('Complete todos los productos correctamente');
            return;
        }
        
        setLoading(true);
        
        try {
            const empleadoId = localStorage.getItem('empleadoId') || 1;
            
            const ventaData = {
                id_cliente: parseInt(formData.id_cliente),
                id_empleado: parseInt(empleadoId),
                id_metodo_pago: parseInt(formData.id_metodo_pago),
                detalle: formData.detalle.map(item => ({
                    id_producto: parseInt(item.id_producto),
                    cantidad: item.cantidad,
                    descuento_linea: parseFloat(item.descuento_linea) || 0
                })),
                flete: parseFloat(formData.flete) || 0,
                seguro_descarga: parseFloat(formData.seguro_descarga) || 0,
                observaciones: formData.observaciones
            };
            
            const response = await ventasAPI.create(ventaData);
            
            if (response.data.success) {
                toast.success('Venta registrada exitosamente');
                navigate(`/ventas/${response.data.id_venta}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al registrar venta');
        } finally {
            setLoading(false);
        }
    };
    
    const { subtotal, iva, total } = calcularTotal();
    
    return (
        <div className="nueva-venta-container">
            <div className="page-header">
                <h1>Nueva Venta</h1>
                <button className="btn-secondary" onClick={() => navigate('/ventas')}>
                    Cancelar
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="venta-form">
                <div className="form-sections">
                    {/* Sección de datos generales */}
                    <div className="form-section">
                        <h2>Datos de la Venta</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Cliente *</label>
                                <select
                                    value={formData.id_cliente}
                                    onChange={(e) => setFormData({ ...formData, id_cliente: e.target.value })}
                                    className="input-field"
                                    required
                                    >
                                    <option value="">Seleccionar cliente...</option>
                                    {clientes.map(c => (
                                        <option key={c.id_cliente} value={c.id_cliente}>  {/* ✅ AGREGAR KEY */}
                                        {c.nombre_completo} - {c.nombre_tipo}
                                        </option>
                                    ))}
                                    </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Método de Pago *</label>
                                <select
                                    name="id_metodo_pago"
                                    value={formData.id_metodo_pago}
                                    onChange={handleChange}
                                >
                                    <option value="1">Efectivo</option>
                                    <option value="2">Transferencia</option>
                                    <option value="3">Tarjeta de Crédito</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Flete ($)</label>
                                <input
                                    type="number"
                                    name="flete"
                                    value={formData.flete}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Seguro/Descarga ($)</label>
                                <input
                                    type="number"
                                    name="seguro_descarga"
                                    value={formData.seguro_descarga}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Observaciones</label>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows="2"
                            />
                        </div>
                    </div>
                    
                    {/* Sección de productos */}
                    <div className="form-section">
                        <div className="section-header">
                            <h2>Productos</h2>
                            <button type="button" className="btn-add" onClick={agregarProducto}>
                                + Agregar Producto
                            </button>
                        </div>
                        
                        <div className="productos-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unit.</th>
                                        <th>Descuento</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.detalle.map((item, index) => {
                                        const precio = preciosProductos[item.id_producto] || 0;
                                        const subtotalLinea = calcularSubtotalLinea(item);
                                        
                                        return (
                                            <tr key={index}>
                                                <td>
                                                    <select
                                                        value={item.id_producto}
                                                        onChange={(e) => handleDetalleChange(index, 'id_producto', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Seleccionar</option>
                                                        {productos.map(p => (
                                                            <option key={p.id_producto} value={p.id_producto}>
                                                                {p.nombre_producto} - ${p.precio_base}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                                        min="1"
                                                        required
                                                    />
                                                </td>
                                                <td>${precio.toFixed(2)}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.descuento_linea}
                                                        onChange={(e) => handleDetalleChange(index, 'descuento_linea', e.target.value)}
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="subtotal">${subtotalLinea.toFixed(2)}</td>
                                                <td>
                                                    <button 
                                                        type="button" 
                                                        className="btn-remove"
                                                        onClick={() => eliminarProducto(index)}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Resumen */}
                    <div className="form-section resumen">
                        <h2>Resumen</h2>
                        <div className="resumen-line">
                            <span>Subtotal:</span>
                            <strong>${subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="resumen-line">
                            <span>IVA (16%):</span>
                            <strong>${iva.toFixed(2)}</strong>
                        </div>
                        {formData.flete > 0 && (
                            <div className="resumen-line">
                                <span>Flete:</span>
                                <strong>${parseFloat(formData.flete).toFixed(2)}</strong>
                            </div>
                        )}
                        {formData.seguro_descarga > 0 && (
                            <div className="resumen-line">
                                <span>Seguro/Descarga:</span>
                                <strong>${parseFloat(formData.seguro_descarga).toFixed(2)}</strong>
                            </div>
                        )}
                        <div className="resumen-line total">
                            <span>TOTAL:</span>
                            <strong>${total.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                
                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/ventas')}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar Venta'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NuevaVenta;