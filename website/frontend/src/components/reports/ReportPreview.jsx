import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Calendar, Printer, TrendingUp, Package, ListChecks, ArrowRight, Download, Filter, ArrowUpDown, MoreVertical, Camera, Clock, User } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS for Calendar
   ═══════════════════════════════════════════════════════════════════════════ */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['S','M','T','W','T','F','S'];

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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl w-72 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft size={18} className="text-slate-400" />
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">{MONTHS[viewMonth]} {viewYear}</span>
                <button type="button" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
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
                            className={`h-9 w-full flex items-center justify-center text-xs font-bold rounded-xl relative transition-all ${
                                isSelected 
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
    const [activeTab, setActiveTab] = useState('Progress Analysis');
    
    // States for Accomplishments filtering
    const [beforeDate, setBeforeDate] = useState(config?.startDate ? new Date(config.startDate) : new Date());
    const [afterDate, setAfterDate] = useState(config?.endDate ? new Date(config.endDate) : new Date());
    const [showBeforeCalendar, setShowBeforeCalendar] = useState(false);
    const [showAfterCalendar, setShowAfterCalendar] = useState(false);

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
        { name: 'Progress Analysis', icon: TrendingUp },
        { name: 'Inventory Summary', icon: Package },
        { name: 'Accomplishments', icon: ListChecks }
    ];

    return (
        <div className="min-h-screen bg-slate-100 -m-6 pb-32">
            
            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-900 group transition-all"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Builder
                </button>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                        <FileText size={16} />
                        Export to PDF
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                        <FileSpreadsheet size={16} />
                        Export to Excel
                    </button>
                </div>
            </div>

            {/* Centered Document Page */}
            <div className="max-w-[1000px] mx-auto mt-12 bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[1400px]">
                
                {/* Document Header (Internal Tabs) */}
                <div className="border-b border-slate-100 px-12 pt-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Project Report Preview</h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {config?.startDate} — {config?.endDate}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Preview
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${
                                    activeTab === tab.name ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab.name}
                                {activeTab === tab.name && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Document Content Area */}
                <div className="p-12 space-y-16">
                    {reportData.map((project) => {
                        const updateDates = Array.from(new Set(project.accomplishments.map(a => toDateString(a.date)))).filter(Boolean);
                        const filteredBefore = project.accomplishments.filter(a => isSameDay(a.date, beforeDate));
                        const filteredAfter = project.accomplishments.filter(a => isSameDay(a.date, afterDate));

                        return (
                            <div key={project.id} className="space-y-12">
                                {/* Project Title Marker */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-10 w-2 bg-indigo-600 rounded-full" />
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{project.name}</h3>
                                </div>

                                {activeTab === 'Progress Analysis' && (
                                    <div className="space-y-12">
                                        {/* Progress Status Summary Table */}
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50 py-3 px-8 text-center border-b border-slate-200">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Progress Status Summary</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-white border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Project Name</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Milestone</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Date finished</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(!project.progress?.phases || project.progress.phases.flatMap(p => p.milestones.filter(m => m.progress_percentage === 100)).length === 0) ? (
                                                        <tr>
                                                            <td colSpan="3" className="px-8 py-8 text-center text-sm text-slate-400 italic">No completed milestones found.</td>
                                                        </tr>
                                                    ) : project.progress.phases.flatMap(phase => 
                                                        phase.milestones.filter(m => m.progress_percentage === 100).map((m) => (
                                                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{project.name}</td>
                                                                <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{m.milestone_name}</td>
                                                                <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{m.end_date || 'N/A'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Progress Report Table */}
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50 py-3 px-8 text-center border-b border-slate-200">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Completed Works</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-white border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Project Name</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Task</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Task Owner</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Date finished</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(!project.completedTasks || project.completedTasks.length === 0) ? (
                                                        <tr>
                                                            <td colSpan="4" className="px-8 py-8 text-center text-sm text-slate-400 italic">No completed tasks found.</td>
                                                        </tr>
                                                    ) : project.completedTasks.map((task, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{project.name}</td>
                                                            <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{task.title}</td>
                                                            <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{task.taken_by}</td>
                                                            <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{task.date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Summary Table */}
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50 py-3 px-8 text-center border-b border-slate-200">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Summary</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-white border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Project Name</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Accomplishments</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tasks Completed</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Progress %</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{project.name}</td>
                                                        <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">
                                                            {project.progress?.phases?.reduce((acc, p) => acc + (p.milestones?.filter(m => m.progress_percentage === 100).length || 0), 0) || 0}
                                                        </td>
                                                        <td className="px-8 py-4 text-xs font-bold text-slate-700 text-center">{project.completedTasks?.length || 0}</td>
                                                        <td className="px-8 py-4 text-sm font-black text-emerald-500 text-center">{project.progress?.project_progress || 0}%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Inventory Summary' && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Inventory Summary</h3>
                                        </div>
                                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50/50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Item Name</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">In Stock</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Min. Stock</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {(!project.inventory || project.inventory.length === 0) ? (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-400 italic">No inventory items found.</td>
                                                        </tr>
                                                    ) : project.inventory.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.item}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                                    item.category === 'Materials' ? 'bg-yellow-100 text-yellow-700' : 'bg-pink-100 text-pink-700'
                                                                }`}>
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-600 text-center">{item.stock}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-600 text-center">{item.minStock}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.price}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                                    item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-8 flex justify-between items-center px-4">
                                            <span className="text-xl font-black text-slate-900 uppercase">Total Inventory Value</span>
                                            <span className="text-2xl font-black text-slate-900">
                                                ₱{project.inventory?.reduce((sum, item) => sum + (parseFloat(item.price.replace(/[^\d.]/g, '')) || 0), 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Accomplishments' && (
                                    <div className="space-y-12">
                                        {/* Custom Date Filter with Calendar Highlights */}
                                        <div className="flex gap-8 mb-4">
                                            <div className="flex-1 space-y-3 relative">
                                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Before Date</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => { setShowBeforeCalendar(!showBeforeCalendar); setShowAfterCalendar(false); }}
                                                    className="w-full flex items-center justify-between pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 hover:border-indigo-300 transition-all shadow-sm group"
                                                >
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    {toDateString(beforeDate)}
                                                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${showBeforeCalendar ? 'rotate-90' : ''}`} />
                                                </button>
                                                {showBeforeCalendar && (
                                                    <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                                                        <CustomMiniCalendar 
                                                            selectedDate={beforeDate} 
                                                            onSelectDate={(d) => { setBeforeDate(d); setShowBeforeCalendar(false); }} 
                                                            updateDates={updateDates} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-3 relative">
                                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">After Date</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => { setShowAfterCalendar(!showAfterCalendar); setShowBeforeCalendar(false); }}
                                                    className="w-full flex items-center justify-between pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 hover:border-indigo-300 transition-all shadow-sm group"
                                                >
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    {toDateString(afterDate)}
                                                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${showAfterCalendar ? 'rotate-90' : ''}`} />
                                                </button>
                                                {showAfterCalendar && (
                                                    <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                                                        <CustomMiniCalendar 
                                                            selectedDate={afterDate} 
                                                            onSelectDate={(d) => { setAfterDate(d); setShowAfterCalendar(false); }} 
                                                            updateDates={updateDates} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Before/After View */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* BEFORE CARD */}
                                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8 flex flex-col min-h-[500px]">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h4 className="text-2xl font-black text-slate-900">Before</h4>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{toDateString(beforeDate)}</p>
                                                    </div>
                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                                                        filteredBefore.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {filteredBefore.length} updates
                                                    </span>
                                                </div>
                                                <div className="aspect-video bg-slate-50 rounded-3xl overflow-hidden mb-8 border border-slate-100 flex items-center justify-center relative shadow-inner">
                                                    {filteredBefore.length > 0 ? (
                                                        <img 
                                                            src={filteredBefore[0].image_url} 
                                                            alt="Before Progress" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-center p-8">
                                                            <Camera size={32} className="text-slate-200 mx-auto mb-2" />
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">No photo on this date</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taken By</p>
                                                        <p className="text-xs font-bold text-slate-900">{filteredBefore[0]?.taken_by || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                                        <p className="text-xs font-bold text-slate-900">{filteredBefore[0]?.time || '—'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                                        <p className="text-xs font-bold text-slate-900 leading-snug">{filteredBefore[0]?.notes || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AFTER CARD */}
                                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8 flex flex-col min-h-[500px]">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h4 className="text-2xl font-black text-slate-900">After</h4>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{toDateString(afterDate)}</p>
                                                    </div>
                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                                                        filteredAfter.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {filteredAfter.length} updates
                                                    </span>
                                                </div>
                                                <div className="aspect-video bg-slate-50 rounded-3xl overflow-hidden mb-8 border border-slate-100 flex items-center justify-center relative shadow-inner">
                                                    {filteredAfter.length > 0 ? (
                                                        <img 
                                                            src={filteredAfter[0].image_url} 
                                                            alt="After Progress" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-center p-8">
                                                            <Camera size={32} className="text-slate-200 mx-auto mb-2" />
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">No photo on this date</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taken By</p>
                                                        <p className="text-xs font-bold text-slate-900">{filteredAfter[0]?.taken_by || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                                        <p className="text-xs font-bold text-slate-900">{filteredAfter[0]?.time || '—'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                                        <p className="text-xs font-bold text-slate-900 leading-snug">{filteredAfter[0]?.notes || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Document Footer */}
                <div className="bg-slate-50 border-t border-slate-100 px-12 py-10 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">End of Report Preview</p>
                    <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                </div>
            </div>
        </div>
    );
}
