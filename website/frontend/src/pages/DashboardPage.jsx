import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import ProjectTeamCard from '../components/dashboard/ProjectTeamCard';
import OngoingProjectRow from '../components/dashboard/OngoingProjectRow';
import ProjectUpdateCard from '../components/dashboard/ProjectUpdateCard';
import { getDashboardStats } from '../services/dashboardApi';
import { useState, useEffect } from 'react';

const avatarColors = ['#706BFF', '#F59E0B', '#10B981', '#EF4444'];
// Mock fallback arrays have been removed in favor of dynamic API stats data.

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({
        ongoing_projects_count: 0,
        proposed_projects_count: 0,
        completed_projects_count: 0,
        project_teams: [],
        ongoing_projects: [],
        project_updates: [],
    });

    useEffect(() => {
        getDashboardStats()
            .then(setStatsData)
            .catch(err => console.error('Failed to fetch dashboard stats:', err));
    }, []);

    const stats = [
        { label: 'Ongoing Projects',   value: statsData.ongoing_projects_count,  color: 'text-orange-400' },
        { label: 'Proposed Projects',  value: statsData.proposed_projects_count, color: 'text-red-500' },
        { label: 'Completed Projects', value: statsData.completed_projects_count, color: 'text-green-500' },
    ];
    return (
        <DashboardLayout pageTitle="Dashboard">
            <div className="space-y-5">

                {/* Stat Cards Row */}
                <div className="flex gap-4">
                    {stats.map((s) => (
                        <StatCard key={s.label} {...s} />
                    ))}
                </div>

                {/* Project Teams */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F8]">
                    <h2 className="text-base font-bold text-[#706BFF] mb-4">Project Teams</h2>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {statsData.project_teams?.length > 0 ? (
                            statsData.project_teams.map((t, i) => (
                                <ProjectTeamCard key={i} {...t} />
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 col-span-full">No active project teams found.</p>
                        )}
                    </div>
                </div>

                {/* Bottom: Ongoing Projects + Project Updates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Ongoing Projects (left) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F8]">
                        <h2 className="text-base font-bold text-[#706BFF] mb-4">Ongoing Projects</h2>
                        {statsData.ongoing_projects?.length > 0 ? (
                            statsData.ongoing_projects.map((p, i) => (
                                <OngoingProjectRow key={i} {...p} />
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">No ongoing projects found.</p>
                        )}
                    </div>

                    {/* Project Updates (right) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F8]">
                        <h2 className="text-base font-bold text-[#706BFF] mb-4">Project Updates</h2>
                        {statsData.project_updates?.length > 0 ? (
                            statsData.project_updates.map((update, i) => (
                                <ProjectUpdateCard key={i} projectName={update.project_name} count={update.updates_today} index={i} />
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">No updates received today.</p>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}


