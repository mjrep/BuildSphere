import React from 'react';
import CircularProgress from './CircularProgress';

/**
 * Replicates the "Phases Progress" section from Mockup 2.
 * Updated to act as a summary dashboard and navigation.
 */
export default function MilestonePhaseProgress({ phases }) {
    const scrollToPhase = (id) => {
        const element = document.getElementById(`phase-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-[#F0F0F8] p-10 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[#1A1A1A] font-bold text-xl">Phases Progress</h3>
                <button className="text-[#A1A1A1] hover:text-[#706BFF] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5">
                {phases.map((phase) => (
                    <div 
                        key={phase.id}
                        onClick={() => scrollToPhase(phase.id)}
                        className="flex items-center justify-between p-8 rounded-2xl border border-[#F0F0F8] hover:border-[#706BFF] hover:bg-[#706BFF]/5 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <span className="text-xl font-medium text-[#A1A1A1] group-hover:text-[#706BFF] transition-colors">
                            {phase.name}
                        </span>
                        
                        <div className="flex items-center gap-4">
                            <CircularProgress 
                                percentage={phase.progress} 
                                size={70} 
                                strokeWidth={8}
                                color="text-[#59A240]"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
