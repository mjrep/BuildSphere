import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UpdateStockModal({ project, item, onClose, onSuccess }) {
    const [currentStock, setCurrentStock] = useState(item.current_stock || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.patch(`/api/projects/${project.id}/inventory/${item.id}/stock`, {
                current_stock: currentStock
            });
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update stock');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <h3 className="text-lg font-bold text-center text-[#706BFF] pt-6 pb-2 border-b border-[#F0F0F8]">Update Stock</h3>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Item Name</label>
                        <input 
                            value={item.item_name}
                            disabled
                            type="text"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Current Stock</label>
                        <div className="relative">
                            <input 
                                value={currentStock}
                                onChange={(e) => setCurrentStock(e.target.value)}
                                required
                                type="number"
                                min="0"
                                step="any"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF] focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 text-sm font-bold text-white bg-[#706BFF] hover:bg-[#5B55E6] rounded-xl transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
