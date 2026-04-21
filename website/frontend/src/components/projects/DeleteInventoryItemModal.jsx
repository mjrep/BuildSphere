import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function DeleteInventoryItemModal({ project, item, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            await axios.delete(`/api/projects/${project.id}/inventory/${item.id}`);
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete item');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                {/* Warning Icon */}
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 text-center">Delete this item?</h3>
                <p className="text-sm text-gray-500 mb-8 text-center px-4">
                    Are you sure you want to delete <span className="font-bold text-[#1A1A1A]">"{item.item_name}"</span>? This action cannot be undone.
                </p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={submitting}
                        className="py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-colors shadow-lg shadow-red-200 disabled:opacity-50"
                    >
                        {submitting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
