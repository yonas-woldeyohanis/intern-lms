const db = require('../config/database');

async function findByName(name) {
  const rows = await db.query(`SELECT * FROM roles WHERE name = :name`, { name });
  return rows[0] || null;
}

async function findAll() {
  return db.query(`SELECT * FROM roles ORDER BY id ASC`);
}

module.exports = { findByName, findAll };
