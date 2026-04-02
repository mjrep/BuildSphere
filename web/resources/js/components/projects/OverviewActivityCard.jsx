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

// Formats action string nicely
const formatAction = (action, description) => {
    // Basic mapping, could be extended
    if (action.includes('UPLOAD')) return 'uploaded a file.';
    if (action.includes('COMPLETE')) return 'completed a task.';
    if (action.includes('REVIEW')) return 'needs a task reviewed.';
    if (description) return description.toLowerCase();
    return 'updated the project.';
};

export default function OverviewActivityCard({ project }) {
    const activities = project.recent_activities || [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 w-full flex flex-col mt-4">
            <h3 className="text-base font-bold text-[#1A1A1A] mb-6">Activity Feed</h3>
            
            <div className="flex flex-col relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#F0F0F8] before:to-transparent">
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No recent activity.</p>
                ) : (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="relative flex items-start justify-between mb-6 group">
                            {/* Icon */}
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-4 ring-white relative z-10 flex-shrink-0"
                                style={{ backgroundColor: getColorForString(activity.user_name) }}
                            >
                                {activity.user_name ? activity.user_name.substring(0, 2).toUpperCase() : 'SYS'}
                            </div>
                            
                            {/* Content */}
                            <div className="ml-4 flex-1 min-w-0 pr-2 pt-1">
                                <p className="text-sm text-[#6B6B6B] truncate">
                                    <span className="font-bold text-[#1A1A1A] mr-1">{activity.user_name}</span> 
                                    {formatAction(activity.action, activity.description)}
                                </p>
                                <p className="text-[10px] sm:text-xs text-[#A1A1A1] mt-0.5">
                                    {activity.created_at_date}
                                </p>
                            </div>

                            {/* Time badge */}
                            <div className="text-xs font-medium text-[#1A1A1A] flex-shrink-0 pt-1">
                                {activity.created_at_human}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
