import { useState, useEffect } from 'react';
import { getMilestones } from '../services/projectApi';

/**
 * Hook to fetch and manage milestone tracking data.
 * The backend now returns a hierarchical structure: Phases -> Milestones & Tasks.
 */
export default function useMilestoneTracking(projectId) {
    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        const fetchMilestones = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getMilestones(projectId);
                const data = response.data.data || response.data;
                
                // Data is already grouped by phase from the backend
                setPhases(data);
            } catch (err) {
                console.error('Error fetching milestones:', err);
                setError(err.response?.data?.message || 'Failed to fetch milestone data.');
            } finally {
                setLoading(false);
            }
        };

        fetchMilestones();
    }, [projectId]);

    return { phases, loading, error };
}
