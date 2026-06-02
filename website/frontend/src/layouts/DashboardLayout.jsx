import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/header/Header';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

export default function DashboardLayout({ children, pageTitle, noPadding = false }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    const handleScroll = (e) => {
        setScrolled(e.target.scrollTop > 10);
    };

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            // ignore
        }
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-bg-secondary overflow-hidden transition-colors duration-200">
            {/* Sidebar */}
            <Sidebar onLogout={handleLogout} />

            {/* Right side: Header + Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header pageTitle={pageTitle} user={user} loading={loading} scrolled={scrolled} />
                <main 
                    onScroll={handleScroll}
                    className={`flex-1 overflow-y-auto bg-bg-primary ${noPadding ? 'p-0' : 'p-6'}`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
