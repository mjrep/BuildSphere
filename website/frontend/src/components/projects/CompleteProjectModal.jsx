import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Modal for confirming project completion with strict verification.
 */
export default function CompleteProjectModal({ project, onConfirm, onClose, isSubmitting }) {
    const [verificationText, setVerificationText] = useState('');
    const isValid = verificationText === 'COMPLETE';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-[#0A0A0B]/40 backdrop-blur-md transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Content - Glassmorphism style */}
            <div className="relative bg-card w-full max-w-md rounded-[32px] border border-border-primary shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-text-primary font-display">Finalize Project</h3>
                            <p className="text-sm text-text-muted font-medium">Archiving project data</p>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-accent/5 border border-[#706BFF]/10 rounded-2xl p-5 mb-8">
                        <div className="flex gap-3">
                            <AlertTriangle className="text-accent shrink-0" size={18} />
                            <p className="text-sm text-text-secondary leading-relaxed">
                                You are about to mark <span className="font-bold text-text-primary">{project.project_name}</span> as completed. 
                                This will <strong>lock all project modules</strong> to a read-only state.
                            </p>
                        </div>
                    </div>

                    {/* Verification Input */}
                    <div className="space-y-3 mb-10">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                Verification Step
                            </label>
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                                Type COMPLETE
                            </span>
                        </div>
                        <input 
                            type="text"
                            value={verificationText}
                            onChange={(e) => setVerificationText(e.target.value)}
                            placeholder="Type here..."
                            className="w-full bg-bg-tertiary border border-border-primary rounded-xl px-5 py-4 text-text-primary font-bold tracking-widest text-center focus:ring-4 focus:ring-[#706BFF]/10 focus:border-[#706BFF] outline-none transition-all placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal"
                            autoFocus
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            disabled={!isValid || isSubmitting}
                            onClick={onConfirm}
                            className={`w-full py-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-3 ${
                                isValid && !isSubmitting
                                    ? 'bg-gradient-to-r from-[#706BFF] to-[#5B55E6] text-white shadow-xl shadow-[#706BFF]/25 hover:shadow-[#706BFF]/40 hover:-translate-y-0.5'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                'Confirm and Lock Project'
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-sm font-bold text-text-muted hover:text-accent transition-colors rounded-xl"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
