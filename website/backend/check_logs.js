const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.from('project_inventory_logs').select('action_type').then(r => console.log([...new Set(r.data.map(d => d.action_type))]));
