import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { updateProject } from '../../services/projectApi';
import useAuth from '../../hooks/useAuth';

const PRESET_COLORS = [
    { name: 'Indigo', hex: '#706BFF' },
    { name: 'Ocean Blue', hex: '#3B82F6' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Warm Amber', hex: '#F59E0B' },
    { name: 'Crimson', hex: '#EF4444' },
    { name: 'Soft Rose', hex: '#EC4899' },
    { name: 'Sleek Slate', hex: '#64748B' },
    { name: 'Charcoal', hex: '#3D3D3D' },
];

export default function ProjectCard({ project }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cardColor, setCardColor] = useState(project.color || '#706BFF');
    const [showColorMenu, setShowColorMenu] = useState(false);
    const menuRef = useRef(null);

    const progress = project.progress ?? 0;
    const isSales = (user?.role || '').toLowerCase() === 'sales';

    useEffect(() => {
        setCardColor(project.color || '#706BFF');
    }, [project.color]);

    useEffect(() => {
        if (!showColorMenu) return;
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowColorMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColorMenu]);

    const handleColorMenuToggle = (e) => {
        e.stopPropagation();
        setShowColorMenu(prev => !prev);
    };

    const handleColorSelect = async (e, colorHex) => {
        e.stopPropagation();
        setShowColorMenu(false);
        setCardColor(colorHex);
        project.color = colorHex; // Optimistic update of parent object property
        try {
            await updateProject(project.id, { color: colorHex });
        } catch (err) {
            console.error('Failed to persist project card color:', err);
        }
    };

    return (
        <div
            onClick={!isSales ? () => navigate(`/projects/${project.id}`) : undefined}
            className={`bg-card rounded-3xl border border-border-primary/50 shadow-lg overflow-hidden ${
                !isSales ? 'cursor-pointer hover:shadow-accent/5 hover:border-accent/30 transition-all group' : ''
            }`}
        >
            {/* Header banner area */}
            <div 
                className="h-44 relative"
                style={{ backgroundColor: cardColor }}
            >
                {/* 3-Dots Color Picker Button & Popover */}
                <div ref={menuRef} className="absolute top-3 left-3 z-30">
                    <button
                        onClick={handleColorMenuToggle}
                        className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                        title="Customize card color"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {showColorMenu && (
                        <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="absolute top-9 left-0 bg-bg-overlay border border-border-primary/80 rounded-2xl shadow-xl p-3 z-50 min-w-[170px] animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                            <p className="text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-widest">Card Color</p>
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_COLORS.map((c) => {
                                    const isSelected = cardColor === c.hex;
                                    return (
                                        <button
                                            key={c.hex}
                                            onClick={(e) => handleColorSelect(e, c.hex)}
                                            className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-all shadow-inner cursor-pointer relative flex items-center justify-center"
                                            style={{ backgroundColor: c.hex }}
                                            title={c.name}
                                        >
                                            {isSelected && (
                                                <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute top-3 right-3 z-20">
                    <StatusBadge status={project.status} subStatus={project.sub_status} project={project} />
                </div>
            </div>

            {/* Card footer */}
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                        <span className="text-accent text-xs font-bold">{project.project_name?.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-text-primary truncate">{project.project_name}</h3>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">{project.client_name}</p>
                    </div>
                </div>

                {/* Progress */}
                {(project.status === 'ongoing' || project.status === 'completed') && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-text-muted font-medium">Progress</span>
                            <span className="text-text-primary font-bold">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full shadow-[0_0_8px_rgba(124,116,255,0.4)] transition-all duration-700 ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#00C6FF] to-accent'}`} 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
