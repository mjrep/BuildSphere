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
    const [isConfirming, setIsConfirming] = useState(false);

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
        if (e && e.preventDefault) e.preventDefault();
        
        if (actionType === 'CONSUMPTION' && !taskId) {
            toast.error('Please select a task for consumption.');
            return;
        }

        if (!isConfirming) {
            setIsConfirming(true);
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
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="bg-accent p-6 text-white relative">
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
                
                {isConfirming ? (
                    <div className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-100 mb-2">
                                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Confirm Transaction</h4>
                            <p className="text-sm text-gray-500">Please review the details below carefully.</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium">Transaction Type</span>
                                <span className={`font-bold ${actionOptions.find(o => o.id === actionType)?.color}`}>
                                    {actionOptions.find(o => o.id === actionType)?.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium">Material</span>
                                <span className="text-gray-900 font-bold">{item.item_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium">Quantity</span>
                                <span className="text-gray-900 font-bold">{quantity} Units</span>
                            </div>
                            {actionType === 'CONSUMPTION' && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-medium">Linked Task</span>
                                    <span className="text-gray-900 font-bold truncate max-w-[150px]">
                                        {tasks.find(t => String(t.id) === String(taskId))?.title || 'Unknown Task'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                                <strong>Attention:</strong> This transaction is irreversible once logged. Ensure all data is accurate before finalizing.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsConfirming(false)}
                                className="flex-1 py-3.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-[2] py-3.5 text-sm font-bold text-white bg-accent hover:opacity-90 rounded-2xl shadow-lg shadow-[#706BFF]/20 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Finalizing...' : 'Finalize Log'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Action Type Selector */}
                        <div className="grid grid-cols-3 gap-3">
                            {actionOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setActionType(opt.id)}
                                    className={`flex items-center justify-center py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                                        actionType === opt.id 
                                            ? `${opt.bg} ${opt.border} ${opt.color} shadow-sm` 
                                            : 'bg-card border-gray-100 text-gray-400 hover:border-gray-200'
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
                                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#706BFF]/20 focus:border-[#706BFF] focus:bg-card transition-all outline-none"
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
                                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#706BFF]/20 focus:border-[#706BFF] focus:bg-card transition-all outline-none appearance-none"
                                    >
                                        <option value="">-- Select a Task --</option>
                                        {tasks.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                    {loadingTasks && <p className="text-[10px] text-accent font-medium ml-1">Loading project tasks...</p>}
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
                                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#706BFF]/20 focus:border-[#706BFF] focus:bg-card transition-all outline-none resize-none"
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
                                        : 'bg-accent hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0'
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
                )}
            </div>
        </div>
    );
}
