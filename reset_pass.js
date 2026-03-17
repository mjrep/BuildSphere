const pool = require('./backend/db');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const email = 'gavinralph07@gmail.com';
  const newPassword = 'admin123';

  try {
    console.log(`Resetting password for ${email}...`);
    const hashed = await bcrypt.hash(newPassword, 10);
    const res = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [hashed, email]
    );

    if (res.rows.length > 0) {
      console.log(`✅ SUCCESS! Your password has been reset to: ${newPassword}`);
    } else {
      console.log(`❌ User ${email} not found.`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();
