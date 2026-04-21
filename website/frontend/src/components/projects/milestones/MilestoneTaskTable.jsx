import React from 'react';
import CircularProgress from './CircularProgress';

/**
 * Replicates the detailed task table from Mockup 2, now using real Task model data.
 */
export default function MilestoneTaskTable({ phase, id }) {
    if (!phase) return null;

    const tasks = phase.tasks || [];

    return (
        <div id={id} className="bg-white rounded-3xl border border-[#F0F0F8] overflow-hidden shadow-sm mb-10 scroll-mt-6 hover:shadow-md transition-shadow">
            {/* Header section */}
            <div className="p-8 flex items-center justify-between border-b border-[#F0F0F8]">
                <div>
                    <h3 className="text-2xl font-bold text-[#1A1A1A]">{phase.name}</h3>
                    <p className="text-base font-medium text-[#A1A1A1] mt-1">
                        {phase.completed_tasks_count}/{phase.total_tasks_count} tasks completed
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <CircularProgress 
                        percentage={phase.progress} 
                        size={70} 
                        strokeWidth={8}
                        color="text-[#59A240]"
                    />
                </div>
            </div>

            {/* Table section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#FAFAFA]">
                        <tr>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8]">Tasks Name</th>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8]">Milestone</th>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8]">Assigned to</th>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8]">Given By</th>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8]">Start Date</th>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8]">End Date</th>
                            <th className="px-6 py-5 text-[13px] font-bold text-[#1A1A1A] uppercase border-b border-[#F0F0F8] text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F8]">
                        {tasks.length > 0 ? (
                            tasks.map((task, idx) => (
                                <tr key={task.id || idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-6 text-[15px] font-medium text-[#1A1A1A]">{task.title}</td>
                                    <td className="px-6 py-6 text-[14px] font-medium text-[#706BFF] max-w-[150px] truncate">{task.milestone_name}</td>
                                    <td className="px-6 py-6 text-[14px] text-[#6B6B6B]">{task.assigned_to_name}</td>
                                    <td className="px-6 py-6 text-[14px] text-[#6B6B6B]">{task.given_by_name}</td>
                                    <td className="px-6 py-6 text-[14px] text-[#6B6B6B]">{task.start_date || '—'}</td>
                                    <td className="px-6 py-6 text-[14px] text-[#6B6B6B]">{task.end_date || '—'}</td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`mx-auto flex items-center justify-center w-7 h-7 rounded-lg ${
                                            task.status === 'completed' 
                                                ? 'bg-[#59A240] text-white' 
                                                : 'bg-[#F0F0F8] text-[#A1A1A1]'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-[#A1A1A1] italic">
                                    No tasks assigned to this phase yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
