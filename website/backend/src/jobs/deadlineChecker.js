const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const NotificationService = require('../services/NotificationService');

// Use service role key to bypass RLS for background job
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Runs every day at 8:00 AM
 */
const initDeadlineJob = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('[Job] Running Deadline Checker...');
        try {
            const today = new Date().toISOString().split('T')[0];

            // Query overdue tasks that are not completed/verified
            const { data: overdueTasks, error } = await supabaseAdmin
                .from('tasks')
                .select(`
                    id, 
                    title, 
                    project_id,
                    project:projects(project_name, project_coordinator_id)
                `)
                .lt('due_date', today)
                .not('status', 'in', '("completed","verified","ready_for_review")');

            if (error) throw error;

            if (overdueTasks) {
                for (const task of overdueTasks) {
                    const coordinatorId = task.project?.project_coordinator_id;
                    const projectName = task.project?.project_name || 'Project';

                    if (coordinatorId) {
                        await NotificationService.createNotification(
                            coordinatorId,
                            'Task Deadline Missed',
                            `Task '${task.title}' on '${projectName}' has missed its deadline. This threatens the parent milestone.`,
                            'warning',
                            `/tasks/${task.id}`
                        );
                    }
                }
            }
            console.log(`[Job] Deadline Checker finished. Processed ${overdueTasks?.length || 0} tasks.`);
        } catch (err) {
            console.error('[Job] Deadline Checker Error:', err);
        }
    });
};

module.exports = initDeadlineJob;
