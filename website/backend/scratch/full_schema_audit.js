const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function dumpSchema() {
  const tables = [
    'users', 'projects', 'tasks', 'clients', 'project_phases', 'project_milestones', 
    'project_user', 'project_approvals', 'project_inventory_items', 'task_comments', 
    'task_attachments', 'task_progress_logs'
  ];

  const schema = {};

  for (const table of tables) {
    console.log(`Auditing ${table}...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error auditing ${table}:`, error.message);
      schema[table] = { error: error.message };
    } else {
      schema[table] = {
        columns: Object.keys(data[0] || {})
      };
    }
  }

  // Also try to find foreign keys via SQL if possible
  console.log('\nFetching foreign keys from information_schema...');
  const sql = `
    SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
  `;

  // Note: Supabase JS SDK doesn't support raw SQL easily unless we use an RPC.
  // I will just rely on the columns for now and infer/test hints.
  // Actually, I'll try to find any existing RPC or just use common sense.
  
  console.log('\n--- SCHEMA DUMP ---');
  console.log(JSON.stringify(schema, null, 2));
}

dumpSchema();
