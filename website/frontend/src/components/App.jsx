import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from '../routes/AppRoutes';
import { AuthProvider } from '../context/AuthContext';

export default function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" />
            <AppRoutes />
        </AuthProvider>
    );
}