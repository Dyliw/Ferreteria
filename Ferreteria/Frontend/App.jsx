import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import InventarioLayout from './pages/Inventario/inventarioPage';
import Layout from './components/common/Layout';
// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages//Dashboard/Dashboard';

// Clientes
import ClientesList from './pages/Clientes/ClientesList';
import ClienteFormPage from './pages/Clientes/ClienteFormPage';
import ClienteDetail from './pages/Clientes/DetalleCliente';

// Empleados
import EmpleadosList from './pages/Empleados/EmpleadosList';
import EmpleadoFormPage from './pages/Empleados/EmpleadoFormPage';
import EmpleadoDetail from './pages/Empleados/EmpleadoDetalle';

// Usuarios
import UsuariosList from './pages/Usuarios/UsuariosList';
import DetalleCliente from './pages/Clientes/DetalleCliente';
//import UsuarioFormPage from './pages/Usuarios/UsuarioFormPage';

import ProductosPage from './pages/Productos/ProductoPage';
import VentasPage from './pages/Ventas/VentasPage';
import RegistroVenta from './pages/Ventas/RegistroVenta';
import DetalleVenta from './pages/Ventas/DetalleVenta';

// Pedidos
import PedidosList from './pages/Pedidos/PedidosList';
import CrearPedido from './pages/Pedidos/CrearPedido';
import PedidoDetalle from './pages/Pedidos/PedidoDetalle';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAdmin } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Clientes */}
        <Route path="clientes">
          <Route index element={<ClientesList />} />
          <Route path="nuevo" element={<ClienteFormPage />} />
          <Route path=":id" element={<DetalleCliente />} />
          <Route path=":id/editar" element={<ClienteFormPage />} />
        </Route>
        
        {/* Empleados - Solo Admin */}
        <Route path="empleados">
          <Route index element={isAdmin() ? <EmpleadosList /> : <Navigate to="/dashboard" />} />
          <Route path="nuevo" element={isAdmin() ? <EmpleadoFormPage /> : <Navigate to="/dashboard" />} />
          <Route path=":id/editar" element={isAdmin() ? <EmpleadoFormPage /> : <Navigate to="/dashboard" />} />
          <Route path=":id" element={isAdmin() ? <EmpleadoDetail /> : <Navigate to="/dashboard" />} />
          
        </Route>
        
        {/* Usuarios - Solo Admin */}
        <Route path="usuarios">
          <Route index element={isAdmin() ? <UsuariosList /> : <Navigate to="/dashboard" />} />
          {/*<Route path="nuevo" element={isAdmin() ? <UsuarioFormPage /> : <Navigate to="/dashboard" />} /> */}
        </Route>
        <Route path="productos" element={<ProductosPage/>}></Route>
            {/* Tus otras rutas */}
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/ventas/nueva" element={<RegistroVenta />} />
            <Route path="/ventas/:id" element={<DetalleVenta />} />
            
            {/* Ruta por defecto */}
            <Route path="*" element={<div>404 - No encontrado</div>} />
        <Route path="inventario" element={<InventarioLayout />} /> 
        {/* Pedidos */}
        <Route path="/pedidos" element={<PedidosList />} />
        <Route path="/pedidos/nuevo" element={<CrearPedido />} />
        <Route path="/pedidos/:id" element={<PedidoDetalle />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;