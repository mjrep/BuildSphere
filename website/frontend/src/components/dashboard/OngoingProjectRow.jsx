import React from 'react';

const statusStyles = {
    'On Track': 'bg-green-500 text-white',
    'Delayed':  'bg-red-500 text-white',
    'Near Due': 'bg-orange-400 text-white',
};

export default function OngoingProjectRow({ project_name, status, progress, daysLeft }) {
    const badgeClass = statusStyles[status] ?? 'bg-gray-400 text-white';

    const cleanProjectName = (name) => {
        if (!name) return '';
        return name.replace(/^PRJ-[A-Z0-9-]+\s*\/\s*/i, '');
    };

    return (
        <div className="bg-bg-secondary rounded-2xl p-4 mb-3 flex flex-col justify-center min-h-[96px] transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-text-primary max-w-[200px] truncate" title={project_name}>
                        {cleanProjectName(project_name)}
                    </p>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
                        {status}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-accent">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-accent">{daysLeft} days left</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-xs text-text-muted shrink-0">Progress</p>
                <div className="flex-1 h-2 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs font-semibold text-text-muted shrink-0">{progress}%</p>
            </div>
        </div>
    );
}
