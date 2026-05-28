import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Calendar, Printer, TrendingUp, Package, ListChecks, ArrowRight, Download, Filter, ArrowUpDown, MoreVertical, Camera, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS for Calendar
   ═══════════════════════════════════════════════════════════════════════════ */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

/**
 * Standardizes a date to YYYY-MM-DD string for safe comparison.
 */
function toDateString(d) {
    if (!d) return null;
    if (typeof d === 'string' && d.includes('T')) {
        return d.split('T')[0];
    }
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return d;
    }
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
    return toDateString(date1) === toDateString(date2);
}

/**
 * CustomMiniCalendar - Highlights dates with updates
 */
function CustomMiniCalendar({ selectedDate, onSelectDate, updateDates }) {
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="bg-card border border-slate-200 rounded-2xl p-4 shadow-2xl w-72 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft size={18} className="text-slate-400" />
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">{MONTHS[viewMonth]} {viewYear}</span>
                <button type="button" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronRight size={18} className="text-slate-400" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map(w => <div key={w} className="text-[10px] font-bold text-slate-400 text-center uppercase py-1">{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map(i => <div key={`b-${i}`} />)}
                {days.map(day => {
                    const monthStr = String(viewMonth + 1).padStart(2, '0');
                    const dayStr = String(day).padStart(2, '0');
                    const dStr = `${viewYear}-${monthStr}-${dayStr}`;

                    const isSelected = toDateString(selectedDate) === dStr;
                    const logDatesOnThisDay = updateDates.includes(dStr);

                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => onSelectDate(new Date(viewYear, viewMonth, day))}
                            className={`h-9 w-full flex items-center justify-center text-xs font-bold rounded-xl relative transition-all ${isSelected
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : logDatesOnThisDay
                                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {day}
                            {logDatesOnThisDay && !isSelected && (
                                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * ReportPreview - Document Preview UX.
 */
export default function ReportPreview({ reportData, config, onBack }) {
    // Determine initial active tab based on what's included
    const initialTab = config.includeProgress ? 'Progress Analysis'
        : config.includeInventory ? 'Inventory Summary'
            : 'Accomplishments';

    const [activeTab, setActiveTab] = useState(initialTab);

    // States for Accomplishments filtering - Array of comparison pairs
    const [accomplishmentViews, setAccomplishmentViews] = useState([
        {
            id: Date.now(),
            taskId: '',
            beforeDate: config?.startDate ? new Date(config.startDate) : new Date(),
            afterDate: config?.endDate ? new Date(config.endDate) : new Date(),
            showBeforeCalendar: false,
            showAfterCalendar: false
        }
    ]);

    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState(null); // 'pdf' | 'excel'

    const addComparisonView = () => {
        setAccomplishmentViews([
            ...accomplishmentViews,
            {
                id: Date.now(),
                taskId: '',
                beforeDate: new Date(),
                afterDate: new Date(),
                showBeforeCalendar: false,
                showAfterCalendar: false
            }
        ]);
    };

    const removeComparisonView = (id) => {
        if (accomplishmentViews.length > 1) {
            setAccomplishmentViews(accomplishmentViews.filter(v => v.id !== id));
        }
    };

    const updateViewDate = (id, field, value) => {
        setAccomplishmentViews(prevViews => prevViews.map(v => {
            if (v.id !== id) return v;

            const updatedView = { ...v, [field]: value };
            
            if (field === 'beforeDate' || field === 'afterDate') {
                updatedView[`show${field.charAt(0).toUpperCase() + field.slice(1)}Calendar`] = false;
            }

            // Auto-load previous date into beforeDate if afterDate is selected
            if (field === 'afterDate') {
                const project = reportData && reportData[0];
                if (project?.accomplishments) {
                    const viewUpdateDates = project.accomplishments
                        .filter(a => !v.taskId || String(a.task_id) === String(v.taskId))
                        .map(a => toDateString(a.date))
                        .filter(Boolean);

                    const uniqueSortedDates = [...new Set(viewUpdateDates)].sort((a, b) => new Date(b) - new Date(a));
                    const selectedDateStr = toDateString(value);
                    
                    // Find the closest previous update date (-1)
                    const prevDateStr = uniqueSortedDates.find(d => new Date(d) < new Date(selectedDateStr));

                    if (prevDateStr) {
                        updatedView.beforeDate = new Date(prevDateStr);
                    }
                }
            }

            return updatedView;
        }));
    };

    const toggleCalendar = (id, field) => {
        setAccomplishmentViews(accomplishmentViews.map(v =>
            v.id === id ? { ...v, [field]: !v[field] } : v
        ));
    };

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);
            setExportType('pdf');

            // Format accomplishment views for backend
            const formattedViews = accomplishmentViews.map(v => ({
                beforeDate: toDateString(v.beforeDate),
                afterDate: toDateString(v.afterDate),
                taskId: v.taskId
            }));

            const response = await api.post('/reports/export/pdf', {
                reportData,
                config: { ...config, accomplishmentViews: formattedViews }
            });

            if (!response.data || !response.data.html) {
                throw new Error('Invalid response from server');
            }

            const htmlContent = response.data.html;

            const opt = {
              margin:       10,
              filename:     `BuildSphere_Report_${new Date().toISOString().split('T')[0]}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak:    { mode: ['css', 'legacy'] }
            };

            await html2pdf().set(opt).from(htmlContent).save();

            toast.success('PDF report downloaded');
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast.error('Failed to generate PDF report');
        } finally {
            setIsExporting(false);
            setExportType(null);
        }
    };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            setExportType('excel');

            // Format accomplishment views for backend
            const formattedViews = accomplishmentViews.map(v => ({
                beforeDate: toDateString(v.beforeDate),
                afterDate: toDateString(v.afterDate),
                taskId: v.taskId
            }));

            const response = await api.post('/reports/export/excel', { 
                reportData, 
                config: { ...config, accomplishmentViews: formattedViews } 
            }, {
                responseType: 'blob'
            });

            const blob = response.data instanceof Blob
                ? response.data
                : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            if (blob.size === 0) throw new Error('Generated Excel is empty');

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BuildSphere_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                link.remove();
            }, 100);

            toast.success('Excel report downloaded');
        } catch (err) {
            console.error('Excel Export Error:', err);
            toast.error('Failed to generate Excel report');
        } finally {
            setIsExporting(false);
            setExportType(null);
        }
    };

    if (!reportData || reportData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="p-6 bg-slate-50 rounded-full mb-6">
                    <ListChecks size={48} className="opacity-20" />
                </div>
                <p className="text-xl font-bold">No report data generated</p>
                <button onClick={onBack} className="mt-4 text-indigo-600 font-bold hover:underline flex items-center gap-2">
                    <ChevronLeft size={20} />
                    Back to Builder
                </button>
            </div>
        );
    }

    const tabs = [
        { name: 'Progress Analysis', icon: TrendingUp, show: config.includeProgress },
        { name: 'Inventory Summary', icon: Package, show: config.includeInventory },
        { name: 'Accomplishments', icon: ListChecks, show: config.includeAccomplishments }
    ].filter(t => t.show);

    return (
        <div className="min-h-screen bg-bg-primary pb-32 relative">

            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-[80] bg-card/80 backdrop-blur-md border-b border-border-primary px-8 py-3 flex items-center justify-between shadow-sm">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-black text-text-muted hover:text-text-primary group transition-all"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Builder
                </button>

                <div className="flex items-center gap-4 no-print">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-50"
                    >
                        <FileText size={16} />
                        {isExporting && exportType === 'pdf' ? 'Compiling PDF...' : 'Export to PDF'}
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <FileSpreadsheet size={16} />
                        {isExporting && exportType === 'excel' ? 'Compiling Excel...' : 'Export to Excel'}
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .max-w-\\[1000px\\] { max-width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                    .bg-slate-100 { background: white !important; }
                    .shadow-2xl { box-shadow: none !important; }
                    .rounded-3xl { border-radius: 0 !important; }
                    .p-12 { padding: 0 !important; }
                    .mt-12 { margin-top: 0 !important; }
                    .animate-in { animation: none !important; }
                    .sticky { position: static !important; }
                    .overflow-hidden { overflow: visible !important; }
                }
            `}} />

            {/* Centered Document Page */}
            <div className="max-w-[1000px] mx-auto mt-12 bg-card shadow-2xl rounded-[40px] overflow-hidden border border-border-primary/50 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[1400px]">

                {/* Document Header (Internal Tabs) */}
                <div className="border-b border-border-primary/50 px-12 pt-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-text-primary tracking-tighter">Project Report Preview</h2>
                            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mt-1">
                                {config?.startDate} — {config?.endDate}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-secondary text-[10px] font-black text-text-muted uppercase tracking-tighter border border-border-primary">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Preview
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`pb-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.name ? 'text-accent' : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {tab.name}
                                {activeTab === tab.name && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-full shadow-[0_0_10px_rgba(124,116,255,0.4)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Document Content Area */}
                <div className="p-12 space-y-16">
                    {reportData.map((project) => {
                        const updateDates = Array.from(new Set(project.accomplishments.map(a => toDateString(a.date)))).filter(Boolean);

                        return (
                            <div key={project.id} className="space-y-12">
                                {/* Project Title Marker */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-10 w-2 bg-accent rounded-full shadow-[0_0_12px_rgba(124,116,255,0.4)]" />
                                    <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">{project.name}</h3>
                                </div>

                                {activeTab === 'Progress Analysis' && (
                                    <div className="bg-card rounded-3xl border border-border-primary shadow-sm overflow-hidden animate-in fade-in duration-500">
                                        <div className="bg-bg-secondary/50 py-4 px-8 border-b border-border-primary flex items-center justify-between">
                                            <span className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">Progress Analysis Report</span>
                                        </div>
                                        <table className="w-full text-left">
                                            {/* Progress Status Summary Header */}
                                            <thead className="bg-bg-secondary/30 border-b border-border-primary">
                                                <tr>
                                                    <th colSpan="4" className="px-8 py-4 text-[11px] font-black text-accent uppercase tracking-widest bg-accent/5">
                                                        Milestones
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider w-1/3">Milestone Name</th>
                                                    <th className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider text-center w-1/6">Progress</th>
                                                    <th className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider text-center w-1/4">Status</th>
                                                    <th className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider text-right w-1/4">Date Finished</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-primary/30">
                                                {(!project.progress?.phases || project.progress.phases.length === 0) ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-8 py-6 text-center text-sm text-text-muted italic">No milestones found.</td>
                                                    </tr>
                                                ) : project.progress.phases.flatMap(phase => phase.milestones).map((m, i) => {
                                                    const milestoneTasks = project.completedTasks?.filter(t => t.milestone_id === m.id) || [];
                                                    return (
                                                        <React.Fragment key={`m-${m.id}-${i}`}>
                                                            <tr className="bg-bg-secondary/10 hover:bg-bg-hover transition-colors">
                                                                <td className="px-8 py-4 text-xs font-bold text-text-primary">{m.milestone_name}</td>
                                                                <td className="px-8 py-4 text-xs font-bold text-text-secondary text-center">{m.progress_percentage || 0}%</td>
                                                                <td className="px-8 py-4 text-xs font-bold text-center">
                                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${m.progress_percentage === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                                        {m.progress_percentage === 100 ? 'Completed' : 'Ongoing'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-4 text-xs font-bold text-text-secondary text-right">
                                                                    {m.progress_percentage === 100 ? (m.end_date || '—') : '—'}
                                                                </td>
                                                            </tr>
                                                            {milestoneTasks.map((task, tIdx) => (
                                                                <tr key={`t-${task.id}-${tIdx}`} className="hover:bg-bg-hover transition-colors">
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-text-secondary pl-12 flex items-center gap-2">
                                                                        <div className="w-1 h-1 rounded-full bg-text-muted/50"></div>
                                                                        {task.title}
                                                                    </td>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-center"></td>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-center">
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                            {task.status === 'completed' ? 'Completed' : 'Ongoing'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-right">
                                                                        {task.status === 'completed' ? (task.date || '—') : '—'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {(() => {
                                                    const unassignedTasks = project.completedTasks?.filter(t => !t.milestone_id || !project.progress?.phases?.flatMap(p => p.milestones).some(m => m.id === t.milestone_id)) || [];
                                                    if (unassignedTasks.length > 0) {
                                                        return unassignedTasks.map((task, tIdx) => (
                                                            <tr key={`t-u-${tIdx}`} className="hover:bg-bg-hover transition-colors">
                                                                <td className="px-8 py-3 text-[11px] font-medium text-text-secondary pl-12 flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-text-muted/50"></div>
                                                                    {task.title} (Uncategorized)
                                                                </td>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-center"></td>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                        {task.status === 'completed' ? 'Completed' : 'Ongoing'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-right">
                                                                    {task.status === 'completed' ? (task.date || '—') : '—'}
                                                                </td>
                                                            </tr>
                                                        ));
                                                    }
                                                    return null;
                                                })()}
                                            </tbody>

                                            {/* Summary Header */}
                                            <thead className="bg-bg-secondary/30 border-y border-border-primary">
                                                <tr>
                                                    <th colSpan="4" className="px-8 py-4 text-[11px] font-black text-accent uppercase tracking-widest bg-accent/5 mt-4">
                                                        Summary
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th colSpan="2" className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider">Milestones Completed</th>
                                                    <th className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider text-center">Tasks Completed</th>
                                                    <th className="px-8 py-3 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">Overall Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-card">
                                                <tr className="hover:bg-bg-hover transition-colors">
                                                    <td colSpan="2" className="px-8 py-6 text-lg font-black text-text-primary">
                                                        {project.progress?.phases?.reduce((acc, p) => acc + (p.milestones?.filter(m => m.progress_percentage === 100).length || 0), 0) || 0}
                                                    </td>
                                                    <td className="px-8 py-6 text-lg font-black text-text-primary text-center">
                                                        {project.completedTasks?.filter(t => t.status === 'completed').length || 0}
                                                    </td>
                                                    <td className="px-8 py-6 text-xl font-black text-emerald-500 text-right">
                                                        {project.progress?.project_progress || 0}%
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'Inventory Summary' && (
                                    <div className="bg-card rounded-3xl border border-border-primary shadow-sm overflow-hidden p-8 animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-text-primary tracking-tight">Inventory Summary</h3>
                                        </div>
                                        <div className="overflow-hidden border border-border-primary/50 rounded-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-bg-secondary/30">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider">Item Name</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider">Category</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-center">Total Purchased</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-center">In Stock</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">Unit Price</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">Total Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-primary/20">
                                                    {(!project.inventory || project.inventory.length === 0) ? (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-10 text-center text-sm text-text-muted italic">No inventory items found.</td>
                                                        </tr>
                                                    ) : project.inventory.map((item, i) => (
                                                        <tr key={i} className="hover:bg-bg-hover transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold text-text-primary">{item.item}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.category === 'Materials' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-pink-500/10 text-pink-600'
                                                                    }`}>
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-secondary text-center">{item.received || item.stock}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-secondary text-center">{item.stock}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-secondary text-right">{item.price}</td>
                                                            <td className="px-6 py-4 text-xs font-black text-text-primary text-right">{item.totalValueDisplay}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-8 flex justify-between items-center px-4">
                                            <span className="text-xl font-black text-text-primary uppercase tracking-tight">Total Inventory Value</span>
                                            <span className="text-2xl font-black text-text-primary">
                                                ₱{project.inventory?.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Accomplishments' && (
                                    <div className="space-y-12 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center no-print">
                                            <p className="text-sm font-bold text-text-muted">Add side-by-side comparison views to show visual progress.</p>
                                            <button
                                                onClick={addComparisonView}
                                                className="bg-accent text-white hover:opacity-90 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-accent/20"
                                            >
                                                <Clock size={14} />
                                                Add Comparison View
                                            </button>
                                        </div>

                                        {accomplishmentViews.map((view, idx) => {
                                            const tasksWithAccomplishments = (() => {
                                                if (!project?.accomplishments) return [];
                                                const taskMap = new Map();
                                                project.accomplishments.forEach(a => {
                                                    if (a.task_id && a.title) {
                                                        taskMap.set(a.task_id, a.title);
                                                    }
                                                });
                                                return Array.from(taskMap.entries()).map(([id, title]) => ({ id, title }));
                                            })();

                                            const viewUpdateDates = project.accomplishments
                                                .filter(a => !view.taskId || String(a.task_id) === String(view.taskId))
                                                .map(a => a.date);

                                            const filteredBefore = project.accomplishments.filter(a => isSameDay(a.date, view.beforeDate) && (!view.taskId || String(a.task_id) === String(view.taskId)));
                                            const filteredAfter = project.accomplishments.filter(a => isSameDay(a.date, view.afterDate) && (!view.taskId || String(a.task_id) === String(view.taskId)));

                                            return (
                                                <div key={view.id} className="space-y-8 relative group">
                                                    {idx > 0 && <div className="border-t border-border-primary/50 pt-8" />}

                                                    {/* Comparison View Header */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Visual Comparison #{idx + 1}</span>
                                                        {accomplishmentViews.length > 1 && (
                                                            <button
                                                                onClick={() => removeComparisonView(view.id)}
                                                                className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest no-print"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="mb-4 no-print">
                                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-4 mb-2 block">Select Task (Optional)</label>
                                                        <select
                                                            value={view.taskId || ''}
                                                            onChange={(e) => updateViewDate(view.id, 'taskId', e.target.value)}
                                                            className="w-full px-4 py-3.5 bg-bg-secondary/50 border border-border-primary rounded-2xl text-xs font-bold text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
                                                        >
                                                            <option value="">All Tasks</option>
                                                            {tasksWithAccomplishments.map(t => (
                                                                <option key={t.id} value={t.id}>{t.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex gap-8 mb-4 no-print">
                                                        <div className="flex-1 space-y-3 relative">
                                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-4">Before Date</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCalendar(view.id, 'showBeforeCalendar')}
                                                                className={`w-full flex items-center gap-3 px-4 py-4 bg-bg-secondary/50 border rounded-2xl text-[11px] font-black text-text-primary transition-all shadow-sm group/btn ${view.showBeforeCalendar ? 'border-accent ring-4 ring-accent/5' : 'border-border-primary hover:border-accent/50'}`}
                                                            >
                                                                <Calendar className="text-accent w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                                {toDateString(view.beforeDate)}
                                                                <ChevronRight size={16} className={`ml-auto text-text-muted transition-transform ${view.showBeforeCalendar ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            {view.showBeforeCalendar && (
                                                                <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                                                                    <CustomMiniCalendar
                                                                        selectedDate={view.beforeDate}
                                                                        onSelectDate={(d) => updateViewDate(view.id, 'beforeDate', d)}
                                                                        updateDates={viewUpdateDates}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-3 relative">
                                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-4">After Date</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCalendar(view.id, 'showAfterCalendar')}
                                                                className={`w-full flex items-center gap-3 px-4 py-4 bg-bg-secondary/50 border rounded-2xl text-[11px] font-black text-text-primary transition-all shadow-sm group/btn ${view.showAfterCalendar ? 'border-accent ring-4 ring-accent/5' : 'border-border-primary hover:border-accent/50'}`}
                                                            >
                                                                <Calendar className="text-accent w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                                {toDateString(view.afterDate)}
                                                                <ChevronRight size={16} className={`ml-auto text-text-muted transition-transform ${view.showAfterCalendar ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            {view.showAfterCalendar && (
                                                                <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                                                                    <CustomMiniCalendar
                                                                        selectedDate={view.afterDate}
                                                                        onSelectDate={(d) => updateViewDate(view.id, 'afterDate', d)}
                                                                        updateDates={viewUpdateDates}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* BEFORE CARD */}
                                                        <div className="bg-bg-secondary/30 rounded-[40px] border border-border-primary shadow-xl overflow-hidden p-8 flex flex-col min-h-[500px] page-break-inside-avoid group/card hover:bg-bg-secondary/50 transition-all duration-500">
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div>
                                                                    <h4 className="text-2xl font-black text-text-primary tracking-tight">Before</h4>
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{toDateString(view.beforeDate)}</p>
                                                                </div>
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${filteredBefore.length > 0 ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-bg-tertiary text-text-muted border border-border-primary'
                                                                    }`}>
                                                                    {filteredBefore.length} updates
                                                                </span>
                                                            </div>
                                                            <div className="aspect-video bg-bg-tertiary rounded-3xl overflow-hidden mb-8 border border-border-primary flex items-center justify-center relative shadow-inner group-hover/card:border-accent/30 transition-all">
                                                                {filteredBefore.length > 0 ? (
                                                                    <img
                                                                        src={filteredBefore[0].image_url}
                                                                        alt="Before Progress"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="text-center p-8">
                                                                        <Camera size={32} className="text-text-muted/30 mx-auto mb-2" />
                                                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">No photo available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Taken By</p>
                                                                    <p className="text-xs font-bold text-text-primary">{filteredBefore[0]?.taken_by || '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Time</p>
                                                                    <p className="text-xs font-bold text-text-primary">{filteredBefore[0]?.time || '—'}</p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Notes</p>
                                                                    <p className="text-xs font-bold text-text-primary leading-snug">{filteredBefore[0]?.notes || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* AFTER CARD */}
                                                        <div className="bg-bg-secondary/30 rounded-[40px] border border-border-primary shadow-xl overflow-hidden p-8 flex flex-col min-h-[500px] page-break-inside-avoid group/card hover:bg-bg-secondary/50 transition-all duration-500">
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div>
                                                                    <h4 className="text-2xl font-black text-text-primary tracking-tight">After</h4>
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{toDateString(view.afterDate)}</p>
                                                                </div>
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${filteredAfter.length > 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-bg-tertiary text-text-muted border border-border-primary'
                                                                    }`}>
                                                                    {filteredAfter.length} updates
                                                                </span>
                                                            </div>
                                                            <div className="aspect-video bg-bg-tertiary rounded-3xl overflow-hidden mb-8 border border-border-primary flex items-center justify-center relative shadow-inner group-hover/card:border-emerald-500/30 transition-all">
                                                                {filteredAfter.length > 0 ? (
                                                                    <img
                                                                        src={filteredAfter[0].image_url}
                                                                        alt="After Progress"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="text-center p-8">
                                                                        <Camera size={32} className="text-text-muted/30 mx-auto mb-2" />
                                                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">No photo available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Taken By</p>
                                                                    <p className="text-xs font-bold text-text-primary">{filteredAfter[0]?.taken_by || '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Time</p>
                                                                    <p className="text-xs font-bold text-text-primary">{filteredAfter[0]?.time || '—'}</p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Notes</p>
                                                                    <p className="text-xs font-bold text-text-primary leading-snug">{filteredAfter[0]?.notes || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Document Footer */}
                <div className="bg-bg-secondary/50 border-t border-border-primary px-12 py-10 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mb-4">End of Report Preview</p>
                    <div className="h-1.5 w-16 bg-accent rounded-full shadow-[0_0_10px_rgba(124,116,255,0.3)]" />
                </div>
            </div>
        </div>
    );
}
