import React, { useState, useEffect } from 'react';
import { Lock, Image as ImageIcon, TrendingUp, Clock, User, ChevronDown, X as XIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import TaskCommentList from './TaskCommentList';
import TaskCommentForm from './TaskCommentForm';
import TaskAttachmentList from './TaskAttachmentList';
import { formatDate, formatDateTime, getUserInitials } from '../../utils/taskHelpers';
import { TASK_STATUSES } from '../../utils/taskConstants';
import { getTaskById } from '../../services/taskApi';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function Section({ title, children }) {
    return (
        <div className="border-t border-[#F0F0F8] pt-4 mt-4">
            <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-3">{title}</p>
            {children}
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div className="flex gap-2 items-start">
            <span className="text-xs text-[#A0A0C0] w-24 flex-shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-[#1A1A2E] font-medium flex-1">{value ?? '—'}</span>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR — Visual progress for quantifiable milestones
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgressVisualizer({ task, isQuantifiable }) {
    let pct = 0;
    let labelText = null;
    let isComplete = false;

    if (isQuantifiable && task.milestone) {
        const { target_quantity, unit_of_measure } = task.milestone;
        const current_quantity = task.progress_logs?.reduce((sum, log) => sum + (Number(log.quantity_accomplished) || 0), 0) || 0;
        
        pct = target_quantity > 0 ? Math.min(100, Math.round((current_quantity / target_quantity) * 100)) : 0;
        isComplete = current_quantity >= target_quantity;
        labelText = (
            <>
                <span className="text-[#1A1A2E] font-bold">{current_quantity}</span>
                {' out of '}
                <span className="text-[#1A1A2E] font-bold">{target_quantity}</span>
                {' '}{unit_of_measure || 'units'} completed
            </>
        );
    } else {
        const status = task.status;
        isComplete = status === 'completed';
        if (status === 'completed') pct = 100;
        else if (status === 'in_review') pct = 90;
        else if (status === 'in_progress') pct = 50;
        else pct = 0;
        
        const statusMap = {
            'todo': 'To do',
            'in_progress': 'In Progress',
            'in_review': 'In Review',
            'completed': 'Completed'
        };
        labelText = <>{isComplete ? 'Task is fully completed' : `Task is currently ${statusMap[status] || status}`}</>;
    }

    return (
        <div className="bg-gradient-to-br from-[#F8F8FC] to-[#F0F0FF] rounded-xl p-4 mb-4 border border-[#E8E8FF]">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <TrendingUp size={14} className="text-indigo-500" />
                    </div>
                    <span className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wide">Task Progress</span>
                </div>
                <span className={`
                    text-xs font-bold px-2.5 py-1 rounded-full
                    ${isComplete
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-indigo-100 text-indigo-600'
                    }
                `}>
                    {pct}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#E8E8FF] mb-2">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isComplete
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                    }`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Quantity text */}
            <p className="text-xs text-[#6B6B8A] font-medium">
                {labelText}
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOCKED STATUS BADGE — shown when milestone auto-manages status
   ═══════════════════════════════════════════════════════════════════════════ */

function LockedStatusBadge({ status }) {
    return (
        <div className="relative group">
            <div className="flex items-center gap-1.5 cursor-default">
                <StatusBadge status={status} />
                <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Lock size={10} className="text-amber-500" />
                </div>
            </div>
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-1.5 z-30 hidden group-hover:block">
                <div className="bg-[#1A1A2E] text-white text-[10px] font-medium rounded-lg px-3 py-2 shadow-xl whitespace-nowrap leading-relaxed max-w-[220px]">
                    Status is managed automatically
                    <br />via Site Updates.
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-[#1A1A2E] rotate-45" />
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVIDENCE IMAGE LIGHTBOX
   ═══════════════════════════════════════════════════════════════════════════ */

function EvidenceLightbox({ src, onClose }) {
    if (!src) return null;
    return (
        <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <XIcon size={16} />
                </button>
                <img
                    src={src.startsWith('http') ? src : `/storage/${src}`}
                    alt="Evidence photo"
                    className="w-full rounded-xl shadow-2xl"
                />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS HISTORY — timeline of progress logs
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgressHistory({ logs, unitOfMeasure }) {
    const [lightboxSrc, setLightboxSrc] = useState(null);

    if (!logs || logs.length === 0) {
        return (
            <p className="text-xs text-[#A0A0C0] italic py-2">No progress logs recorded yet.</p>
        );
    }

    return (
        <>
            <div className="space-y-2.5">
                {logs.map((log, idx) => (
                    <div
                        key={log.id}
                        className="group flex items-start gap-3 p-3 rounded-xl bg-[#FAFAFC] hover:bg-[#F4F4FC] border border-transparent hover:border-[#E8E8FF] transition-all duration-150"
                    >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center pt-1 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                            {idx < logs.length - 1 && (
                                <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[24px]" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Top row: user + date + quantity badge */}
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                {/* User */}
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[8px] font-bold text-white">
                                            {getUserInitials(log.user?.name ?? '?')}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-[#1A1A2E]">
                                        {log.user?.name ?? 'Unknown'}
                                    </span>
                                </div>

                                {/* Quantity badge */}
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    + {log.quantity_accomplished} {unitOfMeasure || 'units'}
                                </span>

                                {/* Date */}
                                <span className="text-[10px] text-[#A0A0C0] flex items-center gap-1 ml-auto">
                                    <Clock size={10} />
                                    {formatDateTime(log.created_at)}
                                </span>
                            </div>

                            {/* Remarks */}
                            {log.remarks && (
                                <p className="text-xs text-[#6B6B8A] leading-relaxed mt-0.5">{log.remarks}</p>
                            )}

                            {/* Evidence thumbnail */}
                            {log.evidence_image_path && (
                                <button
                                    onClick={() => setLightboxSrc(log.evidence_image_path)}
                                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E8FF] hover:border-indigo-300 hover:shadow-sm transition-all group/thumb"
                                >
                                    <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={log.evidence_image_path.startsWith('http')
                                                ? log.evidence_image_path
                                                : `/storage/${log.evidence_image_path}`
                                            }
                                            alt="Evidence"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 group-hover/thumb:text-indigo-600">
                                        <ImageIcon size={11} />
                                        View Photo
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxSrc && (
                <EvidenceLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — ViewTaskModal
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ViewTaskModal({ taskId, task: initialTask, onClose, permissions, user, onStatusChange, onCommentAdd, onAttachmentUpload }) {
    const [task, setTask]         = useState(initialTask ?? null);
    const [loading, setLoading]  = useState(!initialTask);
    const [comments, setComments]= useState(initialTask?.comments ?? []);
    const [attachments, setAttachments] = useState(initialTask?.attachments ?? []);
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const id = taskId ?? initialTask?.id;

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getTaskById(id).then(data => {
            setTask(data);
            setComments(data.comments ?? []);
            setAttachments(data.attachments ?? []);
        }).catch((err) => {
            if (err.response?.status === 403) {
                toast.error('You do not have permission to view this task.');
            } else {
                toast.error('Failed to load task.');
            }
            onClose();
        }).finally(() => setLoading(false));
    }, [id]);

    const handleStatusChange = async (status) => {
        setShowStatusMenu(false);
        try {
            await onStatusChange(task.id, status);
            setTask(t => ({ ...t, status }));
        } catch { /* toast shown in parent */ }
    };

    const handleComment = async (text) => {
        const comment = await onCommentAdd(task.id, text);
        if (comment) setComments(prev => [...prev, comment]);
    };

    const handleAttachment = async (fd) => {
        const result = await onAttachmentUpload(task.id, fd);
        if (result?.data) setAttachments(prev => [...prev, ...result.data]);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-10 text-center">
                    <div className="w-8 h-8 border-2 border-[#5B5BD6] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-[#9090A8] mt-3">Loading task…</p>
                </div>
            </div>
        );
    }

    if (!task) return null;

    const breadcrumb = [task.project?.name, task.phase?.name, task.milestone?.name].filter(Boolean).join(' / ');
    const assigneeName = task.assigned_to?.name ?? '—';
    const assignedByName = task.assigned_by?.name ?? '—';

    // Determine if this task has a quantifiable milestone
    const isQuantifiable = task.milestone?.has_quantity === true;
    
    // For quantifiable tasks, status is auto-managed until it reaches 'in_review'.
    // Once in 'in_review', it can be manually changed to 'completed'.
    const isReadyForReview = isQuantifiable && task.status === 'in_review';
    const statusIsLocked = isQuantifiable && !isReadyForReview;

    // Optional: if in review for a quantifiable task, maybe only allow 'completed' in the dropdown
    const availableStatuses = (isQuantifiable && isReadyForReview) 
        ? Object.entries(TASK_STATUSES).filter(([k]) => k === 'completed')
        : Object.entries(TASK_STATUSES);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
                {/* Modal header */}
                <div className="sticky top-0 bg-white rounded-t-2xl flex items-center gap-3 px-6 py-4 border-b border-[#F0F0F8] z-10">
                    <div className="flex-1 min-w-0">
                        {breadcrumb && (
                            <p className="text-[10px] font-medium text-[#9090A8] truncate mb-1">{breadcrumb}</p>
                        )}

                        {/* Status select + context menu: visible on top bar */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {statusIsLocked ? (
                                /* ── Locked status for quantifiable milestones ── */
                                <LockedStatusBadge status={task.status} />
                            ) : permissions.canUpdateStatus ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStatusMenu(s => !s)}
                                        className="flex items-center gap-1"
                                    >
                                        <StatusBadge status={task.status} />
                                        <ChevronDown size={12} className="text-[#9090A8]" />
                                    </button>
                                    {showStatusMenu && (
                                        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-[#E0E0F0] rounded-xl shadow-lg py-1 w-40">
                                            {availableStatuses.map(([k, v]) => (
                                                <button
                                                    key={k}
                                                    onClick={() => handleStatusChange(k)}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-[#3A3A5C] hover:bg-[#F8F8FC] flex items-center gap-2"
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <StatusBadge status={task.status} />
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-[#9090A8] hover:text-[#3A3A5C] p-1.5 rounded-lg hover:bg-[#F0F0F8] flex-shrink-0"
                    >
                        <XIcon size={20} />
                    </button>
                </div>

                {/* Main body */}
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                    {/* Left column */}
                    <div>
                        {/* Title and priority */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-[#1A1A2E] leading-tight">{task.title}</h2>
                            </div>
                        </div>

                        {/* ── Progress Visualizer ── */}
                        <ProgressVisualizer task={task} isQuantifiable={isQuantifiable} />

                        {/* Description */}
                        <div className="flex gap-2 mb-4">
                            <svg className="w-4 h-4 text-[#A0A0C0] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            <p className="text-sm text-[#3A3A5C] leading-relaxed whitespace-pre-wrap">{task.description}</p>
                        </div>

                        {/* Comments */}
                        <Section title="Comments">
                            <TaskCommentList comments={comments} />
                            {permissions.canComment && (
                                <TaskCommentForm user={user} onSubmit={handleComment} />
                            )}
                        </Section>

                        {/* Attachments */}
                        <Section title={`Attachments ${attachments.length > 0 ? `(${attachments.length})` : ''}`}>
                            <TaskAttachmentList
                                attachments={attachments}
                                canUpload={permissions.canUploadAttachment}
                                onUpload={handleAttachment}
                            />
                        </Section>

                        {/* ── Progress History (quantifiable milestones only) ── */}
                        {isQuantifiable && (
                            <Section title={`Progress History ${task.progress_logs?.length > 0 ? `(${task.progress_logs.length})` : ''}`}>
                                <ProgressHistory
                                    logs={task.progress_logs ?? []}
                                    unitOfMeasure={task.milestone?.unit_of_measure}
                                />
                            </Section>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-3">
                        <Detail label="Priority"    value={<PriorityBadge priority={task.priority} />} />
                        <Detail label="Start Date"  value={formatDate(task.start_date)} />
                        <Detail label="Due Date"    value={formatDate(task.due_date)} />
                        <Detail label="Assigned by" value={
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-[#E8E8FF] text-[#5B5BD6] text-[9px] font-bold flex items-center justify-center">
                                    {getUserInitials(assignedByName)}
                                </div>
                                <span className="text-xs">{assignedByName}</span>
                            </div>
                        } />
                        <Detail label="Assigned to" value={
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-[#B8F0D8] text-[#16755A] text-[9px] font-bold flex items-center justify-center">
                                    {getUserInitials(assigneeName)}
                                </div>
                                <span className="text-xs">{assigneeName}</span>
                            </div>
                        } />

                        {/* Milestone info for quantifiable tasks */}
                        {isQuantifiable && (
                            <>
                                <div className="border-t border-[#F0F0F8] pt-3 mt-3">
                                    <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider mb-2">Milestone</p>
                                    <p className="text-xs font-semibold text-[#1A1A2E] mb-1">
                                        {task.milestone.name}
                                    </p>
                                    <p className="text-[11px] text-[#6B6B8A]">
                                        {task.milestone.current_quantity} / {task.milestone.target_quantity} {task.milestone.unit_of_measure}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
