const { query } = require('./init/util/db');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const migrationFile = path.join(__dirname, 'server/migrations/20260127_add_profile_to_posts.sql');

async function run() {
  try {
    console.log('Using database:', config.database.DATABASE);
    await query(`USE ${config.database.DATABASE}`);
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        try {
            await query(statement);
            console.log('Success');
        } catch (e) {
            console.log('Error (ignoring if duplicate column):', e.message);
        }
      }
    }
    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
