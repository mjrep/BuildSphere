import React from 'react';

const STATUS_MAP = {
    proposed: {
        draft:                     { label: 'Pending Engineering Milestones',  bg: 'bg-white/90 shadow-sm',     text: 'text-slate-700' },
        for_revision:              { label: 'For Revision',            bg: 'bg-red-500 shadow-sm',      text: 'text-white' },
        pending_approval:          { label: 'For Accounting Approval', bg: 'bg-amber-500 shadow-sm',    text: 'text-white' }, // Alias for old data
        for_accounting_approval:   { label: 'For Accounting Approval', bg: 'bg-amber-500 shadow-sm',    text: 'text-white' },
        for_executives_approval:   { label: 'For Executives Approval', bg: 'bg-purple-500 shadow-sm',   text: 'text-white' },
        approved:                  { label: 'Approved',                bg: 'bg-emerald-500 shadow-sm',  text: 'text-white' },
    },
    ongoing:   { label: 'Ongoing',   bg: 'bg-accent shadow-[0_0_12px_rgba(124,116,255,0.4)]', text: 'text-white' },
    completed: { label: 'Completed', bg: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]', text: 'text-white' },
};

export default function StatusBadge({ status, subStatus, project }) {
    // Determine config based on nested structure
    let config;
    
    if (status === 'proposed') {
        let normalizedSub = subStatus?.toLowerCase() || 'draft';
        
        // Handle legacy pending_approval alias
        if (normalizedSub === 'pending_approval') {
            if (project && project.accounting_approved_at) {
                normalizedSub = 'for_executives_approval';
            } else {
                normalizedSub = 'for_accounting_approval';
            }
        }
        
        config = STATUS_MAP.proposed[normalizedSub] || { label: 'Draft', bg: 'bg-white/90 shadow-sm', text: 'text-slate-700' };
    } else if (status === 'ongoing') {
        config = STATUS_MAP.ongoing;
    } else {
        config = STATUS_MAP[status] || { label: status, bg: 'bg-slate-50', text: 'text-slate-500' };
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
