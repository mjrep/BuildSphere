import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import axios from 'axios';

/**
 * Native relative time formatter to avoid external dependencies like date-fns
 */
const getRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000); // in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
};

export default function NotificationBell({ user }) {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        if (!user) return;

        // 1. Initial Fetch
        fetchNotifications();

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'notifications', 
                    filter: `user_id=eq.${user.id}` 
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        setIsOpen(false);
        if (!notif.is_read) {
            try {
                await axios.patch(`/api/notifications/${notif.id}/read`);
                // Update local state immediately
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error('Failed to mark notification as read', err);
            }
        }
        
        if (notif.reference_url) {
            navigate(notif.reference_url);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const getIconByType = (type) => {
        switch (type) {
            case 'success': return 'text-emerald-500 bg-emerald-50';
            case 'warning': return 'text-orange-500 bg-orange-50';
            case 'error': return 'text-red-500 bg-red-50';
            default: return 'text-[#706BFF] bg-[#E8E8FF]';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-200 ${isOpen ? 'bg-[#E8E8FF] text-[#706BFF]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-[#F0F0F8] overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-5 py-4 border-b border-[#F0F0F8] flex items-center justify-between bg-gray-50/50">
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Notifications</h4>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold text-[#706BFF] hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-400 font-medium italic">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full px-5 py-4 text-left border-b border-[#F0F0F8] last:border-0 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-[#F9F9FF]' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${getIconByType(notif.type)}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`text-xs font-bold leading-tight ${!notif.is_read ? 'text-[#1A1A1A]' : 'text-gray-600'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[9px] text-gray-400 whitespace-nowrap font-medium mt-0.5">
                                                {getRelativeTime(notif.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-normal">
                                            {notif.message}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-[#F0F0F8] bg-gray-50/50 text-center">
                        <button className="text-[10px] font-bold text-gray-400 hover:text-[#706BFF] transition-colors uppercase tracking-widest">
                            View All Activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
