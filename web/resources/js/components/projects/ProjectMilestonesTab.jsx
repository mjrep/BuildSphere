import React, { useState } from 'react';
import useMilestoneTracking from '../../hooks/useMilestoneTracking';
import MilestoneGanttGrid from './milestones/MilestoneGanttGrid';
import MilestonePhaseProgress from './milestones/MilestonePhaseProgress';
import MilestoneTaskTable from './milestones/MilestoneTaskTable';

export default function ProjectMilestonesTab({ project }) {
    const { phases, loading, error } = useMilestoneTracking(project.id);
    const [view, setView] = useState('grid'); // 'grid' or 'details'

    if (loading) {
        return (
            <div className="w-full space-y-8 animate-pulse p-4">
                <div className="h-64 bg-gray-100 rounded-3xl" />
                <div className="h-40 bg-gray-100 rounded-3xl" />
                <div className="h-96 bg-gray-100 rounded-3xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-8 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100 shadow-sm">
                <p className="font-bold text-lg">Error loading milestones</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    if (phases.length === 0) {
        return (
            <div className="w-full h-80 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#F0F0F8] text-[#A1A1A1] text-center p-12 shadow-sm">
                <div className="w-20 h-20 bg-[#F0F0F8] rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <p className="font-bold text-[#1A1A1A] text-xl mb-2">No milestones set for this project.</p>
                <p className="text-sm max-w-sm">Defining project phases and milestones is required to track progress here.</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-20 max-w-7xl mx-auto">
            {view === 'grid' ? (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <MilestoneGanttGrid 
                        phases={phases} 
                        onViewProgress={() => setView('details')} 
                    />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-12">
                    {/* Header with Navigation Back */}
                    <div className="flex items-center justify-between mb-10 sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 px-2 -mx-2 rounded-xl">
                        <div className="flex items-center gap-5">
                            <button 
                                onClick={() => setView('grid')}
                                className="p-3 bg-[#F0F0F8] hover:bg-[#E8E8FF] transition-all rounded-2xl text-[#1A1A1A] group"
                            >
                                <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-3xl font-bold text-[#1A1A1A]">Project Detailed Progress</h2>
                        </div>
                        <div className="text-sm font-semibold text-[#A1A1A1] bg-[#F0F0F8] px-4 py-2 rounded-full">
                            Project ID: {project.project_code}
                        </div>
                    </div>

                    {/* Phase Progress Dashboard (Summary) */}
                    <MilestonePhaseProgress phases={phases} />

                    {/* Vertical Scrollable Phase Tables */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-[#1A1A1A] px-2 mb-4">Phase Details</h3>
                        {phases.map((phase) => (
                            <MilestoneTaskTable 
                                key={phase.id} 
                                phase={phase} 
                                id={`phase-${phase.id}`}
                            />
                        ))}
                    </div>

                    {/* Footer Nav */}
                    <div className="flex justify-center pt-8 border-t border-[#F0F0F8]">
                        <button 
                            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex items-center gap-2 text-[#706BFF] font-bold hover:underline"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                            </svg>
                            Back to Top
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
