import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function ProjectCard({ project }) {
    const navigate = useNavigate();

    const progress = project.progress ?? 0;

    return (
        <div
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-card rounded-3xl border border-border-primary/50 shadow-lg overflow-hidden cursor-pointer
                       hover:shadow-accent/5 hover:border-accent/30 transition-all group"
        >
            {/* Placeholder image area */}
            <div className="h-44 bg-gradient-to-br from-accent/20 to-accent/40 relative group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-accent/40" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="absolute top-3 right-3">
                    <StatusBadge status={project.status} subStatus={project.sub_status} />
                </div>
            </div>

            {/* Card footer */}
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                        <span className="text-accent text-xs font-bold">{project.project_name?.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-text-primary truncate">{project.project_name}</h3>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">{project.client_name}</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-text-muted font-medium">Progress</span>
                        <span className="text-text-primary font-bold">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-accent rounded-full shadow-[0_0_8px_rgba(124,116,255,0.4)] transition-all duration-700" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
