import React from 'react';

const statusStyles = {
    'In Progress': 'bg-blue-500/10 text-blue-500',
    'On Hold':     'bg-amber-500/10 text-amber-500',
    'Completed':   'bg-emerald-500/10 text-emerald-500',
    'Proposed':    'bg-purple-500/10 text-purple-500',
};

export default function ProjectUpdateItem({ projectName, status, date, description }) {
    const badgeClass = statusStyles[status] ?? 'bg-text-muted/10 text-text-muted';

    return (
        <div className="flex items-start gap-4 py-4 border-b border-border-primary last:border-0">
            {/* Dot indicator */}
            <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary truncate">{projectName}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
                        {status}
                    </span>
                </div>
                {description && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>
                )}
            </div>

            <p className="text-xs text-text-muted shrink-0">{date}</p>
        </div>
    );
}
