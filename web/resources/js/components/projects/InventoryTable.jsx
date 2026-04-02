import React, { useState } from 'react';
import InventoryStatusBadge from './InventoryStatusBadge';
import InventoryActionsDropdown from './InventoryActionsDropdown';
import InventorySkeleton from './InventorySkeleton';

export default function InventoryTable({ items, canManage, onEdit, onUpdateStock, onDelete, isLoading }) {
    if (isLoading) {
        // Handled below in the tbody
    } else if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-t border-[#F0F0F8]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#A1A1A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A]">No inventory items yet</p>
                <p className="text-xs text-[#A1A1A1] mt-1 max-w-sm">
                    {canManage ? 'Add new items to start tracking your project materials and equipment.' : 'Inventory is currently empty.'}
                </p>
            </div>
        );
    }

    const getCategoryStyles = (category) => {
        const cat = category?.toLowerCase();
        if (cat === 'materials') return 'bg-[#FEFCE8] text-[#EAB308] border border-[#FEF08A]'; // Yellow
        if (cat === 'equipment') return 'bg-[#FDF4FF] text-[#D946EF] border border-[#FBCFE8]'; // Pink/Purple
        return 'bg-gray-50 text-gray-600 border border-gray-200'; // Others
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-y border-[#F0F0F8] bg-[#FAFAFC] text-[#1A1A1A] font-bold">
                        <th className="px-6 py-4 whitespace-nowrap">Item Name</th>
                        <th className="px-6 py-4 whitespace-nowrap">Category</th>
                        <th className="px-6 py-4 whitespace-nowrap">In Stock</th>
                        <th className="px-6 py-4 whitespace-nowrap">Critical Lvl</th>
                        <th className="px-6 py-4 whitespace-nowrap">Price</th>
                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                        {canManage && <th className="px-6 py-4 whitespace-nowrap w-4 text-center"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F8]">
                    {isLoading ? (
                        <InventorySkeleton />
                    ) : (
                        items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-[#1A1A1A]">
                                {item.item_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getCategoryStyles(item.category)}`}>
                                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[#1A1A1A]">
                                {item.stock_display}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B]">
                                {item.critical_display}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B]">
                                {item.price_display}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <InventoryStatusBadge status={item.status} />
                            </td>
                            {canManage && (
                                <td className="px-6 py-4 whitespace-nowrap text-right relative">
                                    <InventoryActionsDropdown 
                                        item={item} 
                                        onEdit={onEdit} 
                                        onUpdateStock={onUpdateStock} 
                                        onDelete={onDelete}
                                    />
                                </td>
                            )}
                        </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
