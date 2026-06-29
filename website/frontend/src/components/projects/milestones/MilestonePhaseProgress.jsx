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
        <div className="bg-card rounded-2xl border border-border-primary p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-text-primary font-bold text-lg">Phases Progress</h3>
                <button className="text-text-muted hover:text-accent transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {phases.map((phase) => (
                    <div 
                        key={phase.id}
                        onClick={() => scrollToPhase(phase.id)}
                        className="flex items-center justify-between p-5 rounded-xl border border-border-primary hover:border-[#706BFF] hover:bg-accent/5 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <span className="text-base font-semibold text-text-muted group-hover:text-accent transition-colors">
                            {phase.name || phase.phase_title}
                        </span>
                        
                        <div className="flex items-center gap-4">
                            <CircularProgress 
                                percentage={phase.progress} 
                                size={50} 
                                strokeWidth={6}
                                color="text-[#59A240]"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
