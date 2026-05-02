import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function InventoryTransactionModal({ project, item, onClose, onSuccess }) {
    const [actionType, setActionType] = useState('RECEIVING');
    const [quantity, setQuantity] = useState('');
    const [taskId, setTaskId] = useState('');
    const [notes, setNotes] = useState('');
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (actionType === 'CONSUMPTION') {
            fetchTasks();
        }
    }, [actionType]);

    const fetchTasks = async () => {
        try {
            setLoadingTasks(true);
            const res = await axios.get(`/api/tasks?project_id=${project.id}&per_page=100`);
            setTasks(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
            toast.error('Could not load tasks for mapping.');
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (actionType === 'CONSUMPTION' && !taskId) {
            toast.error('Please select a task for consumption.');
            return;
        }

        setSubmitting(true);
        try {
            await axios.patch(`/api/projects/${project.id}/inventory/${item.id}/stock`, {
                action_type: actionType,
                quantity: parseFloat(quantity),
                reference_task_id: taskId || null,
                notes
            });
            toast.success('Transaction logged successfully!');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log transaction');
            setSubmitting(false);
        }
    };

    const actionOptions = [
        { id: 'RECEIVING', label: 'Receive', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { id: 'CONSUMPTION', label: 'Consume', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'SPOILAGE', label: 'Spoilage', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'ADJUSTMENT', label: 'Adjustment', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="bg-[#706BFF] p-6 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h3 className="text-xl font-bold">Log Transaction</h3>
                    <p className="text-white/80 text-xs mt-1 font-medium">{item.item_name} • Current: {item.current_stock} units</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Action Type Selector */}
                    <div className="grid grid-cols-2 gap-3">
                        {actionOptions.map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setActionType(opt.id)}
                                className={`flex items-center justify-center py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                                    actionType === opt.id 
                                        ? `${opt.bg} ${opt.border} ${opt.color} shadow-sm` 
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Quantity</label>
                            <div className="relative">
                                <input 
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    placeholder="Enter amount..."
                                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#706BFF]/20 focus:border-[#706BFF] focus:bg-white transition-all outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Units</span>
                            </div>
                        </div>

                        {/* Task Selector (Conditional) */}
                        {actionType === 'CONSUMPTION' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-4 duration-300">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assign to Task</label>
                                <select
                                    value={taskId}
                                    onChange={(e) => setTaskId(e.target.value)}
                                    required
                                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#706BFF]/20 focus:border-[#706BFF] focus:bg-white transition-all outline-none appearance-none"
                                >
                                    <option value="">-- Select a Task --</option>
                                    {tasks.map(t => (
                                        <option key={t.id} value={t.id}>[{t.status}] {t.title}</option>
                                    ))}
                                </select>
                                {loadingTasks && <p className="text-[10px] text-[#706BFF] font-medium ml-1">Loading project tasks...</p>}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Notes / Remarks</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional details..."
                                rows="3"
                                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#706BFF]/20 focus:border-[#706BFF] focus:bg-white transition-all outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-4 text-sm font-bold text-white rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                                submitting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[#706BFF] hover:bg-[#5B55E6] hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>Confirm Transaction</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
