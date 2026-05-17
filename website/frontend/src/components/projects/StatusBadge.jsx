import React from 'react';

const STATUS_MAP = {
    proposed: {
        draft:            { label: 'Draft',            bg: 'bg-text-muted/10',   text: 'text-text-muted' },
        for_revision:     { label: 'For Revision',     bg: 'bg-red-500/20',     text: 'text-red-400' },
        pending_approval: { label: 'Pending Approval', bg: 'bg-amber-500/20', text: 'text-amber-400' },
        approved:         { label: 'Approved',         bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    },
    ongoing:   { label: 'Ongoing',   bg: 'bg-accent shadow-[0_0_12px_rgba(124,116,255,0.4)]', text: 'text-white' },
    completed: { label: 'Completed', bg: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]', text: 'text-white' },
};

export default function StatusBadge({ status, subStatus }) {
    // Determine config based on nested structure
    let config;
    
    if (status === 'proposed') {
        config = STATUS_MAP.proposed[subStatus] || { label: 'Proposed', bg: 'bg-slate-100', text: 'text-slate-600' };
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
