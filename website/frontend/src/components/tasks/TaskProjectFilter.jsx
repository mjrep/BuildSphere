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
    const selectedProjectName = projects.find(p => p.id === selected)?.name;

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 mb-2">
            {/* Left Side: Master Toggle */}
            <button
                onClick={() => onSelect('all')}
                className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                    selected === 'all'
                        ? 'bg-[#706BFF] border-[#706BFF] text-white shadow-lg shadow-[#706BFF]/20'
                        : 'bg-white border-[#E8E8FF] text-[#6B6B8D] hover:border-[#706BFF]/30 hover:bg-[#F8F8FC]'
                }`}
            >
                All Projects
            </button>

            {/* Divider (Desktop Only) */}
            <div className="hidden sm:block w-px h-8 bg-[#E8E8FF] mx-1" />

            {/* Right Side: Specific Selector (Combobox) */}
            <div className="relative flex-1 max-w-md" ref={dropdownRef}>
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group flex items-center justify-between px-4 py-2.5 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isOpen 
                            ? 'border-[#706BFF] ring-4 ring-[#706BFF]/5' 
                            : selected !== 'all' 
                                ? 'border-[#706BFF]/50 bg-[#706BFF]/5' 
                                : 'border-[#E8E8FF] hover:border-[#706BFF]/30'
                    }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Search className={`w-4 h-4 shrink-0 ${selected !== 'all' || isOpen ? 'text-[#706BFF]' : 'text-[#A1A1A1]'}`} />
                        <span className={`text-sm font-medium truncate ${selected !== 'all' ? 'text-[#1A1A1A]' : 'text-[#6B6B8D]'}`}>
                            {selected !== 'all' ? selectedProjectName : 'Select a specific project...'}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#706BFF]' : 'text-[#A1A1A1]'}`} />
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8E8FF] rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Search Input inside dropdown */}
                        <div className="p-3 border-b border-[#F0F0F8] sticky top-0 bg-white z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
                                <input
                                    type="text"
                                    className="w-full bg-[#F8F8FC] border border-[#E8E8FF] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#706BFF] transition-colors"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1A1] hover:text-[#706BFF]"
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
                                            selected === project.id
                                                ? 'bg-[#706BFF]/10 text-[#706BFF]'
                                                : 'hover:bg-[#F8F8FC] text-[#4A4A4A]'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{project.name}</span>
                                            {project.project_code && (
                                                <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">{project.project_code}</span>
                                            )}
                                        </div>
                                        {selected === project.id && <Check className="w-4 h-4" />}
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-sm text-[#A1A1A1]">
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
