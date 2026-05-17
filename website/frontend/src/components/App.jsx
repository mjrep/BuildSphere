import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from '../routes/AppRoutes';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Toaster position="top-right" />
                <AppRoutes />
            </AuthProvider>
        </ThemeProvider>
    );
}