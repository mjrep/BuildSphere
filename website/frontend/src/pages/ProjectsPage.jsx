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
    const canCreateProject = role === 'sales';

    return (
        <DashboardLayout pageTitle="Projects">
            {/* Top bar: View toggle + New Project button */}
            <div className="flex items-center justify-between mb-5">
                <ViewToggle view={view} onChange={setView} />
                {canCreateProject && (
                    <button
                        onClick={() => navigate('/projects/new')}
                        className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl
                                   hover:opacity-90 transition-colors shadow-sm"
                    >
                        New Project
                    </button>
                )}
            </div>

            {/* Content card */}
            <div className="bg-card rounded-[2rem] shadow-xl border border-border-primary/50 p-8">
                {/* Status tabs */}
                <div className="flex items-center gap-8 border-b border-border-primary/50 mb-8">
                    {STATUS_TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const count = tab.key === ''
                            ? meta.total || projects.length
                            : projects.length;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`pb-4 text-sm font-black transition-all relative ${
                                    isActive
                                        ? 'text-accent'
                                        : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                <span className="uppercase tracking-wider">{tab.label}</span>
                                {isActive && (
                                    <>
                                        <span className="ml-2 text-[10px] bg-accent/10 px-2 py-0.5 rounded-full">{count}</span>
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full shadow-[0_-2px_10px_rgba(124,116,255,0.4)]" />
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-status filters for Proposed */}
                {activeTab === 'proposed' && (
                    <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                        {SUB_STATUS_TABS.map((tab) => {
                            const isActive = activeSubTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveSubTab(tab.key)}
                                    className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                        isActive
                                            ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-105'
                                            : 'bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Search bar */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative max-w-md group">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full rounded-2xl border border-border-primary/50 px-6 py-4 text-sm
                                       placeholder:text-text-muted focus:outline-none focus:ring-4
                                       focus:ring-accent/10 focus:border-accent bg-bg-tertiary text-text-primary
                                       transition-all duration-300 shadow-inner"
                        />
                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-bg-hover rounded-xl transition-colors">
                            <svg className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Loading Skeletons */}
                {loading ? (
                    view === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="h-44 bg-bg-secondary rounded-2xl border border-border-primary/50" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-bg-secondary rounded-xl" />
                            ))}
                        </div>
                    )
                ) : projects.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-text-muted text-sm">No projects found.</p>
                        {canCreateProject && (
                            <button
                                onClick={() => navigate('/projects/new')}
                                className="mt-4 text-accent text-sm font-semibold hover:underline"
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
