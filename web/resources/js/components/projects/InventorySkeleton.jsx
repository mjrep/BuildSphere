import React from 'react';

export default function InventorySkeleton() {
    const rows = [1, 2, 3, 4, 5]; // Show 5 skeleton rows
    
    return (
        <>
            {rows.map((row) => (
                <tr key={row} className="animate-pulse border-b border-[#F0F0F8]">
                    <td className="px-6 py-5">
                        <div className="h-4 bg-gray-100 rounded-lg w-3/4 shimmer" />
                    </td>
                    <td className="px-6 py-5">
                        <div className="h-4 bg-gray-100 rounded-full w-24 shimmer" />
                    </td>
                    <td className="px-6 py-5">
                        <div className="h-4 bg-gray-50 rounded-lg w-16 shimmer" />
                    </td>
                    <td className="px-6 py-5">
                        <div className="h-4 bg-gray-50 rounded-lg w-16 shimmer" />
                    </td>
                    <td className="px-6 py-5">
                        <div className="h-4 bg-gray-50 rounded-lg w-20 shimmer" />
                    </td>
                    <td className="px-6 py-5">
                        <div className="h-6 bg-gray-100 rounded-full w-24 shimmer" />
                    </td>
                    <td className="px-6 py-5 text-right">
                        <div className="h-8 w-8 bg-gray-100 rounded-lg ml-auto shimmer" />
                    </td>
                </tr>
            ))}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .shimmer {
                    animation: shimmer 1.5s infinite ease-in-out;
                }
            `}} />
        </>
    );
}
