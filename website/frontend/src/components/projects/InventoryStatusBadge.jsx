import React from 'react';

export default function InventoryStatusBadge({ status }) {
    if (status === 'in_stock') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm bg-[#5B9C2A]">
                In Stock
            </span>
        );
    }
    
    if (status === 'low_stock') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm bg-[#FF5A5F]">
                Low Stock
            </span>
        );
    }
    
    if (status === 'out_of_stock') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm bg-gray-500">
                Out of Stock
            </span>
        );
    }
    
    return null;
}
