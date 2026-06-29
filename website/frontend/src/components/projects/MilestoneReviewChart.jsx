import React from 'react';

export default function MilestoneReviewChart({ data }) {
    if (!data || !data.phases || data.phases.length === 0) {
        return <div className="p-8 text-center text-text-muted">No milestone data available to display.</div>;
    }

    const { timeline_months, phases } = data;

    const getBarStyles = (ms) => {
        if (!timeline_months || timeline_months.length === 0 || !ms.start_date || !ms.end_date) return null;
        
        const [sYear, sMonth, sDay] = ms.start_date.split('-');
        const msStartYear = parseInt(sYear);
        const msStartMonth = parseInt(sMonth);
        const msStartDay = parseInt(sDay);

        const [eYear, eMonth, eDay] = ms.end_date.split('-');
        const msEndYear = parseInt(eYear);
        const msEndMonth = parseInt(eMonth);
        const msEndDay = parseInt(eDay);

        const getVisualUnits = (year, month, day, isEnd) => {
            let index = timeline_months.findIndex(m => {
                const [mYear, mMonth] = m.key.split('-');
                return parseInt(mYear) === year && parseInt(mMonth) === month;
            });

            if (index === -1) {
                const firstMonthKey = timeline_months[0].key.split('-');
                const firstMonthDate = new Date(parseInt(firstMonthKey[0]), parseInt(firstMonthKey[1]) - 1, 1);
                const targetDate = new Date(year, month - 1, day);
                
                if (targetDate < firstMonthDate) {
                    return 0;
                } else {
                    return timeline_months.length;
                }
            }

            const daysInMonth = new Date(year, month, 0).getDate();
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
        <div className="w-full overflow-x-auto rounded-xl border border-border-primary">
            <table className="w-full border-separate table-fixed" style={{ borderSpacing: 0, minWidth: `${350 + timeline_months.length * 100}px` }}>
                <thead>
                    <tr className="bg-bg-secondary">
                        <th className="px-4 py-3 text-sm font-bold text-accent border-b border-r border-border-primary w-[150px]">Phase</th>
                        <th className="px-4 py-3 text-sm font-bold text-accent border-b border-r border-border-primary w-[200px]">Milestone</th>
                        {timeline_months.map(month => (
                            <th key={month.key} className="px-3 py-3 text-xs font-semibold text-text-muted border-b border-r border-border-primary last:border-r-0 min-w-[100px]">
                                {month.label} {month.year !== timeline_months[0]?.year ? month.year : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {phases.map((phase, pIdx) => {
                        const colorSet = phaseColors[pIdx % phaseColors.length];
                        return (
                            <React.Fragment key={phase.id || pIdx}>
                                {phase.milestones.map((ms, mIdx) => (
                                    <tr key={ms.id || mIdx} className="group hover:bg-bg-secondary transition-colors">
                                        {mIdx === 0 && (
                                            <td 
                                                rowSpan={phase.milestones.length} 
                                                className="px-4 py-2 text-left border-b border-r border-border-primary bg-card align-middle group-hover:bg-card"
                                            >
                                                <span className={`text-sm font-bold text-text-primary leading-tight block`}>
                                                    {phase.phase_title || phase.phase_key} ({phase.weight_percentage}%)
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-2 text-sm text-text-primary font-bold border-b border-r border-border-primary">
                                            <div className="flex flex-col gap-1">
                                                <span>{ms.milestone_name}</span>
                                                {ms.has_quantity && ms.quantity_target && (
                                                    <span className={`text-[10px] font-bold ${colorSet.accent} ${colorSet.bgTrack.replace('bg-', 'bg-opacity-50 bg-')} px-2 py-0.5 rounded-full w-fit`}>
                                                        Qty: {ms.quantity_target}
                                                    </span>
                                                )}
                                                <div className="text-[10px] font-normal text-text-muted mt-0.5">
                                                    {ms.start_date} to {ms.end_date}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {timeline_months.map((month, idx) => (
                                            <td key={month.key} className={`p-0 border-b border-r border-border-primary last:border-r-0 h-[40px] relative ${idx === 0 ? 'z-10' : ''}`}>
                                                {idx === 0 && (() => {
                                                    const barInfo = getBarStyles(ms);
                                                    if (!barInfo) return null;
                                                    
                                                    const isSmallBar = barInfo.widthPercent <= (8 * timeline_months.length);

                                                    const barStyle = {
                                                        left: `${barInfo.leftPercent}%`,
                                                        width: `${barInfo.widthPercent}%`
                                                    };

                                                    return (
                                                        <div 
                                                            className="absolute top-1/2 -translate-y-1/2 pointer-events-none h-8"
                                                            style={barStyle}
                                                        >
                                                            <div 
                                                                className={`absolute inset-0 rounded-full overflow-hidden ${colorSet.bgTrack} border ${colorSet.borderTrack} shadow-sm pointer-events-auto`}
                                                            >
                                                                <div 
                                                                    className={`absolute left-0 top-0 bottom-0 ${colorSet.fill} opacity-90 transition-all duration-500`}
                                                                    style={{ width: '100%' }}
                                                                />
                                                                
                                                                {!isSmallBar && (
                                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                                                                        <span className="font-bold text-[10px] px-1 drop-shadow-sm text-white">
                                                                            {ms.milestone_name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
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
    );
}
