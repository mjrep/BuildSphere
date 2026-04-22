import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import useAuth from '../../hooks/useAuth';

export default function ProposedProjectView({ project }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const formatCurrency = (val) =>
        val != null ? `₱ ${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';

    // Normalize roles for comparison
    const userRole = (user?.role || '').toLowerCase().replace(/\s+/g, '_');
    const subStatus = (project.sub_status || '').toLowerCase();

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-[#A1A1A1] mb-1">{project.project_code}</p>
                        <h2 className="text-xl font-bold text-[#1A1A1A]">{project.project_name}</h2>
                        <p className="text-sm text-[#6B6B6B] mt-1">{project.client_name}</p>
                    </div>
                    <StatusBadge status={project.status} subStatus={project.sub_status} />
                </div>

                {project.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-600">{project.rejection_reason}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-[#A1A1A1]">Address</span>
                        <p className="font-medium text-[#1A1A1A]">{project.address}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">Contract Price</span>
                        <p className="font-medium text-[#1A1A1A]">{formatCurrency(project.contract_price)}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">Unit Price</span>
                        <p className="font-medium text-[#1A1A1A]">{formatCurrency(project.contract_unit_price)}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">Budget for Materials</span>
                        <p className="font-medium text-[#1A1A1A]">{formatCurrency(project.budget_for_materials)}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">Start Date</span>
                        <p className="font-medium text-[#1A1A1A]">{project.start_date}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">End Date</span>
                        <p className="font-medium text-[#1A1A1A]">{project.end_date}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">Created By</span>
                        <p className="font-medium text-[#1A1A1A]">{project.created_by?.name || '—'}</p>
                    </div>
                    <div>
                        <span className="text-[#A1A1A1]">Project-in-Charge</span>
                        <p className="font-medium text-[#1A1A1A]">{project.project_in_charge?.name || '—'}</p>
                    </div>
                </div>

                {project.description && (
                    <div className="mt-4 text-sm pb-2">
                        <span className="text-[#A1A1A1]">Description</span>
                        <p className="font-medium text-[#1A1A1A] mt-1">{project.description}</p>
                    </div>
                )}

                {/* Integrated Action Buttons */}
                <div className="mt-6 pt-6 border-t border-[#F0F0F8] flex justify-center gap-4">
                    {userRole === 'project_engineer' && ['draft', 'for_revision', ''].includes(subStatus) && (
                        <button
                            onClick={() => navigate(`/projects/${project.id}/milestone-input`)}
                            className="px-6 py-2.5 bg-[#706BFF] text-white text-sm font-bold rounded-xl hover:bg-[#5B55E6] transition-all shadow-sm hover:shadow-md"
                        >
                            Manage Milestone Plan
                        </button>
                    )}
                    {userRole === 'accounting' && subStatus === 'pending_approval' && !project.accounting_approved_at && (
                        <button
                            onClick={() => navigate(`/projects/${project.id}/approval`)}
                            className="px-6 py-2.5 bg-[#706BFF] text-white text-sm font-bold rounded-xl hover:bg-[#5B55E6] transition-all shadow-sm hover:shadow-md"
                        >
                            Review & Approve
                        </button>
                    )}
                    {['ceo', 'coo'].includes(userRole) && subStatus === 'pending_approval' && !!project.accounting_approved_at && (
                        <button
                            onClick={() => navigate(`/projects/${project.id}/approval`)}
                            className="px-6 py-2.5 bg-[#706BFF] text-white text-sm font-bold rounded-xl hover:bg-[#5B55E6] transition-all shadow-sm hover:shadow-md"
                        >
                            Review & Approve
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
