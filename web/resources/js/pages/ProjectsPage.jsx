import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function ProjectsPage() {
    return (
        <DashboardLayout pageTitle="Projects">
            <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-10 text-center">
                <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Projects</h2>
            </div>
        </DashboardLayout>
    );
}
