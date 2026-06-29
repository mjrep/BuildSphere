import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import useAuth from '../../hooks/useAuth';

const navItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: (
            <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="2" fill="#8b5cf6" />
                <rect x="14" y="3" width="7" height="7" rx="2" fill="#ec4899" />
                <rect x="3" y="14" width="7" height="7" rx="2" fill="#10b981" />
                <rect x="14" y="14" width="7" height="7" rx="2" fill="#f59e0b" />
            </svg>
        ),
    },
    {
        label: 'Projects',
        to: '/projects',
        excludeRoles: ['Staff'],
        icon: (
            <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#8b5cf6" />
                <path d="M2 12L12 17L22 12L17 9.5L12 12L7 9.5L2 12Z" fill="#10b981" />
                <path d="M2 17L12 22L22 17L17 14.5L12 17L7 14.5L2 17Z" fill="#3b82f6" />
            </svg>
        ),
    },
    {
        label: 'Tasks',
        to: '/tasks',
        icon: (
            <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#e0f2fe" />
                <circle cx="8" cy="9" r="2.5" fill="#10b981" />
                <rect x="12" y="8" width="6" height="2" rx="1" fill="#64748b" />
                <circle cx="8" cy="15" r="2.5" fill="#f59e0b" />
                <rect x="12" y="14" width="6" height="2" rx="1" fill="#64748b" />
            </svg>
        ),
    },
    {
        label: 'Reports',
        to: '/reports',
        roles: ['CEO', 'COO', 'Project Coordinator', 'Project Engineer'],
        icon: (
            <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="14" width="4" height="6" rx="1" fill="#f59e0b" />
                <rect x="10" y="9" width="4" height="11" rx="1" fill="#f43f5e" />
                <rect x="16" y="4" width="4" height="16" rx="1" fill="#3b82f6" />
            </svg>
        ),
    },
    {
        label: 'Personnel',
        to: '/personnel',
        roles: ['CEO', 'COO', 'HR'],
        icon: (
            <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="7" r="3" fill="#ec4899" />
                <path d="M16 11C18.6667 11 22 12.3333 22 15V17H10V15C10 12.3333 13.3333 11 16 11Z" fill="#ec4899" />
                <circle cx="9" cy="10" r="4" fill="#3b82f6" />
                <path d="M9 15C5.66667 15 2 16.6667 2 20V22H16V20C16 16.6667 12.3333 15 9 15Z" fill="#3b82f6" />
            </svg>
        ),
    },
];

export default function Sidebar({ isOpen, setIsOpen, onLogout }) {
    const { user } = useAuth();

    const filteredItems = navItems.filter(item => {
        if (item.excludeRoles && item.excludeRoles.includes(user?.role)) return false;
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
    });

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-bg-secondary border-r border-border-primary shadow-sm h-full shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo */}
            <Link to="/dashboard" className="h-[81px] flex items-center gap-3 px-6 border-b border-border-primary hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-center">
                    <img src={logo} alt="BS" className="w-8 h-8 object-contain" />
                </div>
                <span className="font-bold text-text-primary text-lg tracking-tight">BuildSphere</span>
            </Link>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                    ? 'bg-accent text-white shadow-sm'
                                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                            }`
                        }
                    >
                        <span className="shrink-0">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-6">
                <div className="h-px bg-border-primary mx-3 mb-4" />
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                </button>
            </div>
        </aside>
    );
}
