import React from 'react';

const countColors = ['text-orange-400', 'text-yellow-500', 'text-green-500', 'text-blue-500'];

export default function ProjectUpdateCard({ projectName, count, index }) {
    const color = countColors[index % countColors.length];

    const cleanProjectName = (name) => {
        if (!name) return '';
        return name.replace(/^PRJ-[A-Z0-9-]+\s*\/\s*/i, '');
    };

    return (
        <div className="bg-bg-secondary rounded-2xl px-5 py-4 mb-3 flex items-center justify-between border border-border-primary/30">
            <div>
                <p className="text-sm font-bold text-text-primary max-w-[250px] truncate" title={projectName}>
                    {cleanProjectName(projectName)}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{count} updates received today</p>
            </div>
            <p className={`text-4xl font-black ${color}`}>{count}</p>
        </div>
    );
}
