const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const productosRoutes = require('./routes/productosRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes); 
const { verificarToken } = require('./middleware/authMiddleware');
app.use('/api/clientes', verificarToken);
app.use('/api/empleados', verificarToken);
app.use('/api/usuarios', verificarToken);
app.use('/api/productos', productosRoutes); 
app.use('/api/ventas', ventaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);  

module.exports = app;