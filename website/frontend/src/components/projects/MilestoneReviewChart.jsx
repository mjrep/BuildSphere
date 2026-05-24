import React from 'react';

export default function MilestoneReviewChart({ data }) {
    if (!data || !data.phases || data.phases.length === 0) {
        return <div className="p-8 text-center text-gray-500">No milestone data available to display.</div>;
    }

    const { timeline_months, phases } = data;

    // Distinct colors for different phases
    const phaseColors = [
        { solid: 'bg-[#706BFF]', light: 'bg-[#706BFF]/20' }, // default accent
        { solid: 'bg-emerald-500', light: 'bg-emerald-500/20' },
        { solid: 'bg-amber-500', light: 'bg-amber-500/20' },
        { solid: 'bg-pink-500', light: 'bg-pink-500/20' },
        { solid: 'bg-cyan-500', light: 'bg-cyan-500/20' },
        { solid: 'bg-violet-500', light: 'bg-violet-500/20' },
        { solid: 'bg-rose-500', light: 'bg-rose-500/20' },
        { solid: 'bg-lime-500', light: 'bg-lime-500/20' }
    ];

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-border-primary">
            <table className="w-full text-left border-collapse">
                <thead className="bg-bg-secondary text-xs font-semibold text-[#5A5A5A] whitespace-nowrap">
                    <tr>
                        <th className="p-4 border-b border-r border-border-primary min-w-[200px]">Project Phase</th>
                        <th className="p-4 border-b border-r border-border-primary min-w-[200px]">Milestone</th>
                        {timeline_months.map((month) => (
                            <th key={month.key} className="p-4 text-center border-b border-r border-border-primary min-w-[100px]">
                                {month.label} {month.year !== timeline_months[0]?.year ? month.year : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {phases.map((phase, pIndex) => {
                        const colorSet = phaseColors[pIndex % phaseColors.length];
                        
                        return (
                            <React.Fragment key={phase.id}>
                                {/* Phase Row */}
                                <tr className="bg-bg-secondary font-semibold text-text-primary">
                                    <td colSpan={2} className="p-4 border-b border-r border-border-primary">
                                        {phase.phase_title} ({phase.weight_percentage}%)
                                    </td>
                                    {timeline_months.map((month) => {
                                        // Check if phase spans this month (rough check for visual phase bar)
                                        const pStart = phase.start_date ? phase.start_date.substring(0, 7) : '';
                                        const pEnd = phase.end_date ? phase.end_date.substring(0, 7) : '';
                                        const isSpan = pStart && pEnd && month.key >= pStart && month.key <= pEnd;
                                        return (
                                            <td key={`${phase.id}-${month.key}`} className="p-0 border-b border-r border-border-primary h-12">
                                                {isSpan && (
                                                    <div className={`h-full w-full ${colorSet.light}`}></div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                                
                                {/* Milestone Rows */}
                                {phase.milestones.map((ms) => (
                                    <tr key={ms.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 border-b border-r border-border-primary text-gray-400 pl-8">
                                            ↳
                                        </td>
                                        <td className="p-4 border-b border-r border-border-primary text-text-primary">
                                            {ms.milestone_name} 
                                            {ms.has_quantity && ms.quantity_target && (
                                                <span className={`ml-2 text-xs ${colorSet.solid.replace('bg-', 'text-')} ${colorSet.light} px-2 py-0.5 rounded-full`}>
                                                    Qty: {ms.quantity_target}
                                                </span>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                {ms.start_date} to {ms.end_date}
                                            </div>
                                        </td>
                                        {timeline_months.map((month) => {
                                            const isSpan = ms.month_spans.includes(month.key);
                                            return (
                                                <td key={`${ms.id}-${month.key}`} className="p-2 border-b border-r border-border-primary h-16">
                                                    {isSpan && (
                                                        <div className={`h-full w-full ${colorSet.solid} rounded-md shadow-sm opacity-90 transition-opacity hover:opacity-100 flex items-center justify-center`}>
                                                            <span className="text-white text-xs opacity-0 hover:opacity-100 cursor-default px-1 text-center leading-tight">
                                                                {ms.milestone_name}
                                                            </span>
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
    );
}
