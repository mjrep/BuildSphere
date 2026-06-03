import React from 'react';

const getColorForString = (str) => {
    let hash = 0;
    str = str || 'System';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + ('00000'.substring(0, 6 - c.length) + c);
};

// Activity Feed Card with modern timeline UI
export default function OverviewActivityCard({ project }) {
    const activities = project.recent_activities || [];

    const getMarkerColor = (type) => {
        if (type === 'approval') return 'bg-emerald-500';
        if (type === 'update') return 'bg-amber-500';
        return 'bg-blue-500';
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-6 w-full flex flex-col mt-4 flex-1 min-h-0 max-h-[500px]">
            <h3 className="text-base font-bold text-text-primary mb-6 flex-shrink-0">Activity Feed</h3>
            
            <div className="flex flex-col gap-6 relative overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border-primary scrollbar-track-transparent flex-1 min-h-0">
                {/* Vertical Line */}
                {activities.length > 1 && (
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100 -translate-x-1/2"></div>
                )}

                {activities.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No recent activity.</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="relative flex gap-4 items-start group">
                            {/* Marker Dot */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black z-10 flex-shrink-0 shadow-sm ${getMarkerColor(activity.type)}`}>
                                {activity.user_name ? activity.user_name.substring(0, 2).toUpperCase() : 'SYS'}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <p className="text-sm text-slate-600 leading-tight">
                                        <span className="font-bold text-slate-900">{activity.user_name}</span>
                                        {" "}{activity.action}
                                    </p>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap pt-0.5">
                                        {activity.created_at_human}
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                                    {activity.created_at_date}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
