const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Testing Dashboard stats query...');
  try {
    const { data, error } = await supabase.from('projects').select('status', { count: 'exact' });
    if (error) throw error;
    console.log('Dashboard stats query successful, count:', data.length);
  } catch (err) {
    console.error('Dashboard stats query failed:', err.message);
  }

  console.log('\nTesting EXACT Project index query (with column hints)...');
  try {
    const { data, error } = await supabase.from('projects')
        .select(`
          *,
          creator:users!created_by(id, first_name, last_name, role),
          projectInCharge:users!project_in_charge_id(id, first_name, last_name, role)
        `)
        .limit(1);
    if (error) throw error;
    console.log('Project EXACT query successful');
  } catch (err) {
    console.error('Project EXACT query failed:', err.message);
  }

  console.log('\nTesting EXACT Task index query (with column hints)...');
  try {
    const { data, error } = await supabase.from('tasks')
      .select(`
        *,
        project:projects(id, project_name),
        phase:project_phases(id, phase_key),
        milestone:project_milestones(id, milestone_name, has_quantity, target_quantity, current_quantity, unit_of_measure),
        assignedBy:users!assigned_by(id, first_name, last_name),
        assignedTo:users!assigned_to(id, first_name, last_name),
        creator:users!created_by(id, first_name, last_name)
      `)
      .limit(1);
    if (error) throw error;
    console.log('Task EXACT query successful');
  } catch (err) {
    console.error('Task EXACT query failed:', err.message);
  }
}

test();
