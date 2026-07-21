/**
 * Creates the initial administrator account using a properly generated
 * bcrypt hash (never hardcoded/committed). Safe to re-run: it upserts
 * rather than duplicating the admin user.
 *
 * Usage: npm run seed   (from backend/, after `npm run migrate`)
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function seed() {
  const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bmvei.local';
  const username = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!password || password.length < 8) {
    console.error('Set ADMIN_DEFAULT_PASSWORD in backend/.env (min 8 chars) before seeding.');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const hash = await bcrypt.hash(password, saltRounds);

  const [roleRows] = await connection.execute(`SELECT id FROM roles WHERE name = 'admin'`);
  if (!roleRows[0]) {
    console.error('Admin role not found — did you run `npm run migrate` first?');
    process.exit(1);
  }
  const adminRoleId = roleRows[0].id;

  const [existing] = await connection.execute(`SELECT id FROM users WHERE username = ? OR email = ?`, [username, email]);

  if (existing[0]) {
    await connection.execute(
      `UPDATE users SET password_hash = ?, password_changed_at = NOW(), status = 'active' WHERE id = ?`,
      [hash, existing[0].id]
    );
    console.log(`Existing admin user "${username}" password reset from .env value.`);
  } else {
    await connection.execute(
      `INSERT INTO users (employee_id, first_name, last_name, email, username, password_hash, role_id, status, password_changed_at)
       VALUES ('BMVEI-0001', 'System', 'Administrator', ?, ?, ?, ?, 'active', NOW())`,
      [email, username, hash, adminRoleId]
    );
    console.log(`Admin user "${username}" created successfully.`);
  }

  console.log('IMPORTANT: log in and change this password immediately in a production deployment.');
  await connection.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
