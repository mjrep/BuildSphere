import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function TaskActionsDropdown({ task, onView, onEdit, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        const handleScrollResize = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScrollResize, true);
            window.addEventListener('resize', handleScrollResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollResize, true);
            window.removeEventListener('resize', handleScrollResize);
        };
    }, [isOpen]);

    const MenuContent = (
        <div 
            ref={dropdownRef}
            style={{ 
                position: 'fixed', 
                top: `${coords.top - window.scrollY + 5}px`, 
                left: `${coords.left - window.scrollX - 160}px`, 
                zIndex: 9999
            }}
            className="w-44 rounded-2xl shadow-2xl shadow-black/10 bg-white ring-1 ring-black ring-opacity-5 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={e => e.stopPropagation()}
        >
            <div className="px-4 py-1.5 border-b border-[#F0F0F8] mb-1">
                <span className="text-[10px] font-bold text-[#9090A8] uppercase tracking-wider">Actions</span>
            </div>
            
            <button
                onClick={() => {
                    setIsOpen(false);
                    onView(task);
                }}
                className="w-[calc(100%-16px)] mx-2 flex items-center gap-3 px-3 py-2 text-xs text-[#3A3A5C] hover:bg-[#F8F8FF] rounded-xl transition-colors font-semibold group"
            >
                <svg className="w-4 h-4 text-[#9090A8] group-hover:text-[#5B5BD6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
            </button>
            
            <button
                onClick={() => {
                    setIsOpen(false);
                    onEdit(task);
                }}
                className="w-[calc(100%-16px)] mx-2 flex items-center gap-3 px-3 py-2 text-xs text-[#3A3A5C] hover:bg-[#F8F8FF] rounded-xl transition-colors font-semibold group"
            >
                <svg className="w-4 h-4 text-[#9090A8] group-hover:text-[#5B5BD6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Task
            </button>

            <div className="mx-3 my-1 border-t border-[#F0F0F8]" />

            <button
                onClick={() => {
                    if (window.confirm('Are you sure you want to delete this task?')) {
                        setIsOpen(false);
                        onDelete(task.id);
                    }
                }}
                className="w-[calc(100%-16px)] mx-2 flex items-center gap-3 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold group"
            >
                <svg className="w-4 h-4 text-red-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Task
            </button>
        </div>
    );

    return (
        <div className="relative inline-block text-left">
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={`p-1.5 rounded-lg transition-all duration-200 ${isOpen ? 'bg-[#F0F0F8] text-[#5B5BD6]' : 'text-[#9090A8] hover:bg-[#F0F0F8] hover:text-[#3A3A5C]'}`}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {isOpen && createPortal(MenuContent, document.body)}
        </div>
    );
}
