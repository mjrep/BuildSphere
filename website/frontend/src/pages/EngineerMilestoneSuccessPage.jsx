import React from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

export default function EngineerMilestoneSuccessPage() {
    return (
        <DashboardLayout pageTitle={<span className="font-bold">Milestones Success</span>}>
            <div className="flex-1 bg-card flex items-center justify-center p-8 min-h-[60vh] rounded-2xl">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent mb-6 shadow-sm">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-text-primary">Milestones Saved!</h1>
                    <p className="text-[#5A5A5A]">
                        The milestone plan has been successfully submitted and is now pending Accounting approval.
                    </p>
                    
                    <div className="pt-8">
                        <Link
                            to="/projects"
                            className="inline-block px-8 py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-colors shadow-sm"
                        >
                            Back to Projects
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
