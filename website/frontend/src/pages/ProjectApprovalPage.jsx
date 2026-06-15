import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatusBadge from '../components/projects/StatusBadge';
import useAuth from '../hooks/useAuth';
import { getProject, getMilestoneChart, submitAccountingApproval, submitExecutiveApproval } from '../services/projectApi';
import MilestoneReviewChart from '../components/projects/MilestoneReviewChart';
import { X, FileText, Download } from 'lucide-react';

export default function ProjectApprovalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [projectFiles, setProjectFiles] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        import('../services/api').then(({ default: api }) => {
            Promise.all([
                getProject(id), 
                getMilestoneChart(id),
                api.get(`/projects/${id}/files`).catch(() => ({ data: { data: [] } }))
            ])
            .then(([projRes, chartRes, filesRes]) => {
                setProject(projRes.data.data || projRes.data);
                setChartData(chartRes.data);
                setProjectFiles(filesRes.data?.data || []);
            })
            .catch(() => navigate('/projects'))
            .finally(() => setLoading(false));
        });
    }, [id]);

    const userRole = (user?.role || '').toLowerCase();

    const isAccounting = userRole === 'accounting' && 
                         project?.status === 'proposed' && 
                         ['pending_approval', 'for_accounting_approval'].includes(project?.sub_status) && 
                         !project?.accounting_approved_at;

    const isExecutive = ['ceo', 'coo'].includes(userRole) && 
                        (project?.status === 'proposed' && ['pending_approval', 'for_executives_approval'].includes(project?.sub_status) && !!project?.accounting_approved_at);

    const handleApprove = async () => {
        setSubmitting(true);
        setError('');
        try {
            const fn = isAccounting ? submitAccountingApproval : submitExecutiveApproval;
            await fn(id, { decision: 'APPROVED', comments: '' });
            navigate(`/projects/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!comments.trim()) {
            setError('Please provide a reason for rejection.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const fn = isAccounting ? submitAccountingApproval : submitExecutiveApproval;
            await fn(id, { decision: 'REJECTED', comments });
            navigate(`/projects/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout pageTitle="Review Project">
                <div className="text-center py-16 text-text-muted text-sm">Loading...</div>
            </DashboardLayout>
        );
    }

    const formatCurrency = (val) =>
        val != null ? `₱ ${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';

    return (
        <DashboardLayout pageTitle={
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/projects/${id}`)} className="text-text-primary hover:text-accent transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span>Review Project</span>
            </div>
        }>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Project summary */}
                <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs text-text-muted mb-1">{project.project_code}</p>
                            <h2 className="text-xl font-bold text-text-primary">{project.project_name}</h2>
                            <p className="text-sm text-[#6B6B6B] mt-1">{project.client_name}</p>
                        </div>
                        <StatusBadge status={project.status} subStatus={project.sub_status} project={project} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-text-muted">Address</span>
                            <p className="font-medium text-text-primary">{project.address}</p>
                        </div>
                        <div>
                            <span className="text-text-muted">Contract Price</span>
                            <p className="font-medium text-text-primary">{formatCurrency(project.contract_price)}</p>
                        </div>
                        {project.contract_unit_price != null && (
                            <div>
                                <span className="text-text-muted">Unit Price</span>
                                <p className="font-medium text-text-primary">{formatCurrency(project.contract_unit_price)}</p>
                            </div>
                        )}
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
                </div>

                {/* Uploaded Files Section */}
                {projectFiles && projectFiles.length > 0 && (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-border-primary mb-4">
                            <FileText className="w-4 h-4 text-accent" />
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Required Documents</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            {projectFiles.map(file => (
                                <a 
                                    key={file.id} 
                                    href={file.download_url || '#'} 
                                    download={file.file_name}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 border border-border-primary rounded-xl bg-bg-secondary/30 hover:bg-bg-secondary hover:border-accent/30 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                            <FileText className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className="text-sm font-bold text-text-primary truncate group-hover:text-accent transition-colors">{file.file_name}</span>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-full text-text-muted group-hover:bg-white group-hover:text-accent shadow-sm border border-transparent group-hover:border-border-primary transition-all flex-shrink-0">
                                        <Download className="w-4 h-4" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Milestone Chart */}
                {chartData && (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-6 overflow-hidden">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-sm font-bold text-accent">Milestone Plan & Schedule</h3>
                            <div className="text-xs text-[#6B6B6B] text-right">
                                Submitted By: <span className="font-semibold text-text-primary">{chartData.submitted_by || '—'}</span><br/>
                                {chartData.submitted_at ? new Date(chartData.submitted_at).toLocaleString('en-US') : '—'}
                            </div>
                        </div>
                        <MilestoneReviewChart data={chartData} />
                    </div>
                )}

                {/* Approval History */}
                {chartData?.approval_history?.length > 0 && (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-6">
                        <h3 className="text-sm font-bold text-accent mb-4">Approval History</h3>
                        <div className="space-y-4">
                            {chartData.approval_history.map((hist, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border ${hist.decision === 'APPROVED' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-text-primary text-sm">
                                            {hist.stage} Review
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${hist.decision === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {hist.decision}
                                            </span>
                                        </div>
                                        <div className="text-xs text-[#6B6B6B]">
                                            {hist.decided_at ? new Date(hist.decided_at).toLocaleString('en-US') : '—'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-[#5A5A5A]">
                                        <span className="font-medium">Approver:</span> {hist.approver_name || 'System / Unknown'}
                                    </div>
                                    {hist.comments && (
                                        <div className="text-sm mt-2 text-[#5A5A5A] italic w-full">
                                            &ldquo;{hist.comments}&rdquo;
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Approval actions */}
                {(isAccounting || isExecutive) && (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-6">
                        <h3 className="text-sm font-bold text-accent mb-4">Approval Decision</h3>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setShowApproveModal(true)} disabled={submitting}
                                    className="px-8 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60">
                                Approve
                            </button>
                            <button onClick={() => setShowRejectModal(true)} disabled={submitting}
                                    className="px-8 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60">
                                Reject
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showApproveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl shadow-lg border border-border-primary overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-border-primary">
                            <h3 className="text-base font-bold text-text-primary">Confirm Approval</h3>
                            <button onClick={() => setShowApproveModal(false)} className="text-text-muted hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center">
                            <p className="text-sm text-text-secondary mb-6">Are you sure you want to approve this project?</p>
                            <div className="flex w-full gap-3">
                                <button onClick={() => setShowApproveModal(false)}
                                        className="flex-1 py-3 border border-border-primary text-text-muted text-sm font-bold rounded-xl hover:bg-bg-secondary transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleApprove} disabled={submitting}
                                        className="flex-1 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {submitting ? 'Approving...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl shadow-lg border border-border-primary overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-border-primary">
                            <h3 className="text-base font-bold text-text-primary">Confirm Rejection</h3>
                            <button onClick={() => { setShowRejectModal(false); setComments(''); }} className="text-text-muted hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center">
                            <p className="text-sm text-text-secondary mb-4">Please provide a reason for rejecting this project.</p>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows="3"
                                className="w-full text-left rounded-xl border border-border-primary bg-bg-secondary/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 focus:bg-card transition-all mb-6"
                            />
                            <div className="flex w-full gap-3">
                                <button onClick={() => { setShowRejectModal(false); setComments(''); }}
                                        className="flex-1 py-3 border border-border-primary text-text-muted text-sm font-bold rounded-xl hover:bg-bg-secondary transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleReject} disabled={submitting}
                                        className="flex-1 py-3 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {submitting ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
