const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const { data: pTasks, error: err1 } = await supabase.from('project_tasks').select('id').limit(1);
  console.log('project_tasks exists?', !err1);

  const { data: tasks, error: err2 } = await supabase.from('tasks').select('id').limit(1);
  console.log('tasks exists?', !err2);
}

checkTables();
