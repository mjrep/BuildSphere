import React from 'react';

/**
 * Replicates the Gantt-like milestone tracking grid from Mockup 1.
 */
export default function MilestoneGanttGrid({ phases, months = [], onViewProgress }) {

    const getBarStyles = (ms) => {
        if (!months || months.length === 0 || !ms.start_date || !ms.end_date) return null;
        
        const [sYear, sMonth, sDay] = ms.start_date.split('-');
        const msStartYear = parseInt(sYear);
        const msStartMonth = parseInt(sMonth);
        const msStartDay = parseInt(sDay);

        const [eYear, eMonth, eDay] = ms.end_date.split('-');
        const msEndYear = parseInt(eYear);
        const msEndMonth = parseInt(eMonth);
        const msEndDay = parseInt(eDay);

        const getVisualUnits = (year, month, day, isEnd) => {
            // Find the month in our timeline
            let index = months.findIndex(m => {
                const [mYear, mMonth] = m.key.split('-');
                return parseInt(mYear) === year && parseInt(mMonth) === month;
            });

            if (index === -1) {
                // If not found, check if it's before or after the timeline
                const firstMonthKey = months[0].key.split('-');
                const firstMonthDate = new Date(parseInt(firstMonthKey[0]), parseInt(firstMonthKey[1]) - 1, 1);
                const targetDate = new Date(year, month - 1, day);
                
                if (targetDate < firstMonthDate) {
                    return 0; // Clamped to start of timeline
                } else {
                    return months.length; // Clamped to end of timeline
                }
            }

            const daysInMonth = new Date(year, month, 0).getDate();
            // Start date: day 1 is 0 offset. End date: day 15 is 15 days of duration (15/daysInMonth).
            const fraction = isEnd ? (day / daysInMonth) : ((day - 1) / daysInMonth);
            
            return index + fraction;
        };

        const leftVisualUnits = getVisualUnits(msStartYear, msStartMonth, msStartDay, false);
        const rightVisualUnits = getVisualUnits(msEndYear, msEndMonth, msEndDay, true);
        const widthVisualUnits = rightVisualUnits - leftVisualUnits;

        if (widthVisualUnits <= 0) return null;
        
        return {
            leftPercent: leftVisualUnits * 100,
            widthPercent: widthVisualUnits * 100
        };
    };

    const phaseColors = [
        { accent: 'text-[#706BFF]', bgTrack: 'bg-[#E5E4FF]', borderTrack: 'border-[#706BFF]/30', fill: 'bg-[#706BFF]' },
        { accent: 'text-emerald-600', bgTrack: 'bg-emerald-100', borderTrack: 'border-emerald-300', fill: 'bg-emerald-500' },
        { accent: 'text-amber-600', bgTrack: 'bg-amber-100', borderTrack: 'border-amber-300', fill: 'bg-amber-500' },
        { accent: 'text-pink-600', bgTrack: 'bg-pink-100', borderTrack: 'border-pink-300', fill: 'bg-pink-500' },
        { accent: 'text-cyan-600', bgTrack: 'bg-cyan-100', borderTrack: 'border-cyan-300', fill: 'bg-cyan-500' },
        { accent: 'text-violet-600', bgTrack: 'bg-violet-100', borderTrack: 'border-violet-300', fill: 'bg-violet-500' },
        { accent: 'text-rose-600', bgTrack: 'bg-rose-100', borderTrack: 'border-rose-300', fill: 'bg-rose-500' },
        { accent: 'text-lime-600', bgTrack: 'bg-lime-100', borderTrack: 'border-lime-300', fill: 'bg-lime-500' }
    ];

    return (
        <div className="w-full bg-card rounded-3xl border border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-separate table-fixed" style={{ borderSpacing: 0, minWidth: `${350 + months.length * 100}px` }}>
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
                                                    className="px-4 py-2 text-left border-b border-r border-gray-800 bg-card align-middle"
                                                >
                                                    <span className={`text-sm font-bold text-text-primary leading-tight block`}>
                                                        {phase.phase_title}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-4 py-2 text-sm text-text-primary font-bold border-b border-r border-gray-800">
                                                <div className="flex flex-col gap-1">
                                                    <span>{ms.milestone_name}</span>
                                                    <span className={`text-[10px] font-bold ${colorSet.accent} ${colorSet.bgTrack.replace('bg-', 'bg-opacity-50 bg-')} px-2 py-0.5 rounded-full w-fit`}>
                                                        Weight: {ms.weight_percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {months.map((month, idx) => (
                                                <td key={month.key} className={`p-0 border-b border-r border-gray-800 last:border-r-0 h-[40px] relative ${idx === 0 ? 'z-10' : ''}`}>
                                                    {idx === 0 && (() => {
                                                        const barInfo = getBarStyles(ms);
                                                        const progress = ms.progress_percentage || 0;
                                                        if (!barInfo) return null;
                                                        
                                                        const isSmallBar = barInfo.widthPercent <= (8 * months.length); // Adjusted threshold since widthPercent is relative to one column

                                                        const barStyle = {
                                                            left: `${barInfo.leftPercent}%`,
                                                            width: `${barInfo.widthPercent}%`
                                                        };

                                                        return (
                                                            <div 
                                                                className="absolute top-1/2 -translate-y-1/2 pointer-events-none h-8"
                                                                style={barStyle}
                                                            >
                                                                {/* Track and Fill (Clipped to rounded corners) */}
                                                                <div 
                                                                    className={`absolute inset-0 rounded-full overflow-hidden ${colorSet.bgTrack} border ${colorSet.borderTrack} shadow-sm pointer-events-auto`}
                                                                >
                                                                    <div 
                                                                        className={`absolute left-0 top-0 bottom-0 ${colorSet.fill} transition-all duration-500`}
                                                                        style={{ 
                                                                            width: `${progress}%`, 
                                                                            opacity: progress > 0 ? 1 : 0,
                                                                            boxShadow: progress > 0 ? '2px 0 8px rgba(0,0,0,0.15)' : 'none'
                                                                        }}
                                                                    />
                                                                    
                                                                    {!isSmallBar && (
                                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                            <span className={`font-bold text-[10px] px-1 drop-shadow-sm ${progress > 50 ? 'text-white' : colorSet.accent}`}>
                                                                                {progress}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {isSmallBar && (
                                                                    <div className="absolute top-0 bottom-0 left-full flex items-center pl-2 pointer-events-none">
                                                                        <span className={`${colorSet.accent} font-bold text-[10px]`}>
                                                                            {progress}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            ))}
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
