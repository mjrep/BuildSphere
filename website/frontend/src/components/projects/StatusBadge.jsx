import React from 'react';

const STATUS_MAP = {
    proposed: {
        draft:            { label: 'Draft',            bg: 'bg-gray-100',   text: 'text-gray-700' },
        for_revision:     { label: 'For Revision',     bg: 'bg-red-50',     text: 'text-red-500' },
        pending_approval: { label: 'Pending Approval', bg: 'bg-orange-50',  text: 'text-orange-500' },
        approved:         { label: 'Approved',         bg: 'bg-green-50',   text: 'text-green-500' },
    },
    ongoing:   { label: 'Ongoing',   bg: 'bg-blue-100',  text: 'text-blue-700' },
    completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

export default function StatusBadge({ status, subStatus }) {
    // Determine config based on nested structure
    let config;
    
    if (status === 'proposed') {
        config = STATUS_MAP.proposed[subStatus] || { label: 'Proposed', bg: 'bg-blue-50', text: 'text-blue-500' };
    } else {
        config = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
