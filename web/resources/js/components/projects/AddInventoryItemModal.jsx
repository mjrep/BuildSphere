import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AddInventoryItemModal({ project, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        item_name: '',
        category: 'materials',
        critical_level: '',
        price: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`/api/projects/${project.id}/inventory`, formData);
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add item');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <h3 className="text-lg font-bold text-center text-[#706BFF] pt-6 pb-2 border-b border-[#F0F0F8]">Add a new item</h3>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Item Name</label>
                        <input 
                            name="item_name"
                            value={formData.item_name}
                            onChange={handleChange}
                            required
                            type="text"
                            placeholder="Enter the title of the item here"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Category</label>
                        <select 
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF] focus:border-transparent text-[#1A1A1A]"
                        >
                            <option value="materials">Materials</option>
                            <option value="equipment">Equipment</option>
                            <option value="others">Others</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Minimum Stock</label>
                        <input 
                            name="critical_level"
                            value={formData.critical_level}
                            onChange={handleChange}
                            required
                            type="number"
                            min="0"
                            step="any"
                            placeholder="e.g. 5"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Price</label>
                        <input 
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF] focus:border-transparent"
                        />
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
