const pool = require('./backend/db');

async function checkUser() {
  try {
    const res = await pool.query('SELECT * FROM users WHERE email = $1 OR first_name ILIKE $1', [
      '%gavin%',
    ]);
    if (res.rows.length > 0) {
      console.log('✅ User found:');
      res.rows.forEach((u) =>
        console.log(`- ID: ${u.id}, Name: ${u.first_name} ${u.last_name}, Email: ${u.email}`)
      );
    } else {
      console.log("❌ No user found matching 'gavin'.");
      const allUsers = await pool.query('SELECT first_name, email FROM users LIMIT 5');
      console.log('Current users in DB:', allUsers.rows);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
