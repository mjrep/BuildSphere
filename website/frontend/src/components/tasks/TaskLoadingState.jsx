import React from 'react';

function SkeletonCard() {
    return (
        <div className="bg-bg-secondary rounded-xl border border-border-primary/50 p-4 animate-pulse space-y-3">
            <div className="h-4 bg-bg-hover rounded w-3/4" />
            <div className="h-3 bg-bg-hover rounded w-1/2" />
            <div className="flex gap-2">
                <div className="h-5 w-14 bg-bg-hover rounded-full" />
                <div className="h-5 w-20 bg-bg-hover rounded-full" />
            </div>
        </div>
    );
}

export default function TaskLoadingState({ view = 'list' }) {
    if (view === 'kanban') {
        return (
            <div className="grid grid-cols-4 gap-4">
                {[0,1,2,3].map(i => (
                    <div key={i} className="bg-bg-secondary/50 rounded-xl p-3 space-y-3">
                        <div className="h-5 bg-bg-secondary rounded w-24 animate-pulse" />
                        {[0,1,2].map(j => <SkeletonCard key={j} />)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {[0,1,2,3,4].map(i => (
                <div key={i} className="h-14 bg-bg-secondary rounded-xl animate-pulse" />
            ))}
        </div>
    );
}
