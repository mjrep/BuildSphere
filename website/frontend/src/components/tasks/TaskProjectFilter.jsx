import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

/**
 * TaskProjectFilter - A scalable, enterprise-grade project selector for task management.
 * Features a master "All Projects" toggle and a searchable combobox for specific projects.
 */
export default function TaskProjectFilter({ projects = [], selected = 'all', onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // Filter projects based on search query
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get the name of the currently selected project (if not 'all')
    const selectedProjectName = projects.find(p => String(p.id) === String(selected))?.name;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProjectSelect = (projectId) => {
        onSelect(projectId);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4">
            {/* Left Side: Master Toggle */}
            <button
                onClick={() => onSelect('all')}
                className={`flex-shrink-0 px-6 py-2.5 rounded-2xl text-[11px] uppercase tracking-widest font-black transition-all duration-200 border ${
                    selected === 'all'
                        ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                        : 'bg-bg-secondary border-border-primary/50 text-text-muted hover:border-accent hover:text-accent hover:bg-bg-hover'
                }`}
            >
                All Projects
            </button>

            {/* Divider (Desktop Only) */}
            <div className="hidden sm:block w-px h-8 bg-border-primary/50" />

            {/* Right Side: Specific Selector (Combobox) */}
            <div className="relative w-full sm:w-[350px]" ref={dropdownRef}>
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group flex items-center justify-between px-4 py-2.5 bg-bg-tertiary border rounded-2xl cursor-pointer transition-all duration-200 ${
                        isOpen 
                            ? 'border-accent ring-4 ring-accent/10' 
                            : selected !== 'all' 
                                ? 'border-accent bg-accent/5' 
                                : 'border-border-primary/50 hover:border-accent/50'
                    }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Search className={`w-4 h-4 shrink-0 ${selected !== 'all' || isOpen ? 'text-accent' : 'text-text-muted'}`} />
                        <span className={`text-sm font-medium truncate ${selected !== 'all' ? 'text-text-primary' : 'text-text-muted'}`}>
                            {selected !== 'all' ? selectedProjectName : 'Select a specific project...'}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : 'text-text-muted'}`} />
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border-primary rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Search Input inside dropdown */}
                        <div className="p-3 border-b border-border-primary sticky top-0 bg-card z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    className="w-full bg-bg-tertiary border border-border-primary rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#706BFF] transition-colors"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Project List */}
                        <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#E8E8FF] scrollbar-track-transparent">
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleProjectSelect(project.id)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                                            String(selected) === String(project.id)
                                                ? 'bg-accent/10 text-accent'
                                                : 'hover:bg-bg-tertiary text-text-secondary'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{project.name}</span>
                                            {project.project_code && (
                                                <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">{project.project_code}</span>
                                            )}
                                        </div>
                                        {String(selected) === String(project.id) && <Check className="w-4 h-4" />}
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-sm text-text-muted">
                                    No projects found for "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
