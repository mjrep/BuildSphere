const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    console.log('Projects ID type test:', data, typeof data?.[0]?.id);
}

checkSchema();
