import React from 'react';

export default function AiAssessmentModal({ assessment, onClose }) {
    if (!assessment) return null;

    const { ai_assessment } = assessment;
    if (!ai_assessment) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#0A0A1F]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-[#706BFF] to-[#A39FFF] p-8 text-white relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.712L18 9.75l-.259-1.038a3.375 3.375 0 00-2.453-2.453L14.25 6l1.038-.259a3.375 3.375 0 002.453-2.453L18 2.25l.259 1.038a3.375 3.375 0 002.453 2.453L21.75 6l-1.038.259a3.375 3.375 0 00-2.453 2.453z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold font-display tracking-tight">Project Intelligence Report</h2>
                    </div>
                    <p className="text-white/80 text-sm font-medium">Powered by Gemini 2.5 Flash</p>
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Status & Risk Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#F8F8FF] rounded-2xl p-5 border border-[#E8E8FF]">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1] mb-1 block">Project Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${ai_assessment.project_status === 'Delayed' ? 'bg-red-500' : 'bg-green-500'}`} />
                                <span className="text-lg font-bold text-[#1A1A1A]">{ai_assessment.project_status}</span>
                            </div>
                        </div>
                        <div className="bg-[#F8F8FF] rounded-2xl p-5 border border-[#E8E8FF]">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1] mb-1 block">Risk Level</span>
                            <span className={`text-lg font-bold ${
                                ai_assessment.risk_level === 'High' ? 'text-red-500' : 
                                ai_assessment.risk_level === 'Medium' ? 'text-orange-500' : 'text-green-500'
                            }`}>{ai_assessment.risk_level}</span>
                        </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="mb-8">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#A1A1A1] mb-3">Executive Summary</h3>
                        <p className="text-[#1A1A1A] leading-relaxed text-[15px] font-medium bg-[#706BFF]/5 p-5 rounded-2xl border border-[#706BFF]/10 italic">
                            "{ai_assessment.executive_summary}"
                        </p>
                    </div>

                    {/* Suggested Actions */}
                    <div className="mb-8">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#A1A1A1] mb-4">Strategic Recommendations</h3>
                        <div className="space-y-3">
                            {ai_assessment.suggested_actions.map((action, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white border border-[#F0F0F8] rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#706BFF]/10 flex items-center justify-center text-[#706BFF] font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-[#4A4A4A] font-medium pt-1.5">{action}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Milestone Flags */}
                    {ai_assessment.milestone_flags && ai_assessment.milestone_flags.length > 0 && (
                        <div>
                            <h3 className="text-xs uppercase tracking-widest font-bold text-[#A1A1A1] mb-4">Milestone Health</h3>
                            <div className="space-y-3">
                                {ai_assessment.milestone_flags.map((flag, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-[#F0F0F8] bg-gray-50/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-[#A1A1A1]">{flag.phase_name}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                flag.flag === 'Critical' ? 'bg-red-100 text-red-600' : 
                                                flag.flag === 'At Risk' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                                {flag.flag}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-[#1A1A1A] mb-1">{flag.milestone_name}</p>
                                        <p className="text-xs text-[#6B6B6B]">{flag.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#F0F0F8] bg-[#F8F8FF] flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-[#1A1A1A] text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-black/10"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
}
