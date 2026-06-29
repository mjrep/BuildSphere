import logo from '../../assets/images/logo.png';
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Calendar, Printer, TrendingUp, Package, ListChecks, ArrowRight, Download, Filter, ArrowUpDown, MoreVertical, Camera, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#706BFF', '#00C6FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

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
        <div className="bg-card border border-border-primary rounded-2xl p-4  w-72 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                    <ChevronLeft size={18} className="text-text-muted" />
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-text-secondary">{MONTHS[viewMonth]} {viewYear}</span>
                <button type="button" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map(w => <div key={w} className="text-[10px] font-bold text-text-muted text-center uppercase py-1">{w}</div>)}
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
                                    ? 'bg-indigo-600 text-[#ffffff]  /30'
                                    : logDatesOnThisDay
                                        ? 'text-indigo-600 bg-indigo-50 hover:bg-[#e0e7ff]'
                                        : 'text-text-muted hover:bg-bg-secondary'
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

    // States for Accomplishments filtering - Object of project ID to Array of comparison pairs
    const [accomplishmentViews, setAccomplishmentViews] = useState({});

    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState(null); // 'pdf' | 'excel'

    const addComparisonView = (projectId) => {
        setAccomplishmentViews(prev => ({
            ...prev,
            [projectId]: [
                ...(prev[projectId] || []),
                {
                    id: Date.now(),
                    taskId: '',
                    beforeDate: new Date(),
                    afterDate: new Date(),
                    showBeforeCalendar: false,
                    showAfterCalendar: false,
                    beforeShift: 'All',
                    afterShift: 'All',
                    beforePhotoIndex: 0,
                    afterPhotoIndex: 0
                }
            ]
        }));
    };

    const removeComparisonView = (projectId, viewId) => {
        setAccomplishmentViews(prev => {
            const views = prev[projectId] || [];
            if (views.length > 1) {
                return { ...prev, [projectId]: views.filter(v => v.id !== viewId) };
            }
            return prev;
        });
    };

    const updateViewDate = (projectId, viewId, field, value) => {
        setAccomplishmentViews(prevViews => {
            const projectViews = prevViews[projectId] || [];
            const updatedProjectViews = projectViews.map(v => {
                if (v.id !== viewId) return v;

                const updatedView = { ...v, [field]: value };
                
                if (field === 'beforeDate' || field === 'afterDate') {
                    updatedView[`show${field.charAt(0).toUpperCase() + field.slice(1)}Calendar`] = false;
                }

                // Auto-load previous date into beforeDate if afterDate is selected
                if (field === 'afterDate') {
                    const project = reportData && reportData.find(p => p.id === projectId);
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
            });
            return { ...prevViews, [projectId]: updatedProjectViews };
        });
    };

    const toggleCalendar = (projectId, viewId, field) => {
        setAccomplishmentViews(prev => {
            const views = prev[projectId] || [];
            return {
                ...prev,
                [projectId]: views.map(v => v.id === viewId ? { ...v, [field]: !v[field] } : v)
            };
        });
    };
    const handleExportPDF = async () => {
        try {
            setIsExporting(true);
            setExportType('pdf');

            // Wait for React to re-render and display all sections (animations disabled)
            await new Promise(resolve => setTimeout(resolve, 800));

            const element = document.getElementById('report-export-container');

            const opt = {
              margin:       [10, 0, 10, 0],
              filename:     `BuildSphere_Report_${new Date().toISOString().split('T')[0]}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false, ignoreElements: (el) => el.hasAttribute && el.hasAttribute('data-html2canvas-ignore') },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak:    { mode: ['css', 'legacy'] }
            };

            await html2pdf().set(opt).from(element).save();

            toast.success('PDF report downloaded');
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast.error('Failed to generate PDF: ' + (err.message || 'Unknown error'));
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
                beforeShift: v.beforeShift,
                afterShift: v.afterShift,
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
            <div className="flex flex-col items-center justify-center py-24 text-text-muted">
                <div className="p-6 bg-bg-secondary rounded-full mb-6">
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
            {isExporting && (
                <div data-html2canvas-ignore="true" className="fixed inset-0 z-[999] bg-bg-primary/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <span className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin mb-6 shadow-[0_0_15px_rgba(124,116,255,0.5)]" />
                    <span className="text-xl font-black text-text-primary tracking-[0.2em] uppercase">Compiling Document</span>
                    <span className="text-xs font-bold text-text-muted mt-2 uppercase tracking-widest">Please wait while we format your report</span>
                </div>
            )}

            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-[80] bg-card/80 backdrop-blur-md border-b border-border-primary px-8 py-3 flex items-center justify-between ">
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
                        className="flex items-center gap-2 px-6 py-2.5 bg-accent text-[#ffffff] rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all   active:scale-95 disabled:opacity-50"
                    >
                        <FileText size={16} />
                        {isExporting && exportType === 'pdf' ? 'Compiling PDF...' : 'Export to PDF'}
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#10b981] text-[#ffffff] rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all  /20 active:scale-95 disabled:opacity-50"
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
                    .max-w-\\[1000px\\] { max-width: 100% !important; margin: 0 !important; border: none !important; box-: none !important; }
                    .bg-bg-tertiary { background: white !important; }
                    . { box-: none !important; }
                    .rounded-3xl { border-radius: 0 !important; }
                    .p-12 { padding: 0 !important; }
                    .mt-12 { margin-top: 0 !important; }
                    .animate-in { animation: none !important; }
                    .sticky { position: static !important; }
                    .overflow-hidden { overflow: visible !important; }
                }
                .pdf-page-break {
                    page-break-before: always !important;
                    break-before: page !important;
                }
                .pdf-avoid-break {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                .pdf-comparison-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 16px !important;
                }
                .pdf-card {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    border-radius: 16px !important;
                    padding: 16px !important;
                    min-height: auto !important;
                }
                .pdf-card-image {
                    height: 200px !important;
                    border-radius: 12px !important;
                    margin-bottom: 12px !important;
                }
            `}} />

            {/* Centered Document Page */}
            <div id="report-export-container" className={`mx-auto mt-12 min-h-[1400px] max-w-[1000px] w-full transition-none relative pb-12 ${isExporting ? 'bg-[#ffffff] !border-none !shadow-none !rounded-none max-w-none px-12 pt-0 pb-8' : 'bg-card rounded-[40px] overflow-hidden border border-border-primary shadow-sm'}`}>

                
                {/* Document Header */}
                <div className={`border-b border-border-primary px-12 ${isExporting ? 'pt-0' : 'pt-10'}`}>
                    {isExporting ? (
                        <div className="mb-12">
                            {/* Letterhead */}
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <img src={logo} alt="Company Logo" className="w-12 h-12 object-contain" />
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black tracking-[0.1em] text-[#000000] leading-none">CITYSCAPE</span>
                                        <span className="text-[10px] font-bold tracking-[0.1em] text-[#000000] mt-1">BUILDERS INC.</span>
                                    </div>
                                </div>
                                <div className="flex h-10 w-[60%] justify-end">
                                    <div className="bg-[#0b1f5c] h-full w-[85%]"></div>
                                    <div className="bg-[#cc181e] h-full w-[15%]"></div>
                                </div>
                            </div>
                            
                            {/* Report Title */}
                            <div>
                                <h2 className="text-[40px] font-black text-[#0b1f5c] tracking-tighter uppercase mb-4 leading-none">Project Report Preview</h2>
                                <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">
                                    {config?.startDate} — {config?.endDate}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-text-primary tracking-tighter">Project Report Preview</h2>
                                <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mt-1">
                                    {config?.startDate} — {config?.endDate}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-secondary text-[10px] font-black text-text-muted uppercase tracking-tighter border border-border-primary">
                                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                                Live Preview
                            </div>
                        </div>
                    )}

                    {!isExporting && (
                        <div className="flex gap-8">
                            {tabs.map(tab => (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`pb-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.name ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
                                >
                                    {tab.name}
                                    {activeTab === tab.name && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-full shadow-[0_0_10px_rgba(124,116,255,0.4)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Document Content Area */}
                <div className="p-12 space-y-16">
                    {reportData.map((project) => {
                        const updateDates = Array.from(new Set(project.accomplishments.map(a => toDateString(a.date)))).filter(Boolean);

                        return (
                            <div key={project.id} className="space-y-12">
                                {/* Project Title Marker */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-10 w-2 bg-accent rounded-full -[0_0_12px_rgba(124,116,255,0.4)]" />
                                    <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">{project.name}</h3>
                                </div>

                                {(activeTab === 'Progress Analysis' || isExporting) && (
                                    <div className="bg-card rounded-3xl border border-border-primary  overflow-hidden animate-in fade-in duration-500 mb-8">
                                        <div className="bg-bg-secondary py-4 px-8 border-b border-border-primary flex items-center justify-between">
                                            <span className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">Progress Analysis Report</span>
                                        </div>
                                        {project.progress?.phases && project.progress.phases.length > 0 && (
                                            <div className="p-8 border-b border-border-primary">
                                                <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Milestone Completion Rate</h4>
                                                
<div className="h-64 w-full flex justify-center">
    {isExporting ? (
        <BarChart width={900} height={256} data={project.progress.phases.flatMap(p => p.milestones).map(m => ({ name: m.milestone_name, progress: m.progress_percentage || 0 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Bar dataKey="progress" fill="#706BFF" radius={[4, 4, 0, 0]} isAnimationActive={false} barSize={40} />
        </BarChart>
    ) : (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={project.progress.phases.flatMap(p => p.milestones).map(m => ({ name: m.milestone_name, progress: m.progress_percentage || 0 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <RechartsTooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} formatter={(value) => [`${value}%`, 'Progress']} labelFormatter={(label) => label} />
                <Bar dataKey="progress" fill="url(#colorProgress)" radius={[4, 4, 0, 0]} barSize={60} />
                <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#706BFF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00C6FF" stopOpacity={0.8}/>
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    )}
</div>

                                            </div>
                                        )}
                                        <table className="w-full text-left">
                                            {/* Progress Status Summary Header */}
                                            <thead className="bg-bg-secondary border-b border-border-primary">
                                                <tr>
                                                    <th colSpan="4" className="px-8 py-4 text-[11px] font-black text-accent uppercase tracking-widest bg-accent">
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
                                            {(!project.progress?.phases || project.progress.phases.length === 0) ? (
                                                <tbody>
                                                    <tr>
                                                        <td colSpan="4" className="px-8 py-6 text-center text-sm text-text-muted italic">No milestones found.</td>
                                                    </tr>
                                                </tbody>
                                            ) : project.progress.phases.flatMap(phase => phase.milestones).map((m, i) => {
                                                const milestoneTasks = project.completedTasks?.filter(t => t.milestone_id === m.id) || [];
                                                return (
                                                    <tbody key={`m-${m.id}-${i}`} className="divide-y divide-border-primary/30" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                        <tr className="bg-bg-secondary hover:bg-bg-hover transition-colors pdf-avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                            <td className="px-8 py-4 text-xs font-bold text-text-primary">{m.milestone_name}</td>
                                                            <td className="px-8 py-4 text-xs font-bold text-text-secondary text-center">{m.progress_percentage || 0}%</td>
                                                            <td className="px-8 py-4 text-xs font-bold text-center">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${m.progress_percentage === 100 ? 'bg--100 text-[#059669]' : 'bg--100 text-[#d97706]'}`}>
                                                                    {m.progress_percentage === 100 ? 'Completed' : 'Ongoing'}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-4 text-xs font-bold text-text-secondary text-right">
                                                                {m.progress_percentage === 100 ? (m.end_date || '—') : '—'}
                                                            </td>
                                                        </tr>
                                                        {milestoneTasks.map((task, tIdx) => (
                                                            <tr key={`t-${task.id}-${tIdx}`} className="hover:bg-bg-hover transition-colors pdf-avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-text-secondary pl-12 flex items-center gap-2">
                                                                    {task.title}
                                                                </td>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-center"></td>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.status === 'completed' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                                                                        {task.status === 'completed' ? 'Completed' : 'Ongoing'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-right">
                                                                    {task.status === 'completed' ? (task.date || '—') : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                );
                                            })}
                                            {(() => {
                                                const unassignedTasks = project.completedTasks?.filter(t => !t.milestone_id || !project.progress?.phases?.flatMap(p => p.milestones).some(m => m.id === t.milestone_id)) || [];
                                                if (unassignedTasks.length > 0) {
                                                    return (
                                                        <tbody className="divide-y divide-border-primary/30" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                            {unassignedTasks.map((task, tIdx) => (
                                                                <tr key={`t-u-${tIdx}`} className="hover:bg-bg-hover transition-colors pdf-avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-text-secondary pl-12 flex items-center gap-2">
                                                                        {task.title} (Uncategorized)
                                                                    </td>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-center"></td>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-center">
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.status === 'completed' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                                                                            {task.status === 'completed' ? 'Completed' : 'Ongoing'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-3 text-[11px] font-medium text-text-secondary text-right">
                                                                        {task.status === 'completed' ? (task.date || '—') : '—'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {/* Summary Header */}
                                            <thead className="bg-bg-secondary border-y border-border-primary">
                                                <tr>
                                                    <th colSpan="4" className="px-8 py-4 text-[11px] font-black text-accent uppercase tracking-widest bg-accent mt-4">
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
                                                    <td className="px-8 py-6 text-xl font-black text-[#10b981] text-right">
                                                        {project.progress?.project_progress || 0}%
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {isExporting && <div className="pdf-page-break" />}

                                {(activeTab === 'Inventory Summary' || isExporting) && (
                                    <div className={`animate-in fade-in duration-500 mb-8 pdf-avoid-break ${isExporting ? '' : 'bg-card rounded-3xl border border-border-primary overflow-hidden p-8'}`} style={isExporting ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : undefined}>
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-text-primary tracking-tight">Inventory Summary</h3>
                                        </div>
                                        {project.inventory && project.inventory.length > 0 && (() => {
                                            const plannedBudget = parseFloat(project.budget_for_materials) || 0;
                                            const actualCosts = Object.values(project.inventory.reduce((acc, item) => {
                                                const val = parseFloat(item.totalValue) || 0;
                                                if (acc[item.item]) acc[item.item].value += val;
                                                else acc[item.item] = { name: item.item, value: val };
                                                return acc;
                                            }, {}));
                                            
                                            const totalActual = actualCosts.reduce((sum, i) => sum + i.value, 0);
                                            const remaining = Math.max(0, plannedBudget - totalActual);
                                            const isOverBudget = totalActual > plannedBudget && plannedBudget > 0;
                                            
                                            const pieData = [...actualCosts];
                                            if (remaining > 0) {
                                                pieData.push({ name: 'Remaining Budget', value: remaining, isRemaining: true });
                                            }

                                            return (
                                                <div className={`grid gap-8 mb-8 items-start ${isExporting ? 'grid-cols-2 page-break-inside-avoid' : 'grid-cols-1 md:grid-cols-2 border border-border-primary rounded-2xl p-8 bg-bg-secondary'}`}>
                                                    <div className="flex flex-col h-full">
                                                        
<div className="h-64 relative mb-6 flex justify-center items-center w-full">
    {isExporting ? (
        <PieChart width={300} height={250}>
            <Pie
                data={pieData}
                cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={0} dataKey="value"
                isAnimationActive={false}
                stroke="none"
            >
                {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isRemaining ? 'var(--border-primary)' : PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
            </Pie>
        </PieChart>
    ) : (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={0} dataKey="value"
                    isAnimationActive={true}
                    stroke="none"
                >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isRemaining ? 'var(--border-primary)' : PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <RechartsTooltip 
                    formatter={(value) => `₱${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} 
                />
            </PieChart>
        </ResponsiveContainer>
    )}
</div>

                                                        <div className="flex flex-col gap-4 px-2 w-full mt-2">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-primary mb-1">Actual</p>
                                                                <p className={`text-xl font-black ${isOverBudget ? 'text-red-500' : 'text-[#5B9C2A]'}`}>
                                                                    ₱{totalActual.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-primary mb-1">Planned</p>
                                                                <p className="text-xl font-black text-text-primary">
                                                                    ₱{plannedBudget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center border-b border-border-primary pb-3">
                                                            <h4 className="text-xs font-black text-text-muted uppercase tracking-widest leading-none">Material Cost Breakdown</h4>
                                                            {plannedBudget > 0 && (
                                                                <span className={`text-[10px] font-black uppercase leading-none flex items-center justify-center ${isOverBudget ? 'text-[#dc2626]' : 'text-[#5B9C2A]'}`}>
                                                                    {isOverBudget ? 'Over Budget' : 'On Budget'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] font-medium text-text-secondary leading-relaxed mb-4">
                                                            This chart illustrates your exact material costs mapped against your planned budget. The colored segments represent individual items purchased, while the gray area represents the remaining budget.
                                                        </p>
                                                        
                                                        <div className={`pr-2 space-y-3 mt-4 pb-4 ${isExporting ? '' : 'max-h-[320px] overflow-y-auto custom-scrollbar'}`}>
                                                            {actualCosts.map((item, idx) => (
                                                                <div key={idx} className="flex items-center justify-between page-break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="w-3 h-3 rounded-full " style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                                                                        <span className="text-xs font-bold text-text-primary break-words pr-2" title={item.name}>{item.name}</span>
                                                                    </div>
                                                                    <span className="text-xs font-black text-text-secondary">₱{item.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        {isOverBudget && (
                                                            <div className="p-4 rounded-xl border border--200 bg--100 mt-4">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-1">Budget Exceeded</span>
                                                                <span className="text-[11px] font-bold text-text-primary leading-relaxed block">Your actual material costs have exceeded the planned budget. The chart visually reflects this overrun.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        <div className="overflow-hidden border border-border-primary rounded-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-bg-secondary">
                                                    <tr>
                                                        <th className="px-3 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider">Item Name</th>
                                                        <th className="px-3 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider">Category</th>
                                                        <th className="px-3 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-center">Total Purchased</th>
                                                        <th className="px-3 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-center">In Stock</th>
                                                        <th className="px-3 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">Unit Price</th>
                                                        <th className="px-3 py-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">Total Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-primary/20">
                                                    {(!project.inventory || project.inventory.length === 0) ? (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-10 text-center text-sm text-text-muted italic">No inventory items found.</td>
                                                        </tr>
                                                    ) : project.inventory.map((item, i) => (
                                                        <tr key={i} className="hover:bg-bg-hover transition-colors">
                                                            <td className="px-3 py-4 text-xs font-bold text-text-primary">{item.item}</td>
                                                            <td className="px-3 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.category === 'Materials' ? 'bg--100 text-[#ca8a04]' : 'bg--100 text-[#db2777]'
                                                                    }`}>
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4 text-xs font-bold text-text-secondary text-center">{item.received || item.stock}</td>
                                                            <td className="px-3 py-4 text-xs font-bold text-text-secondary text-center">{item.stock}</td>
                                                            <td className="px-3 py-4 text-xs font-bold text-text-secondary text-right">{item.price}</td>
                                                            <td className="px-3 py-4 text-xs font-black text-text-primary text-right">{item.totalValueDisplay}</td>
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

                                {isExporting && <div className="pdf-page-break" />}

                                {(activeTab === 'Accomplishments' || isExporting) && (
                                    <div className={`${isExporting ? 'space-y-8' : 'space-y-12'} animate-in fade-in duration-500`}>
                                        {isExporting && (
                                            <div className="border-b border-border-primary pb-4 mb-4">
                                                <h3 className="text-xl font-black text-accent uppercase tracking-widest">Accomplishments & Progress Photos</h3>
                                            </div>
                                        )}
                                        {!isExporting && (
<div className="flex justify-between items-center no-print">
                                            <p className="text-sm font-bold text-text-muted">Add side-by-side comparison views to show visual progress.</p>
                                            <button
                                                onClick={() => addComparisonView(project.id)}
                                                className="bg-accent text-[#ffffff] hover:opacity-90 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2  "
                                            >
                                                <Clock size={14} />
                                                Add Comparison View
                                            </button>
</div>
)}

                                        {(accomplishmentViews[project.id] || []).map((view, idx) => {
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

                                            const filteredBefore = project.accomplishments.filter(a => 
                                                isSameDay(a.date, view.beforeDate) && 
                                                (!view.taskId || String(a.task_id) === String(view.taskId)) &&
                                                (view.beforeShift === 'All' || a.shift === view.beforeShift)
                                            );
                                            const filteredAfter = project.accomplishments.filter(a => 
                                                isSameDay(a.date, view.afterDate) && 
                                                (!view.taskId || String(a.task_id) === String(view.taskId)) &&
                                                (view.afterShift === 'All' || a.shift === view.afterShift)
                                            );

                                            const beforeImages = filteredBefore[0]?.image_url ? filteredBefore[0].image_url.split(',').map(u => u.trim()).filter(Boolean) : [];
                                            const afterImages = filteredAfter[0]?.image_url ? filteredAfter[0].image_url.split(',').map(u => u.trim()).filter(Boolean) : [];


                                            return (
                                                <div key={view.id} className="space-y-8 relative group">
                                                    {idx > 0 && <div className="border-t border-border-primary pt-8" />}

                                                    {/* Comparison View Header */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">COMPARISON VIEW #{idx + 1}</span>
                                                        {!isExporting && (accomplishmentViews[project.id] || []).length > 1 && (
                                                            <button
                                                                onClick={() => removeComparisonView(project.id, view.id)}
                                                                className="text-red-500 hover:text-[#dc2626] text-[10px] font-black uppercase tracking-widest no-print"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    {!isExporting && (
<div className="mb-4 no-print">
                                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-4 mb-2 block">Select Task (Optional)</label>
                                                        <select
                                                            value={view.taskId || ''}
                                                            onChange={(e) => updateViewDate(project.id, view.id, 'taskId', e.target.value)}
                                                            className="w-full px-4 py-3.5 bg-bg-secondary border border-border-primary rounded-2xl text-xs font-bold text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
                                                        >
                                                            <option value="">All Tasks</option>
                                                            {tasksWithAccomplishments.map(t => (
                                                                <option key={t.id} value={t.id}>{t.title}</option>
                                                            ))}
                                                        </select>
                                                    </div> 
)}

                                                    {!isExporting && (
<div className="flex gap-8 mb-4 no-print">
                                                        <div className="flex-1 space-y-3 relative">
                                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-4">Before Date</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCalendar(project.id, view.id, 'showBeforeCalendar')}
                                                                className={`w-full flex items-center gap-3 px-4 py-4 bg-bg-secondary border rounded-2xl text-[11px] font-black text-text-primary transition-all  group/btn ${view.showBeforeCalendar ? 'border-accent  ' : 'border-border-primary hover:border-accent'}`}
                                                            >
                                                                <Calendar className="text-accent w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                                {toDateString(view.beforeDate)}
                                                                <ChevronRight size={16} className={`ml-auto text-text-muted transition-transform ${view.showBeforeCalendar ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            {view.showBeforeCalendar && (
                                                                <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                                                                    <CustomMiniCalendar
                                                                        selectedDate={view.beforeDate}
                                                                        onSelectDate={(d) => updateViewDate(project.id, view.id, 'beforeDate', d)}
                                                                        updateDates={viewUpdateDates}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <select
                                                                    value={view.beforeShift}
                                                                    onChange={(e) => { updateViewDate(project.id, view.id, 'beforeShift', e.target.value); updateViewDate(project.id, view.id, 'beforePhotoIndex', 0); }}
                                                                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-xl text-[10px] font-black text-text-primary uppercase tracking-widest focus:outline-none focus:border-accent"
                                                                >
                                                                    <option value="All">All Shifts</option>
                                                                    <option value="Morning">Morning</option>
                                                                    <option value="Noon">Noon</option>
                                                                    <option value="Afternoon">Afternoon</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 space-y-3 relative">
                                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-4">After Date</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCalendar(project.id, view.id, 'showAfterCalendar')}
                                                                className={`w-full flex items-center gap-3 px-4 py-4 bg-bg-secondary border rounded-2xl text-[11px] font-black text-text-primary transition-all  group/btn ${view.showAfterCalendar ? 'border-accent  ' : 'border-border-primary hover:border-accent'}`}
                                                            >
                                                                <Calendar className="text-accent w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                                {toDateString(view.afterDate)}
                                                                <ChevronRight size={16} className={`ml-auto text-text-muted transition-transform ${view.showAfterCalendar ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            {view.showAfterCalendar && (
                                                                <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                                                                    <CustomMiniCalendar
                                                                        selectedDate={view.afterDate}
                                                                        onSelectDate={(d) => updateViewDate(project.id, view.id, 'afterDate', d)}
                                                                        updateDates={viewUpdateDates}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <select
                                                                    value={view.afterShift}
                                                                    onChange={(e) => { updateViewDate(view.id, 'afterShift', e.target.value); updateViewDate(view.id, 'afterPhotoIndex', 0); }}
                                                                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-xl text-[10px] font-black text-text-primary uppercase tracking-widest focus:outline-none focus:border-accent"
                                                                >
                                                                    <option value="All">All Shifts</option>
                                                                    <option value="Morning">Morning</option>
                                                                    <option value="Noon">Noon</option>
                                                                    <option value="Afternoon">Afternoon</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
)}
<div className={`grid gap-8 ${isExporting ? 'grid-cols-2 pdf-comparison-grid' : 'grid-cols-1 md:grid-cols-2'}`} style={isExporting ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : undefined}>
                                                        
                                                        
                                                        
                                                        {/* BEFORE CARD */}
                                                        <div className={`overflow-hidden flex flex-col group/card transition-all duration-500 bg-bg-secondary border border-border-primary ${isExporting ? 'rounded-2xl p-4 pdf-card' : 'rounded-[40px] p-8 min-h-[500px]'}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                            <div className="flex justify-between items-center mb-4">
                                                                <div>
                                                                    <h4 className={`font-black tracking-tight text-text-primary uppercase ${isExporting ? 'text-base' : 'text-2xl'}`}>Before</h4>
                                                                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">{toDateString(view.beforeDate)}</p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${filteredBefore.length > 0 ? 'bg-accent text-[#ffffff]' : 'bg-bg-tertiary text-text-muted border border-border-primary'}`}>
                                                                    {filteredBefore.length} {filteredBefore.length === 1 ? 'update' : 'updates'}
                                                                </span>
                                                            </div>
                                                            <div className={`w-full relative bg-[#f8f9fa] overflow-hidden border border-border-primary flex items-center justify-center ${isExporting ? 'h-[200px] rounded-xl mb-4 pdf-card-image' : 'h-[300px] rounded-3xl mb-8'}`}>
                                                                {beforeImages.length > 0 ? (
                                                                    <>
                                                                        <img
                                                                            src={beforeImages[view.beforePhotoIndex]}
                                                                            alt="Before Progress"
                                                                            crossOrigin="anonymous"
                                                                            className="max-w-full max-h-full w-auto h-auto object-contain p-2"
                                                                        />
                                                                        {!isExporting && beforeImages.length > 1 && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); updateViewDate(project.id, view.id, 'beforePhotoIndex', Math.max(0, view.beforePhotoIndex - 1)); }}
                                                                                    disabled={view.beforePhotoIndex === 0}
                                                                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#000000]/70 text-white backdrop-blur-md hover:bg-[#000000] disabled:opacity-30 transition-all z-10 shadow-xl no-print flex items-center justify-center border border-white/20"
                                                                                >
                                                                                    <ChevronLeft size={24} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); updateViewDate(project.id, view.id, 'beforePhotoIndex', Math.min(beforeImages.length - 1, view.beforePhotoIndex + 1)); }}
                                                                                    disabled={view.beforePhotoIndex === beforeImages.length - 1}
                                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#000000]/70 text-white backdrop-blur-md hover:bg-[#000000] disabled:opacity-30 transition-all z-10 shadow-xl no-print flex items-center justify-center border border-white/20"
                                                                                >
                                                                                    <ChevronRight size={24} />
                                                                                </button>
                                                                                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#000000]/70 backdrop-blur-md text-[#ffffff] text-[10px] font-black z-10 no-print border border-white/20">
                                                                                    {view.beforePhotoIndex + 1} / {beforeImages.length}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="text-center p-8 py-20 w-full">
                                                                        <Camera size={32} className="text-text-muted mx-auto mb-2" />
                                                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">No photo available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`grid grid-cols-2 flex-1 ${isExporting ? 'gap-x-4 gap-y-3' : 'gap-x-8 gap-y-6'}`}>
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
                                                        <div className={`overflow-hidden flex flex-col group/card transition-all duration-500 bg-bg-secondary border border-border-primary ${isExporting ? 'rounded-2xl p-4 pdf-card' : 'rounded-[40px] p-8 min-h-[500px]'}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                            <div className="flex justify-between items-center mb-4">
                                                                <div>
                                                                    <h4 className={`font-black text-text-primary tracking-tight uppercase ${isExporting ? 'text-base' : 'text-2xl'}`}>After</h4>
                                                                    <p className="text-[10px] font-black text-[#059669] uppercase tracking-widest">{toDateString(view.afterDate)}</p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${filteredAfter.length > 0 ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]' : 'bg-bg-tertiary text-text-muted border border-border-primary'}`}>
                                                                    {filteredAfter.length} {filteredAfter.length === 1 ? 'update' : 'updates'}
                                                                </span>
                                                            </div>
                                                            <div className={`w-full relative bg-[#f8f9fa] overflow-hidden border border-border-primary flex items-center justify-center group/img ${isExporting ? 'h-[200px] rounded-xl mb-4 pdf-card-image' : 'h-[300px] rounded-3xl mb-8'}`}>
                                                                {afterImages.length > 0 ? (
                                                                    <>
                                                                        <img
                                                                            src={afterImages[view.afterPhotoIndex]}
                                                                            alt="After Progress"
                                                                            crossOrigin="anonymous"
                                                                            className="max-w-full max-h-full w-auto h-auto object-contain p-2"
                                                                        />
                                                                        {!isExporting && afterImages.length > 1 && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); updateViewDate(project.id, view.id, 'afterPhotoIndex', Math.max(0, view.afterPhotoIndex - 1)); }}
                                                                                    disabled={view.afterPhotoIndex === 0}
                                                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#e5e7eb] text-[#ffffff] backdrop-blur-sm opacity-0 group-hover/img:opacity-100 disabled:opacity-30 transition-all hover:bg-[#e5e7eb] z-10 no-print"
                                                                                >
                                                                                    <ChevronLeft size={18} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); updateViewDate(project.id, view.id, 'afterPhotoIndex', Math.min(afterImages.length - 1, view.afterPhotoIndex + 1)); }}
                                                                                    disabled={view.afterPhotoIndex === afterImages.length - 1}
                                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#e5e7eb] text-[#ffffff] backdrop-blur-sm opacity-0 group-hover/img:opacity-100 disabled:opacity-30 transition-all hover:bg-[#e5e7eb] z-10 no-print"
                                                                                >
                                                                                    <ChevronRight size={18} />
                                                                                </button>
                                                                                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-[#e5e7eb] backdrop-blur-sm text-[#ffffff] text-[9px] font-bold z-10 no-print">
                                                                                    {view.afterPhotoIndex + 1} / {afterImages.length}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="text-center p-8">
                                                                        <Camera size={32} className="text-text-muted mx-auto mb-2" />
                                                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">No photo available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`grid grid-cols-2 flex-1 ${isExporting ? 'gap-x-4 gap-y-3' : 'gap-x-8 gap-y-6'}`}>
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
                <div className="bg-bg-secondary border-t border-border-primary px-12 py-10 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mb-4">End of Report Preview</p>
                    <div className="h-1.5 w-16 bg-accent rounded-full -[0_0_10px_rgba(124,116,255,0.3)]" />
                </div>
            </div>
        </div>
    );
}
