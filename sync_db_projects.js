const pool = require('./backend/db');

async function syncProjects() {
  try {
    console.log('Checking for image_url column...');
    await pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT');

    console.log('Updating project records...');

    // id 1 -> High Rise Building
    await pool.query(`
            UPDATE projects 
            SET name = 'High Rise Building', 
                location = '123 Main St', 
                color = '#FF6B6B', 
                status = 'Active', 
                image_url = 'building.jpg' 
            WHERE id = 1
        `);

    // id 2 -> DMCI Homes
    await pool.query(`
            UPDATE projects 
            SET name = 'DMCI Homes', 
                location = '456 Market St', 
                color = '#4ECDC4', 
                status = 'Active', 
                image_url = 'Gemini_Generated_Image_mcjrmgmcjrmgmcjr.png' 
            WHERE id = 2
        `);

    // id 3 -> Sunset Apartments
    await pool.query(`
            UPDATE projects 
            SET name = 'Sunset Apartments', 
                location = '789 Ocean Blvd', 
                color = '#45B7D1', 
                status = 'Planning', 
                image_url = 'pexels-annechois-6148374.jpg' 
            WHERE id = 3
        `);

    console.log('✅ Database sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
}

syncProjects();
