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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />

            {/* Right side: Header + Content */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full relative">
                <Header 
                    pageTitle={pageTitle} 
                    user={user} 
                    loading={loading} 
                    scrolled={scrolled} 
                    onMenuToggle={() => setIsSidebarOpen(true)}
                />
                <main 
                    id="main-scroll-container"
                    onScroll={handleScroll}
                    className={`flex-1 overflow-y-auto overflow-x-hidden bg-bg-primary ${noPadding ? 'p-0' : 'p-4 md:p-6'}`}
                >
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
