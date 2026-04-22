import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ViewToggle from '../components/projects/ViewToggle';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectTable from '../components/projects/ProjectTable';
import useAuth from '../hooks/useAuth';
import { getProjects } from '../services/projectApi';

const STATUS_TABS = [
    { key: '',         label: 'All' },
    { key: 'proposed', label: 'Proposed' },
    { key: 'ongoing',  label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
];

const SUB_STATUS_TABS = [
    { key: '',                 label: 'All' },
    { key: 'draft',            label: 'Draft' },
    { key: 'for_revision',     label: 'For Revision' },
    { key: 'pending_approval', label: 'Pending Approval' },
    { key: 'approved',         label: 'Approved' },
];

export default function ProjectsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [view, setView] = useState('grid');
    const [activeTab, setActiveTab] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [meta, setMeta] = useState({});

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeTab) params.status = activeTab;
            if (activeTab === 'proposed' && activeSubTab) params.sub_status = activeSubTab;
            if (search) params.search = search;
            const res = await getProjects(params);
            setProjects(res.data.data || []);
            setMeta(res.data.meta || {});
        } catch (err) {
            console.error('Failed to load projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset sub-tab when main tab changes
        setActiveSubTab('');
        fetchProjects();
    }, [activeTab]);

    useEffect(() => {
        fetchProjects();
    }, [activeSubTab]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProjects();
    };

    const role = (user?.role || '').toLowerCase();
    const canCreateProject = role === 'sales' || role === 'ceo' || role === 'coo';

    return (
        <DashboardLayout pageTitle="Projects">
            {/* Top bar: View toggle + New Project button */}
            <div className="flex items-center justify-between mb-5">
                <ViewToggle view={view} onChange={setView} />
                {canCreateProject && (
                    <button
                        onClick={() => navigate('/projects/new')}
                        className="px-5 py-2.5 bg-[#706BFF] text-white text-sm font-bold rounded-xl
                                   hover:bg-[#5B55E6] transition-colors shadow-sm"
                    >
                        New Project
                    </button>
                )}
            </div>

            {/* Content card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6">
                {/* Status tabs */}
                <div className="flex items-center gap-6 border-b border-[#F0F0F8] mb-6">
                    {STATUS_TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const count = tab.key === ''
                            ? meta.total || projects.length
                            : projects.length;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`pb-3 text-sm font-semibold transition-colors relative ${
                                    isActive
                                        ? 'text-[#706BFF]'
                                        : 'text-[#A1A1A1] hover:text-[#6B6B6B]'
                                }`}
                            >
                                {tab.label}
                                {isActive && (
                                    <>
                                        <span className="ml-1.5 text-xs text-[#A1A1A1]">{count}</span>
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#706BFF] rounded-full" />
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-status filters for Proposed */}
                {activeTab === 'proposed' && (
                    <div className="flex items-center gap-2 mb-6 animate-in fade-in slide-in-from-top-1 duration-300">
                        {SUB_STATUS_TABS.map((tab) => {
                            const isActive = activeSubTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveSubTab(tab.key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-[#706BFF] text-white shadow-sm'
                                            : 'bg-[#F0F0F8] text-[#A1A1A1] hover:bg-[#E8E8FF] hover:text-[#706BFF]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Search bar */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative max-w-sm">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full rounded-xl border border-[#E8E8FF] px-4 py-2.5 text-sm
                                       placeholder:text-[#C1C1C1] focus:outline-none focus:ring-2
                                       focus:ring-[#706BFF]/20 focus:border-[#706BFF]"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-4 h-4 text-[#A1A1A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-16 text-[#A1A1A1] text-sm">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-[#A1A1A1] text-sm">No projects found.</p>
                        {canCreateProject && (
                            <button
                                onClick={() => navigate('/projects/new')}
                                className="mt-4 text-[#706BFF] text-sm font-semibold hover:underline"
                            >
                                Create your first project
                            </button>
                        )}
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <ProjectTable projects={projects} />
                )}
            </div>
        </DashboardLayout>
    );
}
