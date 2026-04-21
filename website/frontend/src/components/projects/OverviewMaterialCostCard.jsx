import React from 'react';

export default function OverviewMaterialCostCard({ costData }) {
    const planned = costData?.planned || 0;
    const actual = costData?.actual || 0;
    
    const isOverBudget = actual > planned && planned > 0;
    const badgeBg = isOverBudget ? 'bg-red-500' : 'bg-[#5B9C2A]';
    const badgeText = isOverBudget ? 'Over Budget' : 'On Budget';

    // Simple pie chart logic
    // We will use an SVG circle with stroke-dasharray
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    
    // Percentage actual is of planned
    let actualPercent = planned > 0 ? (actual / planned) : 0;
    if (actualPercent > 1) actualPercent = 1; // Cap at 100% for the pie visual to not break
    
    const dashOffset = circumference * (1 - actualPercent);
    
    const formatCurrency = (val) =>
        val != null ? `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '₱0';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 w-full flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">Material Cost</h3>
                    <p className="text-[10px] text-[#A1A1A1] mt-0.5">as of {new Date().toLocaleDateString('en-US', { month: '2-digit', day:'2-digit', year:'2-digit' })}</p>
                </div>
                {planned > 0 && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm ${badgeBg}`}>
                        {badgeText}
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[140px]">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 140 140">
                    {/* Background Circle (Planned) */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke="#5B9C2A"
                        strokeWidth="20"
                    />
                    {/* Foreground Circle (Actual) */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke="#2D2D2D"
                        strokeWidth="20"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                    />
                </svg>
            </div>

            <div className="flex justify-between items-end mt-4">
                <div className="text-left">
                    <p className="text-sm font-bold text-[#5B9C2A]">{formatCurrency(actual)}</p>
                    <p className="text-xs text-[#1A1A1A] font-semibold mt-0.5">Actual</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(planned)}</p>
                    <p className="text-xs text-[#1A1A1A] font-semibold mt-0.5">Planned</p>
                </div>
            </div>
            {actual === 0 && (
                <div className="mt-2 text-[10px] text-gray-400 text-center italic">
                    *Actual cost mocked until inventory integration.
                </div>
            )}
        </div>
    );
}
