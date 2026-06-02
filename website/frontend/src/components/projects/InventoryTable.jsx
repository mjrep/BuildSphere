import React, { useState } from 'react';
import InventoryStatusBadge from './InventoryStatusBadge';
import InventoryActionsDropdown from './InventoryActionsDropdown';
import InventorySkeleton from './InventorySkeleton';

export default function InventoryTable({ items, canManage, onEdit, onUpdateStock, onViewHistory, onDelete, isLoading }) {
    if (isLoading) {
        // Handled below in the tbody
    } else if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-t border-border-primary">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-text-primary">No inventory items yet</p>
                <p className="text-xs text-text-muted mt-1 max-w-sm">
                    {canManage ? 'Add new items to start tracking your project materials and equipment.' : 'Inventory is currently empty.'}
                </p>
            </div>
        );
    }

    const getCategoryStyles = (category) => {
        const cat = category?.toLowerCase();
        if (cat === 'materials') return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
        if (cat === 'equipment') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
        return 'bg-text-muted/10 text-text-muted border border-text-muted/20';
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-y border-border-primary/50 bg-bg-secondary text-text-primary font-black uppercase tracking-tighter">
                        <th className="px-6 py-5 whitespace-nowrap">Item Name</th>
                        <th className="px-6 py-5 whitespace-nowrap">Category</th>
                        <th className="px-6 py-5 whitespace-nowrap">In Stock</th>
                        <th className="px-6 py-5 whitespace-nowrap">Critical Level</th>
                        <th className="px-6 py-5 whitespace-nowrap">Price</th>
                        <th className="px-6 py-5 whitespace-nowrap">Status</th>
                        {canManage && <th className="px-6 py-5 whitespace-nowrap w-4 text-center"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-primary/30">
                    {isLoading ? (
                        <InventorySkeleton />
                    ) : (
                        items.map((item, idx) => (
                        <tr key={item.id} className={`hover:bg-bg-hover transition-colors ${idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-stripe'}`}>
                            <td className="px-6 py-5 font-bold text-text-primary">
                                {item.item_name}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getCategoryStyles(item.category)}`}>
                                    {item.category}
                                </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-text-primary font-bold">
                                {item.stock_display}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-text-secondary">
                                {item.critical_display}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-text-secondary">
                                {item.price_display}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                                <InventoryStatusBadge status={item.status} />
                            </td>
                            {canManage && (
                                <td className="px-6 py-5 whitespace-nowrap text-right relative">
                                    <InventoryActionsDropdown 
                                        item={item} 
                                        onEdit={onEdit} 
                                        onUpdateStock={onUpdateStock} 
                                        onViewHistory={onViewHistory}
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
