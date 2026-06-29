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

export default function MasterInventoryLedger({ project, inventoryItems, onClose }) {
    const [allLogs, setAllLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [filterItem, setFilterItem] = useState('all');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchMasterHistory();
    }, [project.id]);

    useEffect(() => {
        applyFilters();
    }, [allLogs, filterItem, filterType]);

    const fetchMasterHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/projects/${project.id}/inventory/history`);
            setAllLogs(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch master history', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...allLogs];
        
        if (filterItem !== 'all') {
            result = result.filter(log => String(log.item_id) === String(filterItem));
        }
        
        if (filterType !== 'all') {
            result = result.filter(log => log.action_type === filterType);
        }
        
        setFilteredLogs(result);
    };

    const getActionBadge = (type) => {
        switch (type) {
            case 'RECEIVING':
                return <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 uppercase">Received</span>;
            case 'CONSUMPTION':
                return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100 uppercase">Consumed</span>;
            case 'SPOILAGE':
                return <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-100 uppercase">Defective</span>;
            case 'ADJUSTMENT':
                return <span className="bg-bg-secondary text-text-muted px-2 py-0.5 rounded-full text-[10px] font-bold border border-border-primary uppercase">Adjustment</span>;
            default:
                return <span className="bg-bg-secondary text-text-muted px-2 py-0.5 rounded-full text-[10px] font-bold border border-border-primary uppercase">{type}</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-accent p-6 text-white shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Inventory Ledger</h3>
                            <p className="text-white/70 text-xs mt-1 font-medium">Project-wide transaction history</p>
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

                    {/* Filter Bar */}
                    <div className="mt-6 flex flex-wrap gap-4 items-end bg-card/10 p-4 rounded-2xl border border-white/10">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Filter by Item</label>
                            <select 
                                value={filterItem}
                                onChange={(e) => setFilterItem(e.target.value)}
                                className="bg-card/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                            >
                                <option value="all" className="text-text-primary">All Materials</option>
                                {inventoryItems.map(item => (
                                    <option key={item.id} value={item.id} className="text-text-primary">{item.item_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Filter by Type</label>
                            <select 
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-card/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                            >
                                <option value="all" className="text-text-primary">All Types</option>
                                <option value="RECEIVING" className="text-text-primary">Receiving</option>
                                <option value="CONSUMPTION" className="text-text-primary">Consumption</option>
                                <option value="SPOILAGE" className="text-text-primary">Defective</option>
                            </select>
                        </div>

                        <div className="ml-auto text-white/60 text-xs font-bold mb-2">
                            Showing {filteredLogs.length} transactions
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-y-auto p-0 flex-1">
                    {loading ? (
                        <div className="p-24 text-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#706BFF] mx-auto"></div>
                            <p className="text-sm text-text-muted font-bold">Synchronizing ledger records...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <p className="text-text-muted font-medium">No transactions found matching your filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-card border-b border-border-primary z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Material</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Qty</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Current Stock</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Linked Task</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Processed By</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-bg-secondary/70 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-[11px] font-bold text-text-primary">{formatDate(log.created_at)}</div>
                                            <div className="text-[10px] text-text-muted">{formatTime(log.created_at)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-text-primary">{log.item?.item_name || 'Deleted Item'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getActionBadge(log.action_type)}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold text-xs ${['RECEIVING', 'ADJUSTMENT'].includes(log.action_type) ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {['RECEIVING', 'ADJUSTMENT'].includes(log.action_type) ? '+' : '-'}{log.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-xs text-text-muted">
                                            {log.current_stock !== null && log.current_stock !== undefined ? log.current_stock : '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.task ? (
                                                <span className="text-[10px] font-bold text-accent bg-[#F0F0FF] px-2 py-0.5 rounded-lg border border-[#E0E0FF]">
                                                    {log.task.title}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-[10px] font-bold text-text-muted">
                                                {log.creator?.first_name} {log.creator?.last_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] text-text-muted truncate max-w-[120px]" title={log.notes}>
                                                {log.notes || '--'}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-bg-secondary border-t border-border-primary flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-8 py-2.5 bg-card border border-border-primary text-text-muted text-sm font-bold rounded-2xl hover:bg-bg-tertiary transition-colors shadow-sm"
                    >
                        Close Ledger
                    </button>
                </div>
            </div>
        </div>
    );
}
