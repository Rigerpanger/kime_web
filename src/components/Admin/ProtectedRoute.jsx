import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const ProtectedRoute = () => {
    const { session, loading, initializeAuth } = useAuthStore();

    useEffect(() => {
        // Just in case authentication hasn't been initialized yet
        if (loading) {
            initializeAuth();
        }
    }, [loading, initializeAuth]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-[1px] bg-white animate-pulse" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
