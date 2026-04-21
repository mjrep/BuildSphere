import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function InventoryActionsDropdown({ item, onEdit, onUpdateStock, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position it to the left and slightly below the button
            // To match the BuildSphere premium feel, we position it fixed relative to viewport
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
                top: `${coords.top - window.scrollY}px`, 
                left: `${coords.left - window.scrollX - 180}px`, // 180 is roughly the width of the dropdown
                zIndex: 9999
            }}
            className="w-48 rounded-[1.25rem] shadow-2xl shadow-black/20 bg-white ring-1 ring-black ring-opacity-5 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="px-3 pb-1 border-b border-[#F0F0F8] mb-1">
                <span className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-wider">Item Actions</span>
            </div>
            
            <button
                onClick={() => {
                    setIsOpen(false);
                    onEdit(item);
                }}
                className="w-[calc(100%-8px)] mx-1 flex items-center gap-3 px-3 py-2 text-sm text-[#1A1A1A] hover:bg-gray-50 rounded-xl transition-colors font-semibold group"
            >
                <div className="w-7 h-7 bg-gray-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#A1A1A1] group-hover:text-[#706BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
                Edit Item
            </button>
            
            <button
                onClick={() => {
                    setIsOpen(false);
                    onUpdateStock(item);
                }}
                className="w-[calc(100%-8px)] mx-1 flex items-center gap-3 px-3 py-2 text-sm text-[#706BFF] hover:bg-indigo-50 rounded-xl transition-colors font-semibold group"
            >
                <div className="w-7 h-7 bg-indigo-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#706BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                Update Stock
            </button>

            <div className="mx-3 my-1 border-t border-[#F0F0F8]" />

            <button
                onClick={() => {
                    setIsOpen(false);
                    onDelete(item);
                }}
                className="w-[calc(100%-8px)] mx-1 flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold group"
            >
                <div className="w-7 h-7 bg-red-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                Remove Item
            </button>
        </div>
    );

    return (
        <div className="relative inline-block text-left">
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={`p-1 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all duration-200 ${isOpen ? 'bg-gray-100 text-[#706BFF]' : 'text-[#A1A1A1] hover:text-[#6B6B6B]'}`}
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
            </button>

            {isOpen && createPortal(MenuContent, document.body)}
        </div>
    );
}
