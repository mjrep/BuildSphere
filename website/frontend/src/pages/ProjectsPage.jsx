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
    { key: '',                        label: 'All Proposed' },
    { key: 'draft',                   label: 'Pending Engineering Milestones' },
    { key: 'for_revision',            label: 'For Revision' },
    { key: 'for_accounting_approval', label: 'For Accounting Approval' },
    { key: 'for_executives_approval', label: 'For Executives Approval' },
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
            const params = { per_page: 100 };
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
        fetchProjects();
    }, [activeTab, activeSubTab]);

    const handleTabChange = (tabKey) => {
        if (activeTab !== tabKey) {
            setActiveTab(tabKey);
            setActiveSubTab('');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProjects();
    };

    const role = (user?.role || '').toLowerCase();
    const canCreateProject = role === 'sales';

    return (
        <DashboardLayout pageTitle="Projects">

            {/* Content card */}
            <div className="bg-card rounded-[2rem] shadow-xl border border-border-primary/50 pt-4 pb-6 px-6 lg:pt-5 lg:pb-8 lg:px-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-border-primary/50 mb-6 gap-4">
                    <div className="flex flex-wrap items-center gap-4 lg:gap-8 pb-2 w-full lg:w-auto shrink-0">
                    {STATUS_TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const count = tab.key === ''
                            ? meta.total || projects.length
                            : projects.length;
                        return (
                            <div key={tab.key} className="relative group shrink-0">
                                <button
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`pb-4 text-sm font-black transition-all relative whitespace-nowrap ${
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
                                
                                {/* Dropdown for Proposed */}
                                {tab.key === 'proposed' && (
                                    <div className="absolute top-full left-0 mt-0 w-60 bg-card border border-border-primary/80 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden py-2">
                                        {SUB_STATUS_TABS.map(sub => {
                                            const isSubActive = activeTab === 'proposed' && activeSubTab === sub.key;
                                            return (
                                                <button
                                                    key={sub.key}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab('proposed');
                                                        setActiveSubTab(sub.key);
                                                    }}
                                                    className={`w-full text-left px-5 py-2.5 text-xs font-bold transition-colors whitespace-normal ${
                                                        isSubActive
                                                            ? 'bg-accent/10 text-accent border-l-4 border-accent'
                                                            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border-l-4 border-transparent'
                                                    }`}
                                                >
                                                    {sub.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    </div>
                    
                    <div className="flex items-center gap-4 pb-3 w-full lg:w-auto justify-end">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-[240px] group">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full rounded-2xl border border-border-primary/50 px-4 py-2.5 text-sm
                                           placeholder:text-text-muted focus:outline-none focus:ring-4
                                           focus:ring-accent/10 focus:border-accent bg-bg-tertiary text-text-primary
                                           transition-all duration-300 shadow-inner"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-bg-hover rounded-xl transition-colors">
                                <svg className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                        <div className="hidden sm:block shrink-0">
                            <ViewToggle view={view} onChange={setView} />
                        </div>
                        {canCreateProject && (
                            <button
                                onClick={() => navigate('/projects/new')}
                                className="shrink-0 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-colors shadow-sm"
                            >
                                New Project
                            </button>
                        )}
                    </div>
                </div>

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
