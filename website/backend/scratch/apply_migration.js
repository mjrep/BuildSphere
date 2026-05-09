const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    const sqlPath = path.join(__dirname, 'inventory_ledger_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Attempting to run migration via exec_sql RPC...');
    
    // Split SQL into statements and run them if possible, or try whole block
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration failed via RPC:', error);
        console.log('Please run the contents of inventory_ledger_setup.sql manually in the Supabase SQL Editor.');
    } else {
        console.log('Migration applied successfully:', data);
    }
}

runMigration();
