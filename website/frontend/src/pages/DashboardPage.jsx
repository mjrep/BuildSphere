import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import ProjectTeamCard from '../components/dashboard/ProjectTeamCard';
import OngoingProjectRow from '../components/dashboard/OngoingProjectRow';
import ProjectUpdateCard from '../components/dashboard/ProjectUpdateCard';
import { getDashboardStats } from '../services/dashboardApi';
import { useState, useEffect } from 'react';

const avatarColors = ['#706BFF', '#F59E0B', '#10B981', '#EF4444'];
// Mock fallback arrays have been removed in favor of dynamic API stats data.

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({
        ongoing_projects_count: 0,
        proposed_projects_count: 0,
        completed_projects_count: 0,
        project_teams: [],
        ongoing_projects: [],
        project_updates: [],
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [procurementSearchQuery, setProcurementSearchQuery] = useState('');
    const [alertSearchQuery, setAlertSearchQuery] = useState('');
    const [taskSearchQuery, setTaskSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        getDashboardStats()
            .then(data => {
                setStatsData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch dashboard stats:', err);
                setLoading(false);
            });
    }, []);

    const stats = [
        { label: 'Ongoing Projects',   value: statsData.ongoing_projects_count,  color: 'text-amber-500' },
        { label: 'Proposed Projects',  value: statsData.proposed_projects_count, color: 'text-rose-500' },
        { label: 'Completed Projects', value: statsData.completed_projects_count, color: 'text-emerald-500' },
    ];

    const salesStats = [
        { label: 'Pending Projects',       value: statsData.pending_count,       color: 'text-rose-500' },
        { label: 'For Approval Projects',  value: statsData.for_approval_count,  color: 'text-amber-500' },
        { label: 'For Revisions Projects', value: statsData.for_revisions_count, color: 'text-rose-500' },
        { label: 'Approved Projects',      value: statsData.approved_count,      color: 'text-emerald-500' },
    ];

    const accountingStats = [
        { label: 'Ongoing Projects',  value: statsData.ongoing_projects_count,  color: 'text-amber-500' },
        { label: 'Proposed Projects', value: statsData.proposed_projects_count, color: 'text-rose-500' },
        { label: 'Approved Projects', value: statsData.completed_projects_count, color: 'text-emerald-500' },
    ];

    const filteredAllocations = (statsData.budget_allocations || []).filter(item => {
        const matchesSearch = item.project_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || item.status_badge === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const filteredHrAllocations = (statsData.team_members_allocations || []).filter(item =>
        item.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );

    const filteredStaff = (statsData.active_staffs || []).filter(item =>
        item.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (item.role || '').toLowerCase().includes(staffSearchQuery.toLowerCase())
    );

    const filteredProcurementStock = (statsData.materials_stock || []).filter(item =>
        item.project_name.toLowerCase().includes(procurementSearchQuery.toLowerCase())
    );

    const filteredAlerts = (statsData.critical_alerts || []).filter(item =>
        item.item_name.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
        item.project_name.toLowerCase().includes(alertSearchQuery.toLowerCase())
    );

    const filteredStaffTasks = (statsData.assigned_tasks_list || []).filter(item =>
        item.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        item.project_name.toLowerCase().includes(taskSearchQuery.toLowerCase())
    );

    return (
        <DashboardLayout pageTitle="Dashboard">
            <div className="flex flex-col h-full space-y-5 animate-in fade-in duration-500 overflow-hidden">

                {/* Loading Skeleton State */}
                {loading ? (
                    <div className="space-y-5">
                        {/* Stat Cards Skeleton */}
                        <div className="flex gap-4 w-full">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex-1 bg-card rounded-2xl p-6 border border-border-primary animate-pulse">
                                    <div className="h-4 bg-bg-secondary rounded w-24 mb-3" />
                                    <div className="h-8 bg-bg-secondary rounded w-12" />
                                </div>
                            ))}
                        </div>

                        {/* Project Teams Skeleton */}
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border-primary animate-pulse">
                            <div className="h-6 bg-bg-secondary rounded w-32 mb-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-48 bg-bg-secondary rounded-2xl border border-border-primary/50" />
                                ))}
                            </div>
                        </div>

                        {/* Bottom Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
                            <div className="bg-card rounded-2xl p-6 border border-border-primary">
                                <div className="h-6 bg-bg-secondary rounded w-40 mb-4" />
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-12 bg-bg-secondary rounded-xl" />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl p-6 border border-border-primary">
                                <div className="h-6 bg-bg-secondary rounded w-36 mb-4" />
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-12 bg-bg-secondary rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : statsData.role === 'accounting' ? (
                    <>
                        {/* Accounting Stat Cards Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                            {accountingStats.map((s) => (
                                <StatCard key={s.label} {...s} />
                            ))}
                        </div>

                        {/* Budget Allocations Container */}
                        <div className="flex-1 min-h-0 bg-card rounded-[2rem] p-6 shadow-xl border border-border-primary/50 flex flex-col space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-primary/30 pb-5 shrink-0">
                                <div>
                                    <h2 className="text-base font-black text-accent uppercase tracking-wider">Budget Allocations</h2>
                                    <p className="text-xs text-text-muted mt-1 font-bold">Monitor real-time project actual material costs against approved budgets</p>
                                </div>
                                
                                {/* Scalability Controls */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search projects..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-bg-secondary/60 border border-border-primary/50 rounded-xl px-4 py-2 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent w-48 transition-all"
                                        />
                                        <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="flex gap-1.5 bg-bg-secondary/45 p-1 rounded-xl border border-border-primary/40">
                                        {['All', 'On Budget', 'Depletion', 'Overrun'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    filterStatus === status 
                                                        ? 'bg-accent text-white shadow-sm' 
                                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/50'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Responsive Wrap Grid to guarantee perfect layout scalability */}
                            {filteredAllocations.length > 0 ? (
                                <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                    {filteredAllocations.map((p) => {
                                        const rawPercent = p.budget > 0 ? (p.actual_cost / p.budget) * 100 : 0;
                                        const percent = p.actual_cost > 0 && rawPercent < 1 ? 1 : Math.min(100, Math.round(rawPercent));
                                        return (
                                            <div key={p.id} className="bg-bg-secondary/30 hover:bg-bg-secondary/50 border border-border-primary/50 rounded-[1.5rem] p-5 shadow-sm transition-all duration-300 flex flex-col justify-between group">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-base font-black text-text-primary group-hover:text-accent transition-colors mb-1 line-clamp-1">{p.project_name}</h3>
                                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{p.as_of_date}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            p.status_badge === 'Overrun' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                            p.status_badge === 'Depletion' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                            'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        }`}>
                                                            {p.status_badge}
                                                        </span>
                                                    </div>

                                                    {/* Precise SVG Circular Pie Chart */}
                                                    <div className="relative flex justify-center py-6">
                                                        <svg height="120" width="120" className="mx-auto -rotate-90 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                                                            {/* Total Budget Track (Dark Slice) */}
                                                            <circle
                                                                stroke="var(--bg-hover, #2d2d30)"
                                                                fill="transparent"
                                                                strokeWidth="60"
                                                                r="30"
                                                                cx="60"
                                                                cy="60"
                                                            />
                                                            {/* Actual Material Costs (Colored Segment) */}
                                                            <circle
                                                                stroke={
                                                                    p.status_badge === 'Overrun' ? '#EF4444' :
                                                                    p.status_badge === 'Depletion' ? '#F59E0B' :
                                                                    '#10B981'
                                                                }
                                                                fill="transparent"
                                                                strokeWidth="60"
                                                                r="30"
                                                                cx="60"
                                                                cy="60"
                                                                strokeDasharray={`${(percent / 100) * 188.4} 188.4`}
                                                                className="transition-all duration-1000 ease-out"
                                                            />
                                                            {/* Center Accent Core Dot */}
                                                            <circle
                                                                fill="#FFFFFF"
                                                                r="3"
                                                                cx="60"
                                                                cy="60"
                                                            />
                                                        </svg>
                                                        {/* Floating hover percentage tag */}
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-bg-secondary/90 rounded-2xl m-6 border border-border-primary/50 pointer-events-none">
                                                            <p className="text-xs font-black text-text-primary">{percent}% Spent</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Financial Details Footer */}
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-primary/30 text-center">
                                                    <div className="flex-1 border-r border-border-primary/30">
                                                        <p className={`text-sm font-black ${
                                                            p.status_badge === 'Overrun' ? 'text-red-500' :
                                                            p.status_badge === 'Depletion' ? 'text-yellow-500' :
                                                            'text-green-500'
                                                        }`}>
                                                            ₱{p.actual_cost.toLocaleString()}
                                                        </p>
                                                        <p className="text-[9px] uppercase font-bold text-text-muted mt-0.5">Material Costs</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-black text-text-primary">
                                                            ₱{p.budget.toLocaleString()}
                                                        </p>
                                                        <p className="text-[9px] uppercase font-bold text-text-muted mt-0.5">Budget</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-bg-secondary/20 border border-border-primary/30 rounded-2xl p-12 text-center">
                                    <p className="text-sm text-text-muted">No projects match the selected search or status filters.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : statsData.role === 'staff' ? (
                    <>
                        {/* Staff Stat Cards Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                            <StatCard
                                label="Total Assigned Tasks"
                                value={statsData.total_assigned}
                                color="text-accent"
                            />
                            <StatCard
                                label="Tasks In Progress"
                                value={statsData.ongoing_tasks}
                                color="text-amber-500"
                            />
                            <StatCard
                                label="Tasks Completed"
                                value={statsData.completed_tasks}
                                color="text-emerald-500"
                            />
                        </div>

                        {/* Bottom: Tasks Checklist (60%) + Submitted Logs (40%) */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5">

                            {/* Left Panel: Assigned Tasks Checklist (7 columns) */}
                            <div className="min-h-0 lg:col-span-7 bg-card rounded-[2rem] p-6 shadow-md border border-border-primary/50 flex flex-col space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary/30 pb-4 shrink-0">
                                    <div>
                                        <h2 className="text-base font-bold text-accent uppercase tracking-wider">My Assigned Tasks</h2>
                                        <p className="text-xs text-text-muted mt-1 font-medium">List of tasks assigned to you for execution</p>
                                    </div>
                                    
                                    {/* Task Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={taskSearchQuery}
                                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                                            className="bg-bg-secondary/60 border border-border-primary/50 rounded-xl px-4 py-2 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent w-44 transition-all"
                                        />
                                        <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                    {filteredStaffTasks.length > 0 ? (
                                        filteredStaffTasks.map((t) => (
                                            <div key={t.id} className="bg-bg-secondary/30 hover:bg-bg-secondary/50 border border-border-primary/50 rounded-2xl p-5 shadow-sm transition-all duration-300 flex items-center justify-between group">
                                                <div className="space-y-1">
                                                    <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">{t.title}</h3>
                                                    <p className="text-xs text-text-muted font-medium">{t.project_name}</p>
                                                    <p className="text-[11px] text-text-muted mt-1 font-medium">Assigned: {t.created_at}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                                                            : (t.status || '').toLowerCase() === 'in progress' || (t.status || '').toLowerCase() === 'ongoing' || (t.status || '').toLowerCase() === 'in_progress'
                                                            ? 'bg-amber-50 text-amber-600 border border-amber-200/50'
                                                            : 'bg-rose-50 text-rose-600 border border-rose-200/50'
                                                    }`}>
                                                        {t.status?.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-bg-secondary/20 border border-border-primary/30 rounded-2xl p-12 text-center">
                                            <p className="text-sm text-text-muted">No assigned tasks found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Panel: Submitted Progress Logs (5 columns) */}
                            <div className="min-h-0 lg:col-span-5 bg-card rounded-[2rem] p-6 shadow-md border border-border-primary/50 flex flex-col space-y-5">
                                <div className="border-b border-border-primary/30 pb-4 shrink-0">
                                    <h2 className="text-base font-bold text-accent uppercase tracking-wider">My Task Submissions</h2>
                                        <p className="text-[10px] text-text-muted mt-0.5 font-medium">Recent progress updates and accomplishments logged by you</p>
                                    </div>

                                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                        {statsData.recent_submissions?.length > 0 ? (
                                            statsData.recent_submissions.map((log) => (
                                                <div key={log.id} className="p-4 rounded-2xl border border-border-primary/50 bg-bg-secondary/20 flex flex-col space-y-2 shadow-sm transition-all duration-300 hover:scale-[1.01] group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">{log.task_title}</h3>
                                                            <p className="text-[9px] text-text-muted font-medium uppercase tracking-wider">{log.project_name}</p>
                                                        </div>
                                                        <span className="text-[10px] text-text-muted font-medium">{log.date}</span>
                                                    </div>
                                                    <p className="text-xs text-text-primary/90 font-bold bg-bg-secondary/40 p-2.5 rounded-xl border border-border-primary/30 italic">
                                                        "{log.remarks}"
                                                    </p>
                                                    {log.quantity !== undefined && log.quantity !== null && (
                                                        <p className="text-[10px] text-text-primary font-bold">
                                                            Accomplished Quantity: <span className="text-accent font-black">{log.quantity}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-muted py-4 text-center">No progress log submissions found yet.</p>
                                        )}
                                    </div>
                            </div>

                        </div>
                    </>
                ) : statsData.role === 'procurement' ? (
                    <>
                        {/* Procurement Stat Cards Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                            <StatCard
                                label="Ongoing Projects"
                                value={statsData.ongoing_projects_count}
                                color="text-orange-400"
                            />
                        </div>

                        {/* Bottom: Materials Stock (60%) + Critical Stock Alerts (40%) */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5">

                            {/* Left Panel: Materials Stock (7 columns) */}
                            <div className="min-h-0 lg:col-span-7 bg-card rounded-[2rem] p-6 shadow-xl border border-border-primary/50 flex flex-col space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary/30 pb-4 shrink-0">
                                    <div>
                                        <h2 className="text-base font-black text-accent uppercase tracking-wider">Materials Stock</h2>
                                        <p className="text-xs text-text-muted mt-1 font-bold">Classified count of material inventory items per project</p>
                                    </div>
                                    
                                    {/* Project Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search projects..."
                                            value={procurementSearchQuery}
                                            onChange={(e) => setProcurementSearchQuery(e.target.value)}
                                            className="bg-bg-secondary/60 border border-border-primary/50 rounded-xl px-4 py-2 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent w-44 transition-all"
                                        />
                                        <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                {filteredProcurementStock.length > 0 ? (
                                    <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start content-start overflow-y-auto pr-2 scrollbar-thin pb-4">
                                        {filteredProcurementStock.map((p) => {
                                            const total = p.in_stock + p.low_stock + p.no_stock;
                                            const inStockPct = total > 0 ? (p.in_stock / total) * 100 : 0;
                                            const lowStockPct = total > 0 ? (p.low_stock / total) * 100 : 0;
                                            const noStockPct = total > 0 ? (p.no_stock / total) * 100 : 0;

                                            return (
                                                <div key={p.id} className="bg-bg-secondary/30 hover:bg-bg-secondary/50 border border-border-primary/50 rounded-[1.5rem] p-5 shadow-sm transition-all duration-300 flex flex-col justify-between group">
                                                    <div>
                                                        <h3 className="text-base font-black text-text-primary group-hover:text-accent transition-colors mb-1 line-clamp-1">{p.project_name}</h3>
                                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{p.as_of_date}</p>

                                                        {/* Solid Pie Chart with 3 colored slices matching mockup exactly */}
                                                        <div className="relative flex justify-center py-5">
                                                            <svg height="120" width="120" className="mx-auto -rotate-90 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
                                                                {/* Light neutral background circle for empty state */}
                                                                <circle
                                                                    stroke="rgba(156, 163, 175, 0.15)"
                                                                    fill="transparent"
                                                                    strokeWidth="60"
                                                                    r="30"
                                                                    cx="60"
                                                                    cy="60"
                                                                />
                                                                {/* Slices calculated with vector offsets */}
                                                                {/* Slice 1: In Stock (Green) */}
                                                                <circle
                                                                    stroke="#10B981"
                                                                    fill="transparent"
                                                                    strokeWidth="60"
                                                                    r="30"
                                                                    cx="60"
                                                                    cy="60"
                                                                    strokeDasharray={`${(inStockPct / 100) * 188.4} 188.4`}
                                                                    strokeDashoffset={0}
                                                                />
                                                                {/* Slice 2: Low Stock (Orange) */}
                                                                {lowStockPct > 0 && (
                                                                    <circle
                                                                        stroke="#F59E0B"
                                                                        fill="transparent"
                                                                        strokeWidth="60"
                                                                        r="30"
                                                                        cx="60"
                                                                        cy="60"
                                                                        strokeDasharray={`${(lowStockPct / 100) * 188.4} 188.4`}
                                                                        strokeDashoffset={-((inStockPct / 100) * 188.4)}
                                                                    />
                                                                )}
                                                                {/* Slice 3: No Stock (Red) */}
                                                                {noStockPct > 0 && (
                                                                    <circle
                                                                        stroke="#EF4444"
                                                                        fill="transparent"
                                                                        strokeWidth="60"
                                                                        r="30"
                                                                        cx="60"
                                                                        cy="60"
                                                                        strokeDasharray={`${(noStockPct / 100) * 188.4} 188.4`}
                                                                        strokeDashoffset={-(((inStockPct + lowStockPct) / 100) * 188.4)}
                                                                    />
                                                                )}
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* In Stock / Low Stock / No Stock footer metrics */}
                                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-primary/30 text-center">
                                                        <div className="flex-1 border-r border-border-primary/30">
                                                            <p className="text-sm font-black text-green-500">{p.in_stock}</p>
                                                            <p className="text-[9px] uppercase font-bold text-text-muted mt-0.5">In Stock</p>
                                                        </div>
                                                        <div className="flex-1 border-r border-border-primary/30">
                                                            <p className="text-sm font-black text-yellow-500">{p.low_stock}</p>
                                                            <p className="text-[9px] uppercase font-bold text-text-muted mt-0.5">Low Stock</p>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-red-500">{p.no_stock}</p>
                                                            <p className="text-[9px] uppercase font-bold text-text-muted mt-0.5">No Stock</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-bg-secondary/20 border border-border-primary/30 rounded-2xl p-12 text-center">
                                        <p className="text-sm text-text-muted">No projects found.</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Critical Stock Alerts Board */}
                            <div className="min-h-0 lg:col-span-5 bg-card rounded-[2rem] p-6 shadow-xl border border-border-primary/50 flex flex-col space-y-5">
                                <div className="flex items-center justify-between border-b border-border-primary/30 pb-4 shrink-0 gap-4">
                                        <div>
                                            <h2 className="text-base font-black text-accent uppercase tracking-wider">Critical Alerts</h2>
                                            <p className="text-[10px] text-text-muted mt-0.5 font-bold">Materials running dangerously low across sites</p>
                                        </div>
                                        
                                        {/* Alerts Search Bar */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search alerts..."
                                                value={alertSearchQuery}
                                                onChange={(e) => setAlertSearchQuery(e.target.value)}
                                                className="bg-bg-secondary/60 border border-border-primary/50 rounded-xl px-4 py-2 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent w-36 transition-all"
                                            />
                                            <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                        {filteredAlerts.length > 0 ? (
                                            filteredAlerts.map((alert, i) => (
                                                <div key={i} className={`p-4 rounded-2xl border ${
                                                    alert.status === 'Out of Stock' 
                                                        ? 'bg-red-500/5 border-red-500/20' 
                                                        : 'bg-yellow-500/5 border-yellow-500/20'
                                                } flex items-center justify-between shadow-sm transition-all duration-300 hover:scale-[1.01] group`}>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-black text-text-primary group-hover:text-accent transition-colors">{alert.item_name}</h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                                                alert.status === 'Out of Stock' 
                                                                    ? 'bg-red-500/10 text-red-500' 
                                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                                {alert.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{alert.project_name}</p>
                                                        <p className="text-[11px] text-text-primary/80 font-bold">
                                                            Current: <span className={alert.status === 'Out of Stock' ? 'text-red-500' : 'text-yellow-500'}>{alert.current_stock}</span> / Min: {alert.critical_level} {alert.unit}
                                                        </p>
                                                    </div>

                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-muted py-4 text-center">No critical stock alerts found.</p>
                                        )}
                                    </div>
                                    </div>

                        </div>
                    </>
                ) : statsData.role === 'hr' ? (
                    <>
                        {/* HR Custom Stat Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                            {/* Card 1: Active Staff */}
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border-primary flex items-center justify-between flex-1 transition-all duration-300 hover:border-accent/30 group">
                                <div>
                                    <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Total number of active staff</p>
                                    <p className="text-xs text-text-muted mt-1 font-medium">Been active for the last month.</p>
                                </div>
                                <p className="text-4xl font-bold leading-none text-emerald-500">{statsData.active_last_month}</p>
                            </div>
                            
                            {/* Card 2: Inactive Staff */}
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border-primary flex items-center justify-between flex-1 transition-all duration-300 hover:border-accent/30 group">
                                <div>
                                    <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Total number of inactive staff</p>
                                    <p className="text-xs text-text-muted mt-1 font-medium">Hasn't been active for the last month.</p>
                                </div>
                                <p className="text-4xl font-bold leading-none text-rose-500">{statsData.inactive_last_month}</p>
                            </div>
                        </div>

                        {/* Bottom: Team Members (Project Allocations) + Active Staffs */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5">

                            {/* Left Panel: Team Members */}
                            <div className="min-h-0 bg-card rounded-[2rem] p-6 shadow-md border border-border-primary/50 flex flex-col space-y-5">
                                <div className="flex items-center justify-between border-b border-border-primary/30 pb-4 shrink-0 gap-4">
                                        <h2 className="text-base font-bold text-accent uppercase tracking-wider">Team Members</h2>
                                        
                                        {/* Project Search Bar */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search projects..."
                                                value={projectSearchQuery}
                                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                                                className="bg-bg-secondary/60 border border-border-primary/50 rounded-xl px-4 py-2 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent w-48 transition-all"
                                            />
                                            <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                        {filteredHrAllocations.length > 0 ? (
                                            filteredHrAllocations.map((p, i) => (
                                                <div key={i} className="bg-bg-secondary/40 hover:bg-bg-secondary/60 rounded-2xl p-5 border border-border-primary/50 flex items-center justify-between shadow-sm transition-all duration-300">
                                                    <div>
                                                        <h3 className="text-base font-bold text-text-primary mb-1">{p.project_name}</h3>
                                                        <p className="text-xs text-text-muted font-medium">{p.member_count} Team member in {p.project_name}.</p>
                                                    </div>
                                                    <span className="text-3xl font-bold text-text-primary pr-2">
                                                        {p.member_count}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-muted py-4 text-center">No projects found.</p>
                                        )}
                                    </div>
                            </div>

                            {/* Right Panel: Active Staffs */}
                            <div className="min-h-0 bg-card rounded-[2rem] p-6 shadow-md border border-border-primary/50 flex flex-col space-y-5">
                                <div className="flex items-center justify-between border-b border-border-primary/30 pb-4 shrink-0 gap-4">
                                        <h2 className="text-base font-bold text-accent uppercase tracking-wider">Active Staffs</h2>
                                        
                                        {/* Staff Search Bar */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search staff or role..."
                                                value={staffSearchQuery}
                                                onChange={(e) => setStaffSearchQuery(e.target.value)}
                                                className="bg-bg-secondary/60 border border-border-primary/50 rounded-xl px-4 py-2 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent w-48 transition-all"
                                            />
                                            <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                        {filteredStaff.length > 0 ? (
                                            filteredStaff.map((staff, i) => {
                                                const initials = (staff.name || '')
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase();
                                                
                                                return (
                                                    <div key={i} className="bg-bg-secondary/30 hover:bg-bg-secondary/50 rounded-2xl p-4 border border-border-primary/50 flex items-center justify-between shadow-sm transition-all duration-300 hover:scale-[1.01] group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                                                <span className="text-xs font-black text-accent">{initials || 'U'}</span>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{staff.name}</h3>
                                                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">{staff.role}</p>
                                                            </div>
                                                        </div>
                                                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                            Active
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-text-muted py-4 text-center">No active staff found.</p>
                                        )}
                                    </div>
                            </div>
                        </div>
                    </>
                ) : statsData.role === 'sales' ? (
                    <>
                        {/* Sales Stat Cards Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                            {salesStats.map((s) => (
                                <StatCard key={s.label} {...s} />
                            ))}
                        </div>

                        {/* Bottom: Proposed Projects Status + Proposed Project Updates */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5">

                            {/* Left Panel: Proposed Projects Status */}
                            <div className="min-h-0 bg-card rounded-[2rem] p-6 shadow-xl border border-border-primary/50 flex flex-col space-y-5">
                                <h2 className="text-base font-black text-accent uppercase tracking-wider shrink-0 mb-0">Proposed Projects Status</h2>
                                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                    {statsData.proposed_projects_status?.length > 0 ? (
                                        statsData.proposed_projects_status.map((p, i) => (
                                            <div key={i} className="bg-bg-secondary/40 hover:bg-bg-secondary/60 rounded-2xl p-5 border border-border-primary/50 flex items-center justify-between shadow-sm transition-all duration-300">
                                                <div>
                                                    <h3 className="text-base font-black text-text-primary mb-1">{p.project_name}</h3>
                                                    <p className="text-xs text-text-muted font-bold">Project-In-Charge: {p.engr_name}</p>
                                                </div>
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    p.sub_status === 'Pending' ? 'bg-rose-50 text-rose-600 border border-rose-200/50' :
                                                    p.sub_status === 'For Approval' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' :
                                                    p.sub_status === 'For Revisions' ? 'bg-rose-50 text-rose-600 border border-rose-200/50' :
                                                    'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                                                }`}>
                                                    {p.sub_status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-text-muted col-span-full">No proposed projects found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Panel: Proposed Project Updates */}
                            <div className="min-h-0 bg-card rounded-[2rem] p-6 shadow-xl border border-border-primary/50 flex flex-col space-y-5">
                                <h2 className="text-base font-black text-accent uppercase tracking-wider shrink-0 mb-0">Proposed Project Updates</h2>
                                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 scrollbar-thin pb-4">
                                    {statsData.proposed_project_updates?.length > 0 ? (
                                        statsData.proposed_project_updates.map((update, i) => (
                                            <div key={i} className={`p-4 rounded-2xl border ${
                                                update.color === 'red' ? 'bg-rose-50/80 border-rose-200/60' :
                                                update.color === 'orange' ? 'bg-amber-50/80 border-amber-200/60' :
                                                'bg-emerald-50/80 border-emerald-200/60'
                                            } flex gap-2 text-sm leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}>
                                                <div className="w-full">
                                                    <span className={`font-black uppercase tracking-tight mr-1 ${
                                                        update.color === 'red' ? 'text-rose-600' :
                                                        update.color === 'orange' ? 'text-amber-600' :
                                                        'text-emerald-600'
                                                    }`}>
                                                        {update.project_name}
                                                    </span>
                                                    <span className="text-text-primary font-bold">
                                                        : {update.description}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-text-muted">No updates received today.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Stat Cards Row */}
                        <div className="flex gap-4 shrink-0">
                            {stats.map((s) => (
                                <StatCard key={s.label} {...s} />
                            ))}
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col gap-5">

                            {/* Project Teams */}
                            <div className="shrink-0 bg-card rounded-2xl p-6 shadow-sm border border-border-primary flex flex-col">
                                <div className="flex items-center justify-between mb-4 shrink-0">
                                    <h2 className="text-base font-bold text-accent">Project Teams</h2>
                                    {statsData.project_teams?.length > 3 && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    document.getElementById('project-teams-scroll').scrollBy({ left: -320, behavior: 'smooth' });
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-secondary text-text-primary hover:bg-bg-hover transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    document.getElementById('project-teams-scroll').scrollBy({ left: 320, behavior: 'smooth' });
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-secondary text-text-primary hover:bg-bg-hover transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div id="project-teams-scroll" className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    {statsData.project_teams?.length > 0 ? (
                                        statsData.project_teams.map((t, i) => (
                                            <div key={i} className="w-[300px] shrink-0">
                                                <ProjectTeamCard {...t} />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-text-muted w-full">No active project teams found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Bottom: Ongoing Projects + Project Updates */}
                            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5">

                                {/* Ongoing Projects (left) */}
                                <div className="min-h-0 bg-card rounded-2xl p-6 shadow-sm border border-border-primary flex flex-col">
                                    <h2 className="text-base font-bold text-accent mb-4 shrink-0">Ongoing Projects</h2>
                                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin space-y-3">
                                        {statsData.ongoing_projects?.length > 0 ? (
                                            statsData.ongoing_projects.map((p, i) => (
                                                <OngoingProjectRow key={i} {...p} />
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-muted">No ongoing projects found.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Project Updates (right) */}
                                <div className="min-h-0 bg-card rounded-2xl p-6 shadow-sm border border-border-primary flex flex-col">
                                    <h2 className="text-base font-bold text-accent mb-4 shrink-0">Project Updates</h2>
                                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin space-y-3">
                                        {statsData.project_updates?.length > 0 ? (
                                            statsData.project_updates.map((update, i) => (
                                                <ProjectUpdateCard key={i} project_id={update.project_id} projectName={update.project_name} count={update.updates_today} time={update.latest_shift} index={i} />
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-muted">No updates received today.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}


