const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('./logger');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  connectionLimit: env.db.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  dateStrings: true,
  namedPlaceholders: true,
  multipleStatements: false // hard-disabled: SQL-injection defense in depth
});

pool.on('connection', () => {
  logger.debug('New MySQL connection established');
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info('MySQL connection pool verified successfully');
    return true;
  } catch (err) {
    logger.error(`MySQL connection failed: ${err.message}`);
    return false;
  }
}

/**
 * Execute a parameterized query. ALWAYS use placeholders (?, or :named) —
 * never string-concatenate user input into SQL. This is the single choke
 * point for all DB access, which keeps SQL-injection defenses centralized.
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Run a set of queries inside a transaction. `work` receives a connection
 * with the same `.execute` signature.
 */
async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, withTransaction, testConnection };
