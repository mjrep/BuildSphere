import React from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { formatDate, getUserInitials } from '../../utils/taskHelpers';
import TaskActionsDropdown from './TaskActionsDropdown';

export default function TaskListTable({ tasks, onTaskClick, onEdit, onDelete }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border-primary bg-card">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border-primary bg-bg-secondary/50">
                        {['Task Name', 'Project', 'Assigned To', 'Priority', 'Status', 'Start Date', 'Due Date', 'Created By', ''].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-text-muted px-4 py-3 whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, i) => {
                        const assignee  = task.assigned_to?.name ?? '—';
                        const createdBy = task.created_by?.name  ?? '—';
                        const initials  = getUserInitials(assignee);

                        return (
                            <tr
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className={`border-b border-border-primary cursor-pointer hover:bg-bg-hover transition-colors
                                           ${i % 2 === 0 ? 'bg-card' : 'bg-bg-stripe'}`}
                            >
                                <td className="px-4 py-3 max-w-[200px]">
                                    <p className="font-medium text-text-primary truncate">{task.title}</p>
                                </td>
                                <td className="px-4 py-3">
                                    {task.project ? (
                                        <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-md whitespace-nowrap">
                                            {task.project.name}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                            {initials}
                                        </div>
                                        <span className="text-text-secondary text-xs whitespace-nowrap">{assignee}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                                <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{formatDate(task.start_date)}</td>
                                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{formatDate(task.due_date)}</td>
                                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{createdBy}</td>
                                <td className="px-4 py-3">
                                    <TaskActionsDropdown 
                                        task={task} 
                                        onView={onTaskClick} 
                                        onEdit={onEdit} 
                                        onDelete={onDelete} 
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
