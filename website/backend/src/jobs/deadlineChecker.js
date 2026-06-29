const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { getLocalToday } = require('../utils/timeHelpers');
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
            const today = getLocalToday();

            // Query overdue tasks that are not completed/verified
            const { data: overdueTasks, error } = await supabaseAdmin
                .from('tasks')
                .select(`
                    id, 
                    title, 
                    project_id,
                    assigned_to,
                    created_by,
                    project:projects(project_name)
                `)
                .lt('due_date', today)
                .not('status', 'in', '("completed","verified","ready_for_review")');

            if (error) throw error;

            if (overdueTasks) {
                for (const task of overdueTasks) {
                    const projectName = task.project?.project_name || 'Project';

                    const usersToNotify = new Set();
                    if (task.assigned_to) usersToNotify.add(task.assigned_to);
                    if (task.created_by) usersToNotify.add(task.created_by);

                    for (const userId of usersToNotify) {
                        await NotificationService.createNotification(
                            userId,
                            'Task Deadline Missed',
                            `Task '${task.title}' on '${projectName}' has missed its deadline. This threatens the parent milestone.`,
                            'warning',
                            `/tasks`
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
