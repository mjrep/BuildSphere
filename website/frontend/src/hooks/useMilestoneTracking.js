import { useState, useEffect } from 'react';
import { getMilestones } from '../services/projectApi';
import { supabase } from '../utils/supabase';

/**
 * Hook to fetch and manage milestone tracking data.
 * The backend now returns a hierarchical structure: Phases -> Milestones & Tasks.
 */
export default function useMilestoneTracking(projectId) {
    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMilestones = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
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
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        if (!projectId) return;

        fetchMilestones();

        // Real-time subscriptions
        const tasksChannel = supabase
            .channel(`tasks-${projectId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
                () => {
                    console.log('Task change detected, refreshing milestones...');
                    fetchMilestones(true);
                }
            )
            .subscribe();

        const logsChannel = supabase
            .channel(`logs-${projectId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'task_progress_logs' },
                () => {
                    // Logic: Normally logs are linked to milestones which are linked to projects.
                    // For simplicity, we refresh upon any log for now, or could filter by metadata if available.
                    fetchMilestones(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(logsChannel);
        };
    }, [projectId]);

    return { phases, loading, error };
}
