import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, getMilestoneChart, submitMilestoneReview } from '../services/projectApi';
import MilestoneReviewChart from '../components/projects/MilestoneReviewChart';
import { toast } from 'react-hot-toast';

export default function EngineerMilestoneReviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projRes, chartRes] = await Promise.all([
                    getProject(id),
                    getMilestoneChart(id)
                ]);
                
                setProject(projRes.data.data);
                setChartData(chartRes.data);
            } catch (error) {
                console.error('Failed to load project or chart data:', error);
                toast.error('Failed to load review data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            await submitMilestoneReview(id);
            navigate(`/projects/${id}/milestone-success`);
        } catch (error) {
            console.error('Submit failed:', error);
            toast.error(error.response?.data?.message || 'Failed to submit milestone plan.');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading review chart...</div>;
    if (!project || !chartData) return <div className="p-8 text-center text-red-500">Data not found.</div>;

    return (
        <div className="flex-1 bg-card p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Review Milestones</h1>
                        <p className="text-[#5A5A5A] mt-2">
                            Review the Gantt chart for <span className="font-semibold">{project.project_code} ({project.project_name})</span>.
                        </p>
                    </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border-primary mb-8 shadow-sm">
                    <MilestoneReviewChart data={chartData} />
                </div>

                <div className="flex justify-between items-center border-t pt-6">
                    <button
                        type="button"
                        onClick={() => navigate(`/projects/${id}/milestone-input`)}
                        className="text-accent font-medium hover:underline px-4 py-2"
                    >
                        &larr; Back to Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-colors disabled:opacity-70 shadow-sm"
                    >
                        {submitting ? 'Submitting...' : 'Submit for Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}
