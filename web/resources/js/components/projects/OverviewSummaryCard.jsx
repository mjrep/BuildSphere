import React from 'react';
import StatusBadge from './StatusBadge';

export default function OverviewSummaryCard({ project }) {
    const formatCurrency = (val) =>
        val != null ? `₱ ${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';
        
    const metrics = project.status_metrics || {};

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 lg:p-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative">
                <div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2 font-display">{project.project_name}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {metrics.status === 'delayed' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Delayed</span>
                        )}
                        {metrics.status === 'near_due' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Near Due</span>
                        )}
                        {metrics.status === 'on_track' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">On Track</span>
                        )}
                        {metrics.days_left !== null && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 gap-1 border border-blue-100">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {metrics.days_left} days left
                            </span>
                        )}
                    </div>
                </div>
                
                {/* 3 dots menu placeholder */}
                <button className="absolute top-0 right-0 p-2 text-[#A1A1A1] hover:text-[#1A1A1A] transition-colors rounded-full hover:bg-gray-50">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z"/>
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm mt-8">
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Project Engineer</span>
                    <p className="font-bold text-[#1A1A1A]">{project.project_in_charge?.name || '—'}</p>
                </div>
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Client</span>
                    <p className="font-bold text-[#1A1A1A]">{project.client_name}</p>
                </div>
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Contract Price</span>
                    <p className="font-bold text-[#1A1A1A]">{formatCurrency(project.contract_price)}</p>
                </div>
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Project Start</span>
                    <p className="font-bold text-[#1A1A1A]">{project.start_date}</p>
                </div>
                
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Budget</span>
                    <p className="font-bold text-[#1A1A1A]">{formatCurrency(project.budget_for_materials)}</p>
                </div>
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Address</span>
                    <p className="font-bold text-[#1A1A1A] pr-4">{project.address}</p>
                </div>
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Contract Unit Price</span>
                    <p className="font-bold text-[#1A1A1A]">{formatCurrency(project.contract_unit_price)} per panel</p>
                </div>
                <div>
                    <span className="text-[#A1A1A1] block mb-1 text-xs font-semibold">Project End</span>
                    <p className="font-bold text-[#1A1A1A]">{project.end_date}</p>
                </div>
            </div>
        </div>
    );
}
