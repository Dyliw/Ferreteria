import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ roles = [] }) => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Verificar roles si se especificaron
    if (roles.length > 0 && !roles.includes(user?.rol)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <Outlet />;
};

export default PrivateRoute;