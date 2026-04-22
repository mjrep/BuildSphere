import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ProjectOverviewTab from '../components/projects/ProjectOverviewTab';
import ProjectInventoryTab from '../components/projects/ProjectInventoryTab';
import ProjectMilestonesTab from '../components/projects/ProjectMilestonesTab';
import ProposedProjectView from '../components/projects/ProposedProjectView';
import SiteUpdatesTab from '../components/projects/SiteUpdatesTab';
import AiAssessmentModal from '../components/projects/AiAssessmentModal';
import useAuth from '../hooks/useAuth';
import { getProject, getAiAssessment } from '../services/projectApi';

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [aiResult, setAiResult] = useState(null);

    const fetchProject = () => {
        setLoading(true);
        getProject(id)
            .then((res) => setProject(res.data.data || res.data))
            .catch((err) => {
                console.error('Failed to load project:', err);
                navigate('/projects');
            })
            .finally(() => setLoading(false));
    };

    const handleAnalyze = () => {
        if (analyzing) return;
        setAnalyzing(true);
        getAiAssessment(id)
            .then((res) => {
                setAiResult(res.data);
            })
            .catch((err) => {
                console.error('AI Assessment failed:', err);
                alert('AI Assessment failed: ' + (err.response?.data?.error_message || err.message));
            })
            .finally(() => {
                setAnalyzing(false);
            });
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout pageTitle="Project Details">
                <div className="text-center py-16 text-[#A1A1A1] text-sm">Loading project...</div>
            </DashboardLayout>
        );
    }

    if (!project) return null;

    if (project.status === 'proposed') {
        return (
            <DashboardLayout pageTitle={
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/projects')} className="text-[#1A1A1A] hover:text-[#706BFF] transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-bold text-xl text-[#1A1A1A] font-display">Project Details</span>
                </div>
            }>
                <ProposedProjectView project={project} />
            </DashboardLayout>
        );
    }

    const formatCurrency = (val) =>
        val != null ? `₱ ${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';

    const TABS = ['Overview', 'Milestones', 'Inventory', 'Site Updates'];

    return (
        <DashboardLayout pageTitle={
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/projects')} className="text-[#1A1A1A] hover:text-[#706BFF] transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-bold text-xl text-[#1A1A1A] font-display">{project.project_code} / {project.project_name}</span>
                </div>
            </div>
        }>
            <div className="max-w-7xl mx-auto w-full">
                
                {/* Tabs Row */}
                <div className="flex items-center justify-between border-b border-[#E8E8FF] mb-6 mt-2 relative">
                    <div className="flex items-center gap-8 px-2">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-bold relative transition-colors ${
                                    activeTab === tab
                                        ? 'text-[#706BFF]'
                                        : 'text-[#A1A1A1] hover:text-[#6B6B6B]'
                                }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#706BFF] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {/* Analyze button */}
                    <button 
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className={`mb-2 px-5 py-2 bg-[#706BFF]/10 text-[#706BFF] text-sm font-bold rounded-xl hover:bg-[#706BFF]/20 transition-colors flex items-center gap-2 ${analyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {analyzing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-[#706BFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Thinking...
                            </>
                        ) : (
                            <>
                                Analyze
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5 21L12.5 13.5L16.5 17.5L24 10V13.5H26V5H17.5V7H21L16.5 11.5L12.5 7.5L3 17L5 21Z" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>

                {/* Content Area - Using persistent mounting for instant switching */}
                <div className="w-full">
                    <div className={activeTab === 'Overview' ? 'block' : 'hidden'}>
                        <ProjectOverviewTab project={project} fetchProject={fetchProject} />
                    </div>

                    <div className={activeTab === 'Milestones' ? 'block' : 'hidden'}>
                        <ProjectMilestonesTab project={project} />
                    </div>

                    <div className={activeTab === 'Inventory' ? 'block' : 'hidden'}>
                        <ProjectInventoryTab project={project} />
                    </div>

                    <div className={activeTab === 'Site Updates' ? 'block' : 'hidden'}>
                        <SiteUpdatesTab project={project} />
                    </div>
                </div>

                {/* AI Assessment Modal */}
                {aiResult && (
                    <AiAssessmentModal 
                        assessment={aiResult} 
                        onClose={() => setAiResult(null)} 
                    />
                )}

            </div>
        </DashboardLayout>
    );
}
