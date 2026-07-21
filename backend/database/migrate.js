/**
 * Applies schema.sql to the configured MySQL database.
 * Usage: npm run migrate   (from backend/)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true // safe here: this script only ever runs our own trusted schema.sql, never user input
  });

  console.log('Applying schema.sql ...');
  await connection.query(sql);
  console.log('Schema applied successfully.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
