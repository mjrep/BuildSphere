import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
    Send, 
    ChevronLeft, 
    ChevronRight, 
    MessageCircle, 
    Camera, 
    Clock, 
    User, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    Edit2,
    Check,
    X,
    MoreHorizontal
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const TIME_BLOCKS = ['Morning', 'Noon', 'Afternoon'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['S','M','T','W','T','F','S'];

const UNIT_LABEL = 'Glass Panels';

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}
function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}
function parseLogDate(log) {
    if (log.work_date) return new Date(log.work_date);
    if (log.created_at) return new Date(log.created_at);
    return null;
}
function getToday() { return new Date(); }

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

/**
 * Determine the time block from an ISO date string.
 * Morning: 00:00–11:59, Noon: 12:00–13:59, Afternoon: 14:00–23:59
 */
function getTimeBlock(log) {
    if (log.shift) return log.shift; // 'Morning', 'Noon', 'Afternoon'
    if (!log.created_at) return 'Morning'; // fallback
    const h = new Date(log.created_at).getHours();
    if (h < 12) return 'Morning';
    if (h < 14) return 'Noon';
    return 'Afternoon';
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINI CALENDAR COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function MiniCalendar({ selectedDate, onSelectDate, logDates }) {
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay   = getFirstDayOfMonth(viewYear, viewMonth);

    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const hasLog = (day) => {
        const d = new Date(viewYear, viewMonth, day);
        return logDates.some(ld => isSameDay(ld, d));
    };

    return (
        <div className="px-1">
            {/* Month/Year header */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-[#1A1A1A] tracking-wide uppercase">
                    {MONTHS[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0 mb-1">
                {WEEKDAYS.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0">
                {blanks.map(i => <div key={`b-${i}`} />)}
                {days.map(day => {
                    const thisDate = new Date(viewYear, viewMonth, day);
                    const isSelected = isSameDay(thisDate, selectedDate);
                    const isToday = isSameDay(thisDate, getToday());
                    const hasLogDay = hasLog(day);

                    return (
                        <button
                            key={day}
                            onClick={() => onSelectDate(thisDate)}
                            className={`
                                relative h-8 w-full flex items-center justify-center text-xs font-semibold rounded-lg transition-all duration-150
                                ${isSelected
                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                                    : isToday
                                        ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                                        : hasLogDay
                                            ? 'text-[#1A1A1A] hover:bg-indigo-50'
                                            : 'text-gray-400 hover:bg-gray-50'
                                }
                            `}
                        >
                            {day}
                            {hasLogDay && !isSelected && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VERIFICATION BADGE
   ═══════════════════════════════════════════════════════════════════════════ */
function VerificationBadge({ status }) {
    if (status === 'approved') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={12} /> Approved
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
            <AlertCircle size={12} /> For Checking
        </span>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SiteUpdatesTab({ project }) {
    const { user: currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periodTab, setPeriodTab] = useState('Today');    // 'Today' | 'Past'
    const [selectedBlock, setSelectedBlock] = useState('Noon');
    const [selectedPastDate, setSelectedPastDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // default to yesterday
        return d;
    });
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [commentText, setCommentText] = useState('');
    
    // Edit state
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [editingValue, setEditingValue] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const userRole = currentUser?.role;
    const isAuthorized = (
        project?.project_in_charge_id === currentUser?.id ||
        ['CEO', 'COO', 'Admin'].includes(userRole)
    );

    // ── Fetch real data from API ──────────────────────────────────────
    const fetchLogs = () => {
        if (!project?.id) return;
        setLoading(true);
        api.get(`/projects/${project.id}/progress-logs`)
            .then(res => {
                const data = res.data?.data || res.data || [];
                setLogs(data);
            })
            .catch(err => {
                console.error('Failed to load progress logs:', err);
                setLogs([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLogs();
    }, [project?.id]);

    const updateLog = (logId, data) => {
        // Capture previous state for rollback
        const previousLogs = [...logs];
        
        // Optimistically update local state immediately
        setLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, ...data } : l
        ));
        setIsEditingQuantity(false);
        setIsUpdating(true);

        api.patch(`/progress-logs/${logId}`, data)
            .then(res => {
                // Confirm with server data
                const confirmedLog = res.data.data;
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...confirmedLog } : l));
            })
            .catch(err => {
                // Rollback on failure
                setLogs(previousLogs);
                console.error('Failed to update log:', err);
                alert(err.response?.data?.message || 'Update failed. Reverting changes.');
            })
            .finally(() => setIsUpdating(false));
    };

    // Dates that have logs (for calendar dots)
    const logDates = useMemo(() =>
        logs.map(l => parseLogDate(l)).filter(Boolean),
    [logs]);

    // ── Filter logs ───────────────────────────────────────────────────────
    const filteredLogs = useMemo(() => {
        const today = getToday();
        if (periodTab === 'Today') {
            return logs.filter(l => {
                const logDate = parseLogDate(l);
                return logDate && isSameDay(logDate, today) && getTimeBlock(l) === selectedBlock;
            });
        }
        return logs.filter(l => {
            const logDate = parseLogDate(l);
            return logDate && isSameDay(logDate, selectedPastDate);
        });
    }, [logs, periodTab, selectedBlock, selectedPastDate]);

    // Auto-select first log when filtered list changes
    const activeLog = useMemo(() => {
        if (selectedLogId) {
            const found = filteredLogs.find(l => l.id === selectedLogId);
            if (found) return found;
        }
        return filteredLogs[0] || null;
    }, [filteredLogs, selectedLogId]);

    // ── Loading State ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex gap-5 w-full min-h-[560px]">
                <div className="w-full bg-white rounded-2xl border border-[#F0F0F8] shadow-sm flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 size={24} className="text-indigo-400 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-medium">Loading site updates…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-5 w-full min-h-[560px]">

            {/* ════════════════════════════════════════════════════════════
                LEFT COLUMN — Navigation (1/3 width)
               ════════════════════════════════════════════════════════════ */}
            <div className="w-1/3 min-w-[260px] bg-white rounded-2xl border border-[#F0F0F8] shadow-sm flex flex-col">

                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                    <h3 className="text-base font-bold text-[#1A1A1A]">Site Updates</h3>
                </div>

                {/* Period Tabs */}
                <div className="flex px-5 gap-1 mb-4">
                    {['Today', 'Past'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setPeriodTab(tab); setSelectedLogId(null); }}
                            className={`
                                px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200
                                ${periodTab === tab
                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content area */}
                <div className="flex-1 px-4 pb-4 overflow-y-auto">
                    {periodTab === 'Today' ? (
                        /* ─── Time Block Nav ─── */
                        <div className="flex flex-col gap-2">
                            {TIME_BLOCKS.map(block => {
                                const isActive = selectedBlock === block;
                                const blockLogs = logs.filter(l => {
                                    const logDate = parseLogDate(l);
                                    return logDate && isSameDay(logDate, getToday()) && getTimeBlock(l) === block;
                                });
                                return (
                                    <button
                                        key={block}
                                        onClick={() => { setSelectedBlock(block); setSelectedLogId(null); }}
                                        className={`
                                            group relative flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200
                                            ${isActive
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-[#F8F8FC] text-[#6B6B6B] hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100'
                                            }
                                        `}
                                    >
                                        <span>{block} Updates</span>
                                        {blockLogs.length > 0 && (
                                            <span className={`
                                                text-[10px] font-bold px-2 py-0.5 rounded-full
                                                ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}
                                            `}>
                                                {blockLogs.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* ─── Past Calendar ─── */
                        <MiniCalendar
                            selectedDate={selectedPastDate}
                            onSelectDate={(d) => { setSelectedPastDate(d); setSelectedLogId(null); }}
                            logDates={logDates}
                        />
                    )}

                    {/* ─── Log List (below time blocks / calendar) ─── */}
                    {filteredLogs.length > 1 && (
                        <div className="mt-4 pt-3 border-t border-[#F0F0F8]">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                {filteredLogs.length} Updates
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {filteredLogs.map(log => (
                                    <button
                                        key={log.id}
                                        onClick={() => setSelectedLogId(log.id)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150
                                            ${activeLog?.id === log.id
                                                ? 'bg-indigo-50 border border-indigo-200'
                                                : 'hover:bg-gray-50 border border-transparent'
                                            }
                                        `}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 overflow-hidden flex items-center justify-center flex-shrink-0 relative group-hover:shadow-md transition-shadow">
                                            {log.evidence_image_url ? (
                                                <img 
                                                    src={log.evidence_image_url} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '';
                                                    }}
                                                />
                                            ) : (
                                                <Camera size={14} className="text-white" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-[#1A1A1A] truncate">{log.created_by?.name ?? 'Unknown'}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {log.quantity_accomplished} {UNIT_LABEL}
                                                {log.task?.title && ` • ${log.task.title}`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                RIGHT COLUMN — Log Details (2/3 width)
               ════════════════════════════════════════════════════════════ */}
            <div className="flex-1 bg-white rounded-2xl border border-[#F0F0F8] shadow-sm flex flex-col">
                {activeLog ? (
                    <>
                        {/* Detail Header */}
                        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-bold text-[#1A1A1A]">Site Photos</h3>
                                <VerificationBadge status={activeLog.ai_verification_status} />
                                
                                {isAuthorized && (
                                    <button 
                                        disabled={isUpdating}
                                        onClick={() => updateLog(activeLog.id, {
                                            ai_verification_status: activeLog.ai_verification_status === 'approved' ? 'for_checking' : 'approved'
                                        })}
                                        className={`
                                            ml-1 p-1.5 rounded-lg border transition-all duration-200
                                            ${activeLog.ai_verification_status === 'approved'
                                                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                            }
                                        `}
                                        title={activeLog.ai_verification_status === 'approved' ? "Revoke Approval" : "Approve Update"}
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {isEditingQuantity ? (
                                    <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-full px-2 py-0.5 shadow-sm">
                                        <input 
                                            autoFocus
                                            type="number"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') updateLog(activeLog.id, { quantity_accomplished: editingValue });
                                                if (e.key === 'Escape') setIsEditingQuantity(false);
                                            }}
                                            className="w-12 text-xs font-bold text-indigo-600 outline-none bg-transparent text-center"
                                        />
                                        <button onClick={() => updateLog(activeLog.id, { quantity_accomplished: editingValue })} className="text-emerald-500 hover:text-emerald-600 p-0.5">
                                            <Check size={14} />
                                        </button>
                                        <button onClick={() => setIsEditingQuantity(false)} className="text-rose-500 hover:text-rose-600 p-0.5">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/25">
                                        {activeLog.quantity_accomplished} {UNIT_LABEL} Installed
                                        {isAuthorized && (
                                            <button 
                                                onClick={() => {
                                                    setEditingValue(activeLog.quantity_accomplished);
                                                    setIsEditingQuantity(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-white/20 rounded transition-all"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Evidence Image - 16:9 */}
                        <div className="px-6">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border border-[#F0F0F8]">
                                {activeLog.evidence_image_url ? (
                                    <img
                                        src={activeLog.evidence_image_url}
                                        alt="Site evidence"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/construction-placeholder.png';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Camera size={32} className="text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400">No photo uploaded</p>
                                        </div>
                                    </div>
                                )}
                                {/* Gradient overlay at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                                {/* Time badge */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold">
                                    <Clock size={12} />
                                    {activeLog.created_at ? formatTime(activeLog.created_at) : activeLog.shift}
                                </div>
                            </div>
                        </div>

                        {/* 2×2 Metadata Grid */}
                        <div className="px-6 pt-4 pb-3">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                {/* Date */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                                    <p className="text-sm font-semibold text-[#1A1A1A]">{activeLog.work_date || formatDate(activeLog.created_at)}</p>
                                </div>
                                {/* Taken By */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Taken By</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                            <User size={10} className="text-white" />
                                        </div>
                                        <p className="text-sm font-semibold text-[#1A1A1A]">{activeLog.created_by?.name ?? 'Unknown'}</p>
                                    </div>
                                </div>
                                {/* Time */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time</p>
                                    <p className="text-sm font-semibold text-[#1A1A1A]">{activeLog.created_at ? formatTime(activeLog.created_at) : activeLog.shift}</p>
                                </div>
                                {/* Notes */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Notes</p>
                                    <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">{activeLog.remarks || '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-6 border-t border-[#F0F0F8]" />

                        {/* Comments Section */}
                        <div className="px-6 pt-3 pb-2 flex-1 flex flex-col min-h-0">
                            <p className="text-xs font-bold text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                                <MessageCircle size={14} className="text-gray-400" />
                                Comments
                            </p>

                            {/* Comment list - placeholder for future backend */}
                            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                                <p className="text-xs text-gray-400 italic">No comments yet.</p>
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="px-6 pb-5 pt-1">
                            <div className="flex items-center gap-2 bg-[#F8F8FC] rounded-xl px-4 py-2.5 border border-[#F0F0F8] focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Type Comment Here..."
                                    className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 outline-none"
                                />
                                <button
                                    onClick={() => setCommentText('')}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* ─── Empty State ─── */
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                            <FileText size={28} className="text-indigo-400" />
                        </div>
                        <p className="text-sm font-bold text-[#1A1A1A] mb-1">No updates found</p>
                        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                            {periodTab === 'Today'
                                ? `No site updates logged for ${selectedBlock.toLowerCase()} today.`
                                : `No site updates logged for ${selectedPastDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
