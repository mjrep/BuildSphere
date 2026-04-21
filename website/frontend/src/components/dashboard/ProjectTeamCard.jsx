import React from 'react';

export default function ProjectTeamCard({ project_name, location, engr_name, memberCount, tasksDone, tasksTotal, members, milestone_segments }) {
    const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

    // Use milestone-specific segments if available, fallback to a single primary color if not
    const segments = (milestone_segments && milestone_segments.length > 0) 
        ? milestone_segments.map(s => ({ color: s.color, width: `${s.percentage}%` }))
        : [{ color: 'bg-[#706BFF]', width: `${pct}%` }];

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F0F0F8]">
            <h4 className="font-bold text-[#1A1A1A] text-sm mb-0.5 truncate" title={project_name}>{project_name}</h4>
            <p className="text-xs text-[#A1A1A1] truncate" title={location}>{location}</p>
            <div className="flex items-center gap-1 mt-0.5 mb-4">
                <svg className="w-3 h-3 text-[#A1A1A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-xs text-[#A1A1A1] truncate" title={engr_name}>{engr_name}</p>
            </div>

            <p className="text-xs text-[#6B7280] mb-1">Tasks Done: {tasksDone}/{tasksTotal}</p>

            {/* Multi-color progress bar */}
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-[#F0F0F8] mb-1">
                {segments.map((s, i) => (
                    <div key={i} className={`h-full ${s.color}`} style={{ width: s.width }} />
                ))}
            </div>
            <p className="text-xs text-[#6B7280] text-right mb-4">{pct}%</p>

            {/* Avatar circles */}
            <div className="flex items-center gap-1.5">
                {members.map((m, i) => (
                    <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: m.color }}
                    >
                        {m.initials}
                    </div>
                ))}
            </div>
        </div>
    );
}
