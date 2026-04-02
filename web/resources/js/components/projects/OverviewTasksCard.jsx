import React from 'react';

export default function OverviewTasksCard({ tasksSummary }) {
    const completed = tasksSummary?.completed || 0;
    const total = tasksSummary?.total || 0;
    
    // Percentage for arc
    let percent = total > 0 ? (completed / total) : 0;
    if (percent > 1) percent = 1;
    
    // Circular progress math
    const radius = 50;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - percent * circumference;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 w-full flex flex-col h-full relative">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">Tasks</h3>
                    <p className="text-[10px] text-[#A1A1A1] mt-0.5">as of {new Date().toLocaleDateString('en-US', { month: '2-digit', day:'2-digit', year:'2-digit' })}</p>
                </div>
                <div className="bg-[#F0F0F8] rounded py-1 px-3 text-xs font-semibold text-[#1A1A1A]">
                    {total}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative my-4">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    {/* Background Ring */}
                    <circle
                        stroke="#F0F0F8"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Inner styling ring (optional but adds depth) */}
                    <circle
                        stroke="#1A1A1A"
                        fill="transparent"
                        strokeWidth="1"
                        r={normalizedRadius - strokeWidth/2 - 2}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Foreground Ring */}
                    <circle
                        stroke="#FF5A5F"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
            </div>

            <div className="flex justify-between items-end mt-2">
                <div className="text-center">
                    <p className="text-sm font-bold text-[#FF5A5F]">{completed}</p>
                    <p className="text-[11px] text-[#1A1A1A] font-semibold mt-0.5">Completed</p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-[#1A1A1A]">{total}</p>
                    <p className="text-[11px] text-[#1A1A1A] font-semibold mt-0.5">Planned</p>
                </div>
            </div>
        </div>
    );
}
