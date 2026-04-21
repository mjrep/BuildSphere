import React from 'react';

/**
 * Replicates the Gantt-like milestone tracking grid from Mockup 1.
 */
export default function MilestoneGanttGrid({ phases, onViewProgress }) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];

    // Helper to check if a milestone spans a month
    const getProgressInMonth = (milestone, monthIndex) => {
        if (!milestone.start_date || !milestone.end_date) return null;
        
        const start = new Date(milestone.start_date);
        const end = new Date(milestone.end_date);
        const monthYear = new Date(2026, monthIndex, 1); // Assuming 2026 for now

        // This is a simplified check for the mockup replication
        // In a real app, we'd more accurately map dates to columns
        const msMonth = start.getMonth();
        if (msMonth === monthIndex) {
            return milestone.progress_percentage || 0;
        }
        return null;
    };

    return (
        <div className="w-full bg-white rounded-3xl border border-[#F0F0F8] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#FAFAFA]">
                            <th className="px-6 py-6 text-sm font-bold text-[#706BFF] border-b border-r border-[#F0F0F8] w-[200px]">Phase</th>
                            <th className="px-6 py-6 text-sm font-bold text-[#706BFF] border-b border-r border-[#F0F0F8] w-[200px]">Milestone</th>
                            {months.map(month => (
                                <th key={month} className="px-4 py-6 text-xs font-semibold text-[#A1A1A1] border-b border-r border-[#F0F0F8] min-w-[100px]">
                                    {month}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map((phase, pIdx) => (
                            <React.Fragment key={phase.name}>
                                {phase.milestones.map((ms, mIdx) => (
                                    <tr key={ms.id} className="group">
                                        {mIdx === 0 && (
                                            <td 
                                                rowSpan={phase.milestones.length} 
                                                className="px-6 py-4 text-center border-b border-r border-[#F0F0F8] bg-white align-middle"
                                            >
                                                <span className="text-sm font-bold text-[#706BFF] leading-tight block">
                                                    {phase.name}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-8 text-sm text-[#A1A1A1] font-medium border-b border-r border-[#F0F0F8]">
                                            {ms.title}
                                        </td>
                                        {months.map((month, monthIdx) => {
                                            const progress = getProgressInMonth(ms, monthIdx);
                                            return (
                                                <td key={month} className="p-0 border-b border-r border-[#F0F0F8] h-full relative min-h-[60px]">
                                                    {progress !== null && (
                                                        <div className="absolute inset-0.5 bg-[#706BFF]/5 rounded-lg overflow-hidden flex items-center justify-center">
                                                            <div 
                                                                className="absolute left-0 top-0 bottom-0 bg-[#706BFF]/20 transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                            <span className="text-[#706BFF] font-bold text-sm relative z-10">{progress}%</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Action Footer */}
            <div className="p-6 bg-white flex justify-center">
                <button 
                    onClick={onViewProgress}
                    className="w-full max-w-4xl py-4 bg-[#706BFF] hover:bg-[#5B55E6] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#706BFF]/20"
                >
                    View Progress
                </button>
            </div>
        </div>
    );
}
