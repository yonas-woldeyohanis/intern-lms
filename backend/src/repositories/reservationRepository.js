const db = require('../config/database');

const BASE_SELECT = `
  SELECT r.id, r.reserved_at, r.expires_at, r.status,
         b.id AS book_id, b.title AS book_title, b.available_copies,
         u.id AS user_id, u.first_name, u.last_name, u.email AS user_email
  FROM reservations r
  JOIN books b ON b.id = r.book_id
  JOIN users u ON u.id = r.user_id
`;

async function findById(id) {
  const rows = await db.query(`${BASE_SELECT} WHERE r.id = :id`, { id });
  return rows[0] || null;
}

async function findActiveForBookAndUser(bookId, userId) {
  const rows = await db.query(
    `SELECT * FROM reservations WHERE book_id = :bookId AND user_id = :userId AND status = 'pending'`,
    { bookId, userId }
  );
  return rows[0] || null;
}

async function create({ bookId, userId, expiresAt }) {
  const result = await db.query(
    `INSERT INTO reservations (book_id, user_id, expires_at, status) VALUES (:bookId, :userId, :expiresAt, 'pending')`,
    { bookId, userId, expiresAt }
  );
  return findById(result.insertId);
}

async function updateStatus(id, status) {
  await db.query(`UPDATE reservations SET status = :status WHERE id = :id`, { id, status });
  return findById(id);
}

async function list({ page = 1, limit = 20, status, userId, bookId }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = {};
  if (status) { conditions.push('r.status = :status'); params.status = status; }
  if (userId) { conditions.push('r.user_id = :userId'); params.userId = userId; }
  if (bookId) { conditions.push('r.book_id = :bookId'); params.bookId = bookId; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await db.query(
    `${BASE_SELECT} ${where} ORDER BY r.reserved_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit: Number(limit), offset: Number(offset) }
  );
  const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM reservations r ${where}`, params);
  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}

module.exports = { findById, findActiveForBookAndUser, create, updateStatus, list };
