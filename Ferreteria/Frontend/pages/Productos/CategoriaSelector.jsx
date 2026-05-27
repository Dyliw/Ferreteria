import { useState, useEffect } from 'react';
import productoService from '../../api/productosAPI';

const CategoriaSelector = ({ value, onChange, error }) => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewCategoria, setShowNewCategoria] = useState(false);
    const [newCategoria, setNewCategoria] = useState('');
    const [newDescripcion, setNewDescripcion] = useState('');
    const [creando, setCreando] = useState(false);

    useEffect(() => {
        cargarCategorias();
    }, []);
    const cargarCategorias = async () => {
        try {
            setLoading(true);
            const response = await productoService.getAllCategories();
            setCategorias(response.data || []);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleCrearCategoria = async () => {
        if (!newCategoria.trim()) return;
        
        try {
            setCreando(true);
            const response = await productoService.createCategory({
                nombre_categoria: newCategoria,
                descripcion: newDescripcion
            });
            
            if (response.success) {
                setCategorias([...categorias, response.data]);
              
                onChange(response.data.id_categoria);
                
                setNewCategoria('');
                setNewDescripcion('');
                setShowNewCategoria(false);
            } else {
                alert(response.message || 'Error al crear la categoría');
            }
            
        } catch (error) {
            console.error('Error creando categoría:', error);
            alert(error.response?.data?.message || 'Error al crear la categoría');
        } finally {
            setCreando(false);
        }
    };

    if (loading) {
        return (
            <select disabled className="w-full p-2 border rounded bg-gray-100">
                <option>Cargando categorías...</option>
            </select>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`flex-1 p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <option value="">Seleccionar categoría</option>
                    {categorias
                        .filter(c => c.activo !== 0)
                        .map(cat => (
                            <option key={cat.id_categoria} value={cat.id_categoria}>
                                {cat.nombre_categoria} ({cat.total_productos || 0} productos)
                            </option>
                        ))}
                </select>
                
                <button
                    type="button"
                    onClick={() => setShowNewCategoria(!showNewCategoria)}
                    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    title="Crear nueva categoría"
                >
                    +
                </button>
            </div>
            
            {showNewCategoria && (
                <div className="p-3 border rounded bg-gray-50 space-y-2">
                    <input
                        type="text"
                        placeholder="Nueva categoría *"
                        value={newCategoria}
                        onChange={(e) => setNewCategoria(e.target.value)}
                        className="w-full p-2 border rounded"
                        autoFocus
                    />
                    <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={newDescripcion}
                        onChange={(e) => setNewDescripcion(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleCrearCategoria}
                            disabled={creando || !newCategoria.trim()}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {creando ? 'Creando...' : 'Crear categoría'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowNewCategoria(false);
                                setNewCategoria('');
                                setNewDescripcion('');
                            }}
                            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};

export default CategoriaSelector;