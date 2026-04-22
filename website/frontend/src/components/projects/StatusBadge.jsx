import React from 'react';

const STATUS_MAP = {
    proposed: {
        draft:            { label: 'Draft',            bg: 'bg-gray-100',   text: 'text-gray-700' },
        for_revision:     { label: 'For Revision',     bg: 'bg-red-50',     text: 'text-red-500' },
        pending_approval: { label: 'Pending Approval', bg: 'bg-orange-100', text: 'text-orange-700' },
        approved:         { label: 'Approved',         bg: 'bg-emerald-100', text: 'text-emerald-700' },
    },
    ongoing:   { label: 'Ongoing',   bg: 'bg-indigo-600', text: 'text-white' },
    completed: { label: 'Completed', bg: 'bg-emerald-600', text: 'text-white' },
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
