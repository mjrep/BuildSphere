import React, { useRef, useState } from 'react';
import TaskViewToggle from './TaskViewToggle';
import { TASK_STATUSES, TASK_PRIORITIES, SORT_OPTIONS } from '../../utils/taskConstants';

export default function TaskToolbar({
    view, onViewChange,
    search, onSearchChange,
    sort, onSortChange,
    filters, onFilterChange,
    onResetFilters, hasActiveFilters,
    meta,
    canCreate, onAddTask,
}) {
    const [showSort, setShowSort]         = useState(false);
    const [showFilter, setShowFilter]     = useState(false);
    const debounceRef                     = useRef(null);

    const handleSearch = (e) => {
        const val = e.target.value;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onSearchChange(val), 350);
    };

    return (
        <div className="space-y-4">
            {/* Top row */}
            <div className="flex flex-wrap items-center gap-4">
                <TaskViewToggle view={view} onChange={onViewChange} />

                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm group">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        id="task-search-input"
                        type="text"
                        defaultValue={search}
                        onChange={handleSearch}
                        placeholder="Search tasks…"
                        className="w-full pl-11 pr-4 py-2.5 text-sm rounded-2xl border border-border-primary/50 bg-bg-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-text-primary placeholder:text-text-muted transition-all shadow-inner"
                    />
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                    <button
                        id="task-sort-btn"
                        onClick={() => { setShowSort(s => !s); setShowFilter(false); }}
                        className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest bg-bg-secondary border border-border-primary/50 rounded-2xl hover:bg-bg-hover transition-all ${showSort ? 'ring-2 ring-accent border-accent' : ''}`}
                    >
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Sort by
                    </button>
                    {showSort && (
                        <div className="absolute top-full mt-3 left-0 z-30 bg-card border border-border-primary/50 rounded-[1.5rem] shadow-2xl py-2 w-56 animate-in fade-in zoom-in-95 duration-200">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { onSortChange(opt.value); setShowSort(false); }}
                                    className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all
                                        ${sort === opt.value ? 'bg-accent/10 text-accent' : 'text-text-primary hover:bg-bg-hover'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter button */}
                <button
                    id="task-filter-btn"
                    onClick={() => { setShowFilter(s => !s); setShowSort(false); }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest border rounded-2xl transition-all
                        ${hasActiveFilters || showFilter
                            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                            : 'text-text-muted bg-bg-secondary border-border-primary/50 hover:bg-bg-hover hover:text-text-primary'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    Filter {hasActiveFilters && '•'}
                </button>

                <div className="ml-auto">
                    {canCreate && (
                        <button
                            id="task-add-new-btn"
                            onClick={onAddTask}
                            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-[11px] font-black uppercase tracking-widest rounded-2xl
                                       hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-accent/25 border border-accent/20"
                        >
                            <span className="text-base">+</span> Add new
                        </button>
                    )}
                </div>
            </div>

            {/* Filter panel */}
            {showFilter && (
                <div className="bg-card border border-border-primary/50 rounded-[1.5rem] p-6 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">

                        {/* Assigned To */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Assigned To</label>
                            <select
                                value={filters.assigned_to}
                                onChange={e => onFilterChange('assigned_to', e.target.value)}
                                className="w-full text-xs border border-border-primary/50 rounded-xl px-3 py-2.5 bg-bg-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-text-primary shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="">All Personnel</option>
                                {meta?.users?.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={e => onFilterChange('priority', e.target.value)}
                                className="w-full text-xs border border-border-primary/50 rounded-xl px-3 py-2.5 bg-bg-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-text-primary shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="">All Priorities</option>
                                {Object.entries(TASK_PRIORITIES).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={e => onFilterChange('status', e.target.value)}
                                className="w-full text-xs border border-border-primary/50 rounded-xl px-3 py-2.5 bg-bg-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-text-primary shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                {Object.entries(TASK_STATUSES).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* From Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">From Date</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={e => onFilterChange('start_date', e.target.value)}
                                className="w-full text-xs border border-border-primary/50 rounded-xl px-3 py-2.5 bg-bg-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-text-primary shadow-inner cursor-pointer"
                            />
                        </div>

                        {/* To Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">To Date</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={e => onFilterChange('end_date', e.target.value)}
                                className="w-full text-xs border border-border-primary/50 rounded-xl px-3 py-2.5 bg-bg-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-text-primary shadow-inner cursor-pointer"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="mt-6 pt-4 border-t border-border-primary/30 flex justify-end">
                            <button
                                onClick={onResetFilters}
                                className="text-[11px] font-black text-accent uppercase tracking-widest hover:bg-accent/10 px-4 py-2 rounded-xl transition-all"
                            >
                                Reset all filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
