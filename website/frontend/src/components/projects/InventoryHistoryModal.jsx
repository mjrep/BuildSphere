import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    }).format(new Date(dateString));
};

const formatTime = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(dateString));
};

export default function InventoryHistoryModal({ project, item, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [item.id]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/projects/${project.id}/inventory/${item.id}/history`);
            setLogs(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch inventory history', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (type) => {
        switch (type) {
            case 'RECEIVING':
                return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-tight">Received</span>;
            case 'CONSUMPTION':
                return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-tight">Consumed</span>;
            case 'SPOILAGE':
                return <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-tight">Defective</span>;
            case 'ADJUSTMENT':
                return <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-gray-100 uppercase tracking-tight">Adjustment</span>;
            default:
                return <span className="bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-gray-100 uppercase tracking-tight">{type}</span>;
        }
    };

    const getQuantityColor = (type) => {
        if (['RECEIVING', 'ADJUSTMENT'].includes(type)) return 'text-emerald-600';
        return 'text-red-600';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-accent p-6 text-white shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Inventory History</h3>
                            <p className="text-white/70 text-xs mt-1 font-medium">{item.item_name} • Audit Trail</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 bg-card/10 hover:bg-card/20 rounded-xl text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* History Content */}
                <div className="overflow-y-auto p-0 flex-1">
                    {loading ? (
                        <div className="p-12 text-center space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#706BFF] mx-auto"></div>
                            <p className="text-sm text-gray-400 font-medium">Fetching ledger records...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 italic">
                            No transaction history found for this item.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-card border-b border-gray-100 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Quantity</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Current Stock</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-xs font-bold text-text-primary">
                                                {formatDate(log.created_at)}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {formatTime(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {getActionBadge(log.action_type)}
                                        </td>
                                        <td className={`px-6 py-5 text-right font-bold text-sm ${getQuantityColor(log.action_type)}`}>
                                            {['RECEIVING', 'ADJUSTMENT'].includes(log.action_type) ? '+' : '-'}{log.quantity}
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-xs text-gray-600">
                                            {log.current_stock !== null && log.current_stock !== undefined ? log.current_stock : '--'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="max-w-[180px]">
                                                {log.task && (
                                                    <div className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-lg mb-1.5 w-fit leading-tight">
                                                        Task: {log.task.title}
                                                    </div>
                                                )}
                                                {log.notes && (
                                                    <p className="text-[11px] text-[#5A5A5A] italic leading-relaxed line-clamp-2">
                                                        "{log.notes}"
                                                    </p>
                                                )}
                                                <div className="text-[9px] text-gray-400 mt-1 uppercase tracking-tight">
                                                    By {log.creator?.first_name} {log.creator?.last_name}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
                    <p className="text-[10px] text-gray-400 font-medium italic">
                        All transactions are immutable and tied to your user account.
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-card border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Close Ledger
                    </button>
                </div>
            </div>
        </div>
    );
}
