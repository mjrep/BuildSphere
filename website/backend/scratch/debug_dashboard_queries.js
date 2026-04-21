const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Testing Dashboard query...');
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, project_name, status,
        project_in_charge:users!project_in_charge_id(id, first_name),
        members:project_user(users!user_id(id, first_name)),
        tasks:tasks(id, status),
        updates:tasks(
          id,
          progress_logs:task_progress_logs(id, created_at, work_date)
        )
      `)
      .limit(1);

    if (error) console.error('FAILED Dashboard:', error);
    else console.log('SUCCESS: Dashboard query.');
  } catch (err) { console.error('CRASHED Dashboard:', err.message); }

  console.log('\nTesting MilestoneService query...');
  try {
    const { data, error } = await supabase
      .from('project_phases')
      .select(`
        id,
        phase_key,
        tasks:tasks(
          id,
          milestone_id,
          assigned_to:users!assigned_to(id, first_name)
        )
      `)
      .limit(1);

    if (error) console.error('FAILED Milestone:', error);
    else console.log('SUCCESS: Milestone query.');
  } catch (err) { console.error('CRASHED Milestone:', err.message); }

  console.log('\nTesting Task index query...');
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, project_name),
        phase:project_phases(id, phase_key),
        assignedTo:users!assigned_to(id, first_name)
      `)
      .limit(1);

    if (error) console.error('FAILED Task:', error);
    else console.log('SUCCESS: Task query.');
  } catch (err) { console.error('CRASHED Task:', err.message); }
}

test();
