const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log('Inspecting projects table columns...');
  const { data: projCols, error: err1 } = await supabase.rpc('get_table_columns', { table_name: 'projects' });
  if (err1) {
    // If RPC doesn't exist, try a simple select limit 0
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Columns in projects:', Object.keys(data[0] || {}));
  } else {
    console.log(projCols);
  }

  console.log('\nInspecting tasks table columns...');
  const { data: taskCols, error: err2 } = await supabase.from('tasks').select('*').limit(1);
  if (err2) console.error(err2);
  else console.log('Columns in tasks:', Object.keys(data[0] || {}));
}

inspect();
