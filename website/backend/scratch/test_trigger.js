const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testTrigger() {
    console.log('--- Testing Project Progress Trigger ---');

    // 1. Find a task we can update
    const { data: tasks, error: taskErr } = await supabase
        .from('tasks')
        .select('id, project_id, status')
        .limit(1);

    if (taskErr || !tasks || tasks.length === 0) {
        console.error('Error fetching task or no tasks found:', taskErr);
        return;
    }

    const taskToUpdate = tasks[0];
    const projectId = taskToUpdate.project_id;
    console.log(`Selected Task ID: ${taskToUpdate.id}, Project ID: ${projectId}, Current Status: ${taskToUpdate.status}`);

    // 2. Get current project progress
    const { data: projBefore, error: projErrBefore } = await supabase
        .from('projects')
        .select('progress_percentage')
        .eq('id', projectId)
        .single();

    if (projErrBefore) {
        console.error('Error fetching project before update:', projErrBefore);
        return;
    }
    console.log(`Project Progress BEFORE update: ${projBefore.progress_percentage}%`);

    // 3. Toggle the task status to trigger an update
    const newStatus = taskToUpdate.status === 'completed' ? 'ongoing' : 'completed';
    console.log(`Updating task status to: ${newStatus}...`);
    
    const { error: updateErr } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskToUpdate.id);

    if (updateErr) {
        console.error('Error updating task:', updateErr);
        return;
    }

    // 4. Give the trigger a tiny moment (it's synchronous, but just in case), then fetch again
    const { data: projAfter, error: projErrAfter } = await supabase
        .from('projects')
        .select('progress_percentage')
        .eq('id', projectId)
        .single();

    if (projErrAfter) {
        console.error('Error fetching project after update:', projErrAfter);
        return;
    }
    console.log(`Project Progress AFTER update: ${projAfter.progress_percentage}%`);

    // 5. Revert the task status
    console.log(`Reverting task status back to: ${taskToUpdate.status}...`);
    await supabase
        .from('tasks')
        .update({ status: taskToUpdate.status })
        .eq('id', taskToUpdate.id);
        
    // 6. Fetch final progress
    const { data: projFinal } = await supabase
        .from('projects')
        .select('progress_percentage')
        .eq('id', projectId)
        .single();
    console.log(`Project Progress AFTER revert: ${projFinal.progress_percentage}%`);

    console.log('--- Test Completed ---');
}

testTrigger();
