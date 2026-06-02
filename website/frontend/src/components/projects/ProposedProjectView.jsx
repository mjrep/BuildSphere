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
            <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-text-muted mb-1">{project.project_code}</p>
                        <h2 className="text-xl font-bold text-text-primary">{project.project_name}</h2>
                        <p className="text-sm text-[#6B6B6B] mt-1">{project.client_name}</p>
                    </div>
                    <StatusBadge status={project.status} subStatus={project.sub_status} project={project} />
                </div>

                {project.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-600">{project.rejection_reason}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-text-muted">Address</span>
                        <p className="font-medium text-text-primary">{project.address}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Contract Price</span>
                        <p className="font-medium text-text-primary">{formatCurrency(project.contract_price)}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Unit Price</span>
                        <p className="font-medium text-text-primary">{formatCurrency(project.contract_unit_price)}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Budget for Materials</span>
                        <p className="font-medium text-text-primary">{formatCurrency(project.budget_for_materials)}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Start Date</span>
                        <p className="font-medium text-text-primary">{project.start_date}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">End Date</span>
                        <p className="font-medium text-text-primary">{project.end_date}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Created By</span>
                        <p className="font-medium text-text-primary">{project.created_by?.name || '—'}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Project-in-Charge</span>
                        <p className="font-medium text-text-primary">{project.project_in_charge?.name || '—'}</p>
                    </div>
                </div>

                {project.description && (
                    <div className="mt-4 text-sm pb-2">
                        <span className="text-text-muted">Description</span>
                        <p className="font-medium text-text-primary mt-1">{project.description}</p>
                    </div>
                )}

                {/* Integrated Action Buttons */}
                <div className="mt-6 pt-6 border-t border-border-primary flex justify-center gap-4">
                    {userRole === 'project_engineer' && ['draft', 'for_revision', ''].includes(subStatus) && (
                        <button
                            onClick={() => navigate(`/projects/${project.id}/milestone-input`)}
                            className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm hover:shadow-md"
                        >
                            Manage Milestone Plan
                        </button>
                    )}
                    {userRole === 'accounting' && ['pending_approval', 'for_accounting_approval'].includes(subStatus) && !project.accounting_approved_at && (
                        <button
                            onClick={() => navigate(`/projects/${project.id}/approval`)}
                            className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm hover:shadow-md"
                        >
                            Review & Approve
                        </button>
                    )}
                    {['ceo', 'coo'].includes(userRole) && ['pending_approval', 'for_executives_approval'].includes(subStatus) && !!project.accounting_approved_at && (
                        <button
                            onClick={() => navigate(`/projects/${project.id}/approval`)}
                            className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm hover:shadow-md"
                        >
                            Review & Approve
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
