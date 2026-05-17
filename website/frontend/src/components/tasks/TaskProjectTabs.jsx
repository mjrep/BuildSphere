import React from 'react';

export default function TaskProjectTabs({ projects, selected, onSelect }) {
    if (!projects || projects.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center mt-4 mb-2">
            <button
                onClick={() => onSelect('all')}
                className={`whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selected === 'all'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-card border border-border-primary text-text-muted hover:bg-bg-tertiary'
                }`}
            >
                All Projects
            </button>
            {projects.map(project => (
                <button
                    key={project.id}
                    onClick={() => onSelect(project.id)}
                    className={`whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selected === project.id
                            ? 'bg-accent text-white shadow-sm'
                            : 'bg-card border border-border-primary text-text-muted hover:bg-bg-tertiary'
                    }`}
                >
                    {project.name}
                </button>
            ))}
        </div>
    );
}
