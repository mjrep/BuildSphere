const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('Inspecting Database Schema for WPM-EVM...');
  
  const tables = ['projects', 'project_phases', 'project_milestones', 'tasks'];
  
  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`);
    // A quick way to get column names in Supabase/PostgREST is to query a single row
    // or we can query information_schema directly via Postgres if we had direct access, 
    // but trying to fetch 1 row works for columns unless table is empty.
    // If empty, we can try to cause an error that returns the columns, or use a known good row.
    
    // Better: let's just fetch 1 row and print keys, then we will construct a robust check.
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else {
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]).join(', '));
        } else {
            console.log(`Table ${table} is empty. Can't reliably infer all columns this way without rpc.`);
        }
    }
  }
}

inspectSchema();
