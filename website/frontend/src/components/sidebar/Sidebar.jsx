import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import useAuth from '../../hooks/useAuth';

const navItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        label: 'Projects',
        to: '/projects',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
    {
        label: 'Tasks',
        to: '/tasks',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
    },
    {
        label: 'Reports',
        to: '/reports',
        roles: ['CEO', 'COO', 'Project Coordinator', 'Accounting', 'Project Engineer'],
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        label: 'Personnel',
        to: '/personnel',
        roles: ['CEO', 'COO', 'HR'],
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
];

export default function Sidebar({ onLogout }) {
    const { user } = useAuth();

    const filteredItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
    });

    return (
        <aside className="w-64 flex flex-col bg-bg-secondary border-r border-border-primary shadow-sm h-full shrink-0 transition-colors duration-200">
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
