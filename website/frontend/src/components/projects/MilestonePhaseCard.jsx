import React from 'react';
import PhaseTitleSelect from './PhaseTitleSelect';
import MilestoneRowForm from './MilestoneRowForm';

export default function MilestonePhaseCard({ 
    phaseIndex, 
    phase, 
    onChange, 
    onAddMilestone, 
    onRemoveMilestone, 
    onMilestoneChange,
    errors = {} 
}) {
    const handlePhaseChange = (field, value) => {
        onChange(phaseIndex, field, value);
    };

    const hasError = Object.keys(errors).length > 0;

    return (
        <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 ${
            hasError 
                ? 'bg-red-50/30 border-red-400 ring-2 ring-red-400/20' 
                : 'bg-bg-secondary border-border-primary'
        }`}>
            {/* Phase Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1 relative">
                    <label className="block text-xs font-semibold text-text-primary ml-1">
                        Phase {phaseIndex + 1} Title
                    </label>
                    <PhaseTitleSelect
                        value={phase.phase_key}
                        onChange={(e) => handlePhaseChange('phase_key', e.target.value)}
                        error={errors.phase_key}
                    />
                </div>

                <div className="space-y-1 relative">
                    <label className="block text-xs font-semibold text-text-primary ml-1">
                        Weight
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={phase.weight_percentage}
                            onChange={(e) => handlePhaseChange('weight_percentage', e.target.value)}
                            className={`w-full rounded-xl border px-4 py-3 pr-8 text-sm ${
                                errors.weight_percentage ? 'border-red-400 focus:ring-red-200' : 'border-border-primary focus:border-[#706BFF] focus:ring-[#706BFF]/20'
                            } focus:outline-none focus:ring-2`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">%</span>
                    </div>
                    {errors.weight_percentage && <p className="text-red-500 text-[10px] ml-1 mt-1">{errors.weight_percentage}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-primary ml-1">
                        Phase Start
                    </label>
                    <input
                        type="date"
                        value={phase.start_date}
                        onChange={(e) => handlePhaseChange('start_date', e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-[#5A5A5A] ${
                            errors.start_date ? 'border-red-400 focus:ring-red-200' : 'border-border-primary focus:border-[#706BFF] focus:ring-[#706BFF]/20'
                        } focus:outline-none focus:ring-2`}
                    />
                    {errors.start_date && <p className="text-red-500 text-[10px] ml-1 mt-1">{errors.start_date}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-primary ml-1">
                        Phase End
                    </label>
                    <input
                        type="date"
                        value={phase.end_date}
                        onChange={(e) => handlePhaseChange('end_date', e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-[#5A5A5A] ${
                            errors.end_date ? 'border-red-400 focus:ring-red-200' : 'border-border-primary focus:border-[#706BFF] focus:ring-[#706BFF]/20'
                        } focus:outline-none focus:ring-2`}
                    />
                    {errors.end_date && <p className="text-red-500 text-[10px] ml-1 mt-1">{errors.end_date}</p>}
                </div>
            </div>

            {/* Milestones List Header */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    Milestones
                    <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full">
                        {phase.milestones.length}
                    </span>
                </h3>
                
                {/* 100% Helper UI */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Phase Weight Total:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${
                                    Math.abs(phase.milestones.reduce((sum, m) => sum + parseFloat(m.weight_percentage || 0), 0) - 100) < 0.01 
                                        ? 'bg-emerald-500' 
                                        : 'bg-red-400'
                                }`}
                                style={{ width: `${Math.min(100, phase.milestones.reduce((sum, m) => sum + parseFloat(m.weight_percentage || 0), 0))}%` }}
                            />
                        </div>
                        <span className={`text-xs font-bold ${
                            Math.abs(phase.milestones.reduce((sum, m) => sum + parseFloat(m.weight_percentage || 0), 0) - 100) < 0.01 
                                ? 'text-emerald-600' 
                                : 'text-red-500'
                        }`}>
                            {phase.milestones.reduce((sum, m) => sum + parseFloat(m.weight_percentage || 0), 0).toFixed(1)}% / 100%
                        </span>
                    </div>
                </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-4">
                {phase.milestones.map((milestone, msIndex) => (
                    <MilestoneRowForm
                        key={msIndex}
                        index={msIndex}
                        milestone={milestone}
                        onChange={(idx, field, val) => onMilestoneChange(phaseIndex, idx, field, val)}
                        onRemove={(idx) => onRemoveMilestone(phaseIndex, idx)}
                        error={errors.milestones?.[msIndex]}
                    />
                ))}
            </div>

            {/* Add Milestone Button */}
            <div className="mt-4 flex justify-center">
                <button
                    type="button"
                    onClick={() => onAddMilestone(phaseIndex)}
                    className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
                >
                    Add one more milestone
                </button>
            </div>
            
            {errors.general && <p className="text-red-500 text-xs mt-3 text-center">{errors.general}</p>}
        </div>
    );
}
