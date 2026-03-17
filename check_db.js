const pool = require('./backend/db');

async function checkDb() {
  try {
    console.log('Checking database connection...');
    const res = await pool.query('SELECT NOW()');
    console.log('✅ DATABASE IS WORKING!');
    console.log('Server time from DB:', res.rows[0].now);

    const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
    console.log('\nExisting Tables:');
    tables.rows.forEach((row) => console.log(`- ${row.table_name}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ DATABASE ERROR:', err.message);
    process.exit(1);
  }
}

checkDb();
