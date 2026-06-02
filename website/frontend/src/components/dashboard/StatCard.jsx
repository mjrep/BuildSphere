import React from 'react';

export default function StatCard({ label, value, color }) {
    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border-primary flex items-center justify-between flex-1 transition-all duration-300 group">
            <p className="text-sm font-semibold text-text-muted group-hover:text-text-primary transition-colors">{label}</p>
            <p className={`text-4xl font-black leading-none ${color}`}>{value}</p>
        </div>
    );
}
