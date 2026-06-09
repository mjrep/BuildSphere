import React from 'react';
import { Link } from 'react-router-dom';

const countColors = ['text-orange-400', 'text-yellow-500', 'text-green-500', 'text-blue-500'];

export default function ProjectUpdateCard({ project_id, projectName, count, time = 'Morning', index }) {
    const color = countColors[index % countColors.length];

    const cleanProjectName = (name) => {
        if (!name) return '';
        return name.replace(/^PRJ-[A-Z0-9-]+\s*\/\s*/i, '');
    };

    return (
        <Link to={`/projects/${project_id}?tab=site-updates&time=${time}`} className="bg-bg-secondary rounded-2xl px-5 py-4 mb-3 flex items-center justify-between border border-border-primary/30 hover:border-accent/50 hover:bg-bg-hover transition-all duration-200 group block">
            <div>
                <p className="text-sm font-bold text-text-primary max-w-[250px] truncate group-hover:text-accent transition-colors" title={projectName}>
                    {cleanProjectName(projectName)}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{count} updates received today</p>
            </div>
            <p className={`text-4xl font-black ${color}`}>{count}</p>
        </Link>
    );
}
