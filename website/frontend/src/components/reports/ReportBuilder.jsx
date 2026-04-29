import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Calendar, CheckCircle, Loader2, ListChecks, Package, TrendingUp } from 'lucide-react';
import { getProjects } from '../../services/projectApi';

/**
 * ReportBuilder - Matches Mockup 1 UI with a centered, clean layout.
 */
export default function ReportBuilder({ onGenerate, isGenerating }) {
    const [projects, setProjects] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        projectIds: [],
        startDate: '',
        endDate: '',
        includeProgress: true,
        includeInventory: true,
        includeAccomplishments: true
    });

    // Handle outside clicks to close the custom dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch projects from API
    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await getProjects({ status: 'ongoing' });
                const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                setProjects(data);
            } catch (err) {
                console.error("Failed to fetch projects for report builder", err);
            } finally {
                setIsLoadingProjects(false);
            }
        }
        fetchProjects();
    }, []);

    const toggleProject = (id) => {
        const current = [...formData.projectIds];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setFormData({ ...formData, projectIds: current });
    };

    const toggleAllProjects = () => {
        if (formData.projectIds.length === projects.length) {
            setFormData({ ...formData, projectIds: [] });
        } else {
            setFormData({ ...formData, projectIds: projects.map(p => p.id) });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.projectIds.length === 0) {
            alert("Please select at least one project.");
            return;
        }
        onGenerate(formData);
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 px-6">
            
            {/* Title Section from Mockup */}
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">Generate project report</h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium leading-relaxed">
                    Select the project/s you want to generate the report and from what period until end of period.
                </p>
            </div>

            {/* Main Form Box */}
            <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-12">
                
                {/* Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Project Name Field */}
                    <div className="space-y-3 relative" ref={dropdownRef}>
                        <label className="text-sm font-black text-slate-900 ml-1">Project Name</label>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full bg-white border ${isDropdownOpen ? 'border-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-200'} rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm transition-all group`}
                        >
                            <span className={`text-sm font-bold ${formData.projectIds.length > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                {formData.projectIds.length === 0 ? 'Select' : 
                                 formData.projectIds.length === projects.length ? 'All Selected' :
                                 `${formData.projectIds.length} Selected`}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="max-h-60 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                                    <label className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors group">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            checked={formData.projectIds.length === projects.length && projects.length > 0}
                                            onChange={toggleAllProjects}
                                        />
                                        <span className="text-sm font-black text-indigo-600">Select All Projects</span>
                                    </label>
                                    <div className="h-px bg-slate-100 mx-2 my-1" />
                                    {isLoadingProjects ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-slate-400 text-sm italic">
                                            <Loader2 className="animate-spin w-4 h-4" />
                                            Loading active projects...
                                        </div>
                                    ) : projects.map(p => (
                                        <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                checked={formData.projectIds.includes(p.id)}
                                                onChange={() => toggleProject(p.id)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{p.project_name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{p.project_code}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* From Date */}
                    <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 ml-1">From</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all shadow-sm appearance-none"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                required
                            />
                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 ml-1">End</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all shadow-sm appearance-none"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                required
                            />
                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Section Toggles - Clean Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'includeProgress', label: 'Progress Analysis', icon: TrendingUp },
                        { id: 'includeInventory', label: 'Inventory Summary', icon: Package },
                        { id: 'includeAccomplishments', label: 'Accomplishments', icon: ListChecks },
                    ].map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => setFormData({...formData, [section.id]: !formData[section.id]})}
                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                                formData[section.id] 
                                    ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600' 
                                    : 'border-slate-100 bg-white text-slate-400'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <section.icon size={20} />
                                <span className="text-sm font-bold">{section.label}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData[section.id] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'
                            }`}>
                                {formData[section.id] && <CheckCircle size={12} className="text-white" />}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Generate Button from Mockup */}
                <div className="pt-8 flex justify-center">
                    <button 
                        type="submit"
                        disabled={isGenerating || formData.projectIds.length === 0}
                        className={`w-full max-w-sm py-5 text-lg text-white rounded-2xl font-black shadow-2xl transition-all flex items-center justify-center gap-4 ${
                            isGenerating || formData.projectIds.length === 0
                                ? 'bg-slate-300 cursor-not-allowed' 
                                : 'bg-indigo-500 shadow-indigo-500/30 hover:bg-indigo-600 hover:-translate-y-1 active:scale-[0.98]'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Compiling...
                            </>
                        ) : (
                            'Preview Report'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
