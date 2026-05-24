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
        
        let newStartDate = formData.startDate;
        let newEndDate = formData.endDate;

        if (current.length === 1) {
            const selectedProj = projects.find(p => p.id === current[0]);
            if (selectedProj) {
                newStartDate = selectedProj.start_date || '';
                newEndDate = selectedProj.end_date || '';
            }
        } else {
            newStartDate = '';
            newEndDate = '';
        }

        setFormData({ ...formData, projectIds: current, startDate: newStartDate, endDate: newEndDate });
    };

    const toggleAllProjects = () => {
        if (formData.projectIds.length === projects.length) {
            setFormData({ ...formData, projectIds: [], startDate: '', endDate: '' });
        } else {
            setFormData({ ...formData, projectIds: projects.map(p => p.id), startDate: '', endDate: '' });
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
            
            {/* Title Section */}
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">Generate project report</h1>
                <p className="text-text-muted text-lg max-w-xl mx-auto font-bold leading-relaxed">
                    Select the project/s you want to generate the report and from what period until end of period.
                </p>
            </div>

            {/* Main Form Box */}
            <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-12">
                
                {/* Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Project Name Field */}
                    <div className="space-y-3 relative" ref={dropdownRef}>
                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Project Name</label>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full bg-card border ${isDropdownOpen ? 'border-accent ring-4 ring-accent/5' : 'border-border-primary'} rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm transition-all group`}
                        >
                            <span className={`text-sm font-bold ${formData.projectIds.length > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                                {formData.projectIds.length === 0 ? 'Select Project' : 
                                 formData.projectIds.length === projects.length ? 'All Projects Selected' :
                                 `${formData.projectIds.length} Selected`}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-card border border-border-primary rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="max-h-60 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                                    <label className="flex items-center gap-3 p-3 hover:bg-accent/10 rounded-xl cursor-pointer transition-colors group">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded-lg border-border-primary bg-bg-tertiary text-accent focus:ring-accent/20 transition-all cursor-pointer"
                                            checked={formData.projectIds.length === projects.length && projects.length > 0}
                                            onChange={toggleAllProjects}
                                        />
                                        <span className="text-sm font-black text-accent uppercase tracking-widest">Select All Projects</span>
                                    </label>
                                    <div className="h-px bg-border-primary mx-2 my-1" />
                                    {isLoadingProjects ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-widest italic">
                                            <Loader2 className="animate-spin w-4 h-4" />
                                            Synchronizing Directory...
                                        </div>
                                    ) : projects.map(p => (
                                        <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-bg-hover rounded-xl cursor-pointer transition-colors group">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded-lg border-border-primary bg-bg-tertiary text-accent focus:ring-accent/20 transition-all cursor-pointer"
                                                checked={formData.projectIds.includes(p.id)}
                                                onChange={() => toggleProject(p.id)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{p.project_name}</span>
                                                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">{p.project_code}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* From Date */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">From Period</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full bg-card border border-border-primary rounded-2xl px-6 py-4 text-sm font-bold text-text-primary focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-sm appearance-none"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                required
                            />
                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 pointer-events-none" />
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Until End</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full bg-card border border-border-primary rounded-2xl px-6 py-4 text-sm font-bold text-text-primary focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-sm appearance-none"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                required
                            />
                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Section Toggles */}
                <div className="space-y-8">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-black text-text-primary tracking-tight">Report Content</h2>
                        <p className="text-text-muted text-[11px] font-black uppercase tracking-widest">Choose the modules you want to include in this report.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { 
                                id: 'includeProgress', 
                                label: 'Progress Analysis', 
                                icon: TrendingUp,
                                desc: 'Project status summary, completed tasks, and milestone tracking.'
                            },
                            { 
                                id: 'includeInventory', 
                                label: 'Inventory Summary', 
                                icon: Package,
                                desc: 'Stock levels, item categories, and total inventory valuation.'
                            },
                            { 
                                id: 'includeAccomplishments', 
                                label: 'Accomplishments', 
                                icon: ListChecks,
                                desc: 'Side-by-side site updates with before/after progress photos.'
                            },
                        ].map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => setFormData({...formData, [section.id]: !formData[section.id]})}
                                className={`flex flex-col text-left p-7 rounded-3xl border transition-all relative group active:scale-95 ${
                                    formData[section.id] 
                                        ? 'border-accent bg-accent/5 ring-4 ring-accent/5' 
                                        : 'border-border-primary bg-bg-secondary/30 hover:bg-bg-secondary hover:border-border-primary/80'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div className={`p-3 rounded-2xl transition-all ${formData[section.id] ? 'bg-accent text-white shadow-[0_4px_12px_rgba(124,116,255,0.3)]' : 'bg-bg-tertiary text-text-muted group-hover:text-text-primary'}`}>
                                        <section.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                        formData[section.id] ? 'bg-accent border-accent scale-110 shadow-sm' : 'border-border-primary bg-bg-tertiary'
                                    }`}>
                                        {formData[section.id] && <CheckCircle size={16} className="text-white" strokeWidth={3} />}
                                    </div>
                                </div>
                                <span className={`text-base font-black mb-2 tracking-tight ${formData[section.id] ? 'text-accent' : 'text-text-primary'}`}>
                                    {section.label}
                                </span>
                                <p className={`text-[10px] leading-relaxed font-bold uppercase tracking-wide ${formData[section.id] ? 'text-accent/70' : 'text-text-muted'}`}>
                                    {section.desc}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="pt-8 flex justify-center">
                    <button 
                        type="submit"
                        disabled={isGenerating || formData.projectIds.length === 0}
                        className={`w-full max-w-sm py-5 text-[11px] rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 ${
                            isGenerating || formData.projectIds.length === 0
                                ? 'bg-bg-tertiary text-text-secondary opacity-80 cursor-not-allowed border border-border-primary' 
                                : 'bg-accent text-white shadow-[0_8px_25px_rgba(124,116,255,0.3)] hover:bg-accent hover:-translate-y-1 active:scale-[0.98]'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Synchronizing Data...
                            </>
                        ) : (
                            'Preview Compiled Report'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
