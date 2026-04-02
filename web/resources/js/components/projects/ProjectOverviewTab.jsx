import React from 'react';
import OverviewSummaryCard from './OverviewSummaryCard';
import OverviewMaterialCostCard from './OverviewMaterialCostCard';
import OverviewProgressCard from './OverviewProgressCard';
import OverviewTasksCard from './OverviewTasksCard';
import OverviewTeamCard from './OverviewTeamCard';
import OverviewFilesCard from './OverviewFilesCard';
import OverviewActivityCard from './OverviewActivityCard';

export default function ProjectOverviewTab({ project, fetchProject }) {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Top: Project Summary Card (full width) */}
            <OverviewSummaryCard project={project} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left (2/3) and Center integrated into a sub-grid */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    
                    {/* Description and Progress row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Description */}
                        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 lg:p-8 w-full flex flex-col">
                            <h3 className="text-base font-bold text-[#1A1A1A] mb-4">Project Description</h3>
                            <p className="text-sm text-[#1A1A1A] leading-relaxed">
                                {project.description || <span className="text-gray-400 italic">No description provided.</span>}
                            </p>
                        </div>

                        {/* Project Progress */}
                        <OverviewProgressCard progress={project.progress} />
                    </div>

                    {/* Cost and Tasks row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <OverviewMaterialCostCard costData={project.cost_data} />
                        <OverviewTasksCard tasksSummary={project.tasks_summary} />
                    </div>

                </div>

                {/* Right (1/3) */}
                <div className="xl:col-span-1 flex flex-col">
                    <OverviewTeamCard project={project} onMemberAdded={fetchProject} />
                    <OverviewFilesCard project={project} />
                    <OverviewActivityCard project={project} />
                </div>
            </div>
        </div>
    );
}
