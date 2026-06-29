import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import useAuth from '../../hooks/useAuth';

export default function ProjectTable({ projects }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSales = (user?.role || '').toLowerCase() === 'sales';

    if (!projects.length) {
        return (
            <div className="text-center py-12 text-text-muted text-sm">
                No projects found.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[800px]">
                <thead>
                    <tr className="text-left text-sm font-semibold text-text-muted border-b border-border-primary">
                        <th className="pb-3 pl-4 w-1/3">Name</th>
                        <th className="pb-3 w-1/4">Client</th>
                        <th className="pb-3 w-[15%]">Status</th>
                        <th className="pb-3 w-[25%]">Progress</th>
                        <th className="pb-3 pr-4 w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr
                            key={project.id}
                            onClick={!isSales ? () => navigate(`/projects/${project.id}`) : undefined}
                            className={`border-b border-border-primary transition-colors group ${
                                !isSales ? 'hover:bg-bg-hover cursor-pointer' : ''
                            }`}
                        >
                            <td className="py-4 pl-4 text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{project.project_name}</td>
                            <td className="py-4 text-sm font-medium text-text-secondary">{project.client_name}</td>
                            <td className="py-4"><StatusBadge status={project.status} subStatus={project.sub_status} project={project} /></td>
                            <td className="py-4 pr-4">
                                {project.status !== 'proposed' ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-primary/50 shadow-inner">
                                            <div 
                                                className={`h-full rounded-full shadow-[0_0_8px_rgba(124,116,255,0.4)] transition-all duration-1000 ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#00C6FF] to-accent'}`}
                                                style={{ width: `${project.progress || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-text-primary min-w-[36px] text-right">
                                            {project.progress || 0}%
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-medium text-text-muted italic px-2">—</span>
                                )}
                            </td>
                            <td className="py-4 pr-4 text-right">
                                {!isSales && (
                                    <svg className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors inline" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
