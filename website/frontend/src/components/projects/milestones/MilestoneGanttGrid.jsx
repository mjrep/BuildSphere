import React from 'react';

/**
 * Replicates the Gantt-like milestone tracking grid from Mockup 1.
 */
export default function MilestoneGanttGrid({ phases, months = [], onViewProgress }) {
    // Helper to check if a milestone spans a month
    const getProgressInMonth = (milestone, monthKey) => {
        if (!milestone.start_date || !milestone.end_date) return null;
        
        // The backend now provides 'month_spans' which is an array of 'YYYY-MM'
        // If it's missing (legacy), we fallback to a simple month check
        if (milestone.month_spans && Array.isArray(milestone.month_spans)) {
            if (milestone.month_spans.includes(monthKey)) {
                return milestone.progress_percentage || 0;
            }
            return null;
        }

        // Fallback for legacy data
        const start = new Date(milestone.start_date);
        const end = new Date(milestone.end_date);
        const msMonthKey = start.toISOString().substring(0, 7);
        
        if (msMonthKey === monthKey) {
            return milestone.progress_percentage || 0;
        }
        return null;
    };

    const phaseColors = [
        { accent: 'text-[#706BFF]', bg5: 'bg-[#706BFF]/5', bg20: 'bg-[#706BFF]/20' }, // default accent
        { accent: 'text-emerald-500', bg5: 'bg-emerald-500/5', bg20: 'bg-emerald-500/20' },
        { accent: 'text-amber-500', bg5: 'bg-amber-500/5', bg20: 'bg-amber-500/20' },
        { accent: 'text-pink-500', bg5: 'bg-pink-500/5', bg20: 'bg-pink-500/20' },
        { accent: 'text-cyan-500', bg5: 'bg-cyan-500/5', bg20: 'bg-cyan-500/20' },
        { accent: 'text-violet-500', bg5: 'bg-violet-500/5', bg20: 'bg-violet-500/20' },
        { accent: 'text-rose-500', bg5: 'bg-rose-500/5', bg20: 'bg-rose-500/20' },
        { accent: 'text-lime-500', bg5: 'bg-lime-500/5', bg20: 'bg-lime-500/20' }
    ];

    return (
        <div className="w-full bg-card rounded-3xl border border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
                    <thead>
                        <tr className="bg-bg-secondary">
                            <th className="px-4 py-3 text-sm font-bold text-accent border-b border-r border-gray-800 w-[150px]">Phase</th>
                            <th className="px-4 py-3 text-sm font-bold text-accent border-b border-r border-gray-800 w-[200px]">Milestone</th>
                            {months.map(month => (
                                <th key={month.key} className="px-3 py-3 text-xs font-semibold text-text-muted border-b border-r border-gray-800 last:border-r-0 min-w-[100px]">
                                    {month.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map((phase, pIdx) => {
                            const colorSet = phaseColors[pIdx % phaseColors.length];
                            return (
                                <React.Fragment key={phase.id}>
                                    {phase.milestones.map((ms, mIdx) => (
                                        <tr key={ms.id} className="group">
                                            {mIdx === 0 && (
                                                <td 
                                                    rowSpan={phase.milestones.length} 
                                                    className="px-4 py-2 text-center border-b border-r border-gray-800 bg-card align-middle"
                                                >
                                                    <span className={`text-sm font-bold ${colorSet.accent} leading-tight block`}>
                                                        {phase.phase_title}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-4 py-2 text-sm text-text-primary font-bold border-b border-r border-gray-800">
                                                <div className="flex flex-col gap-1">
                                                    <span>{ms.milestone_name}</span>
                                                    <span className={`text-[10px] font-bold ${colorSet.accent} ${colorSet.bg5} px-2 py-0.5 rounded-full w-fit`}>
                                                        Weight: {ms.weight_percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            {months.map((month) => {
                                                const progress = getProgressInMonth(ms, month.key);
                                                return (
                                                    <td key={month.key} className="p-0 border-b border-r border-gray-800 last:border-r-0 h-[40px] relative">
                                                        {progress !== null && (
                                                            <div className={`absolute inset-0 ${colorSet.bg5} overflow-hidden flex items-center justify-center`}>
                                                                <div 
                                                                    className={`absolute left-0 top-0 bottom-0 ${colorSet.bg20} transition-all duration-500`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                                <span className={`${colorSet.accent} font-bold text-sm relative z-10`}>{progress}%</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Action Footer */}
            <div className="p-6 bg-card flex justify-center">
                <button 
                    onClick={onViewProgress}
                    className="w-full max-w-4xl py-4 bg-accent hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#706BFF]/20"
                >
                    View Progress
                </button>
            </div>
        </div>
    );
}
