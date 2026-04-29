import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import ReportBuilder from '../components/reports/ReportBuilder';
import ReportPreview from '../components/reports/ReportPreview';
import { generateReport } from '../services/reportApi';

/**
 * ReportsPage - The Orchestrator for Multi-Project Reporting.
 * Manages the view state and fetches live data from the database.
 */
export default function ReportsPage() {
    const [view, setView] = useState('builder'); // 'builder' | 'preview'
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportConfig, setReportConfig] = useState(null);

    const handleGenerateReport = async (config) => {
        setIsGenerating(true);
        setReportConfig(config);
        
        try {
            // API ENDPOINT: POST /api/reports/generate
            const response = await generateReport(config);
            
            setReportData(response.data.reportData);
            
            setView('preview');
            toast.success(`${response.data.reportData.length} projects compiled successfully`);
        } catch (err) {
            console.error("Report Generation Error:", err);
            const errorMsg = err.response?.data?.message || 'Failed to compile report data.';
            toast.error(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DashboardLayout pageTitle="Reports">
            <Toaster position="top-right" />
            <div className="min-h-full">
                {view === 'builder' && (
                    <ReportBuilder 
                        onGenerate={handleGenerateReport} 
                        isGenerating={isGenerating}
                    />
                )}

                {view === 'preview' && (
                    <ReportPreview 
                        reportData={reportData} 
                        config={reportConfig}
                        onBack={() => setView('builder')} 
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
