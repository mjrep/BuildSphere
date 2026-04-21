import React from 'react';

export default function OverviewProgressCard({ progress }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 lg:p-8 w-full flex flex-col justify-center relative">
            <div className="flex justify-between items-start mb-6 w-full absolute top-6 left-6 pr-12">
                <h3 className="text-base font-bold text-[#1A1A1A]">Project Progress</h3>
                <p className="text-[10px] text-[#A1A1A1] mt-0.5 whitespace-nowrap">as of {new Date().toLocaleDateString('en-US', { month: '2-digit', day:'2-digit', year:'2-digit' })}</p>
            </div>
            
            <div className="flex flex-col items-start mt-8 pt-4 w-full">
                <div className="flex items-end gap-4 mb-4">
                    <span className="text-7xl font-bold font-display text-[#5B9C2A] leading-none tracking-tighter">
                        {progress}%
                    </span>
                    <svg className="w-8 h-8 text-[#F5B020] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                
                <div className="w-full h-1.5 bg-[#F0F0F8] rounded-full overflow-hidden mt-2 relative">
                    <div 
                        className="h-full bg-[#5B9C2A] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
