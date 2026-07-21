const db = require('../config/database');

async function getAll() {
  const rows = await db.query(`SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key`);
  return rows;
}

async function getValue(key, fallback = null) {
  const rows = await db.query(`SELECT setting_value FROM system_settings WHERE setting_key = :key`, { key });
  return rows[0] ? rows[0].setting_value : fallback;
}

async function getNumber(key, fallback) {
  const value = await getValue(key);
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function setValue(key, value, updatedBy) {
  await db.query(
    `INSERT INTO system_settings (setting_key, setting_value, updated_by)
     VALUES (:key, :value, :updatedBy)
     ON DUPLICATE KEY UPDATE setting_value = :value, updated_by = :updatedBy`,
    { key, value, updatedBy }
  );
}

module.exports = { getAll, getValue, getNumber, setValue };
