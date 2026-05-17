import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function Header({ pageTitle, user, loading }) {
    const { theme, toggleTheme } = useTheme();
    const initials = user
        ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
        : '';

    return (
        <header className="flex items-center justify-between bg-bg-primary px-8 py-5 shrink-0 transition-colors duration-200">
            {/* Page title */}
            <h1 className="text-2xl font-black text-text-primary tracking-tight">{pageTitle}</h1>

            {/* Clickable user section → /profile */}
            {loading ? (
                /* Skeleton while user data loads */
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-bg-secondary" />
                    <div className="hidden sm:flex flex-col items-end gap-1.5">
                        <div className="h-3 w-24 bg-bg-secondary rounded-full" />
                        <div className="h-2.5 w-16 bg-bg-secondary rounded-full" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-bg-secondary" />
                </div>
            ) : (
                <div className="flex items-center gap-3 sm:gap-6">
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all duration-300 text-text-secondary hover:text-text-primary active:scale-95 shadow-sm"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Moon size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
                    </button>

                    <NotificationBell user={user} />
                    
                    <div className="w-px h-8 bg-border-primary/50 mx-2 hidden sm:block" />

                    <Link
                        to="/profile"
                        className="flex items-center gap-4 hover:opacity-80 transition-all active:scale-98 group"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                                {user ? `${user.first_name} ${user.last_name}` : ''}
                            </p>
                            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{user?.role ?? ''}</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center text-white text-sm font-black shadow-[0_4px_12px_rgba(124,116,255,0.3)] group-hover:shadow-[0_4px_15px_rgba(124,116,255,0.5)] transition-all">
                            {initials}
                        </div>
                    </Link>
                </div>
            )}
        </header>
    );
}
