import React from 'react';

export default function InventorySuccessModal({ message, onClose }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-[#706BFF] rounded-full flex items-center justify-center shadow-lg shadow-[#706BFF]/30 mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{message}</h3>
                <p className="text-sm text-gray-500 mb-8 text-center">{message.replace('!', '')} to the inventory.</p>
                
                <button
                    onClick={onClose}
                    className="w-full py-2.5 text-sm font-bold text-white bg-[#706BFF] hover:bg-[#5B55E6] rounded-xl transition-colors"
                >
                    Back to Inventory
                </button>
            </div>
        </div>
    );
}
