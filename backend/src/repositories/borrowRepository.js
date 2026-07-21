const db = require('../config/database');

const BASE_SELECT = `
  SELECT br.id, br.borrow_date, br.due_date, br.return_date, br.status, br.renewal_count, br.notes,
         br.created_at, br.updated_at,
         b.id AS book_id, b.title AS book_title, b.isbn AS book_isbn,
         u.id AS user_id, u.first_name, u.last_name, u.employee_id, u.email AS user_email,
         issuer.id AS issued_by_id, issuer.first_name AS issued_by_first_name, issuer.last_name AS issued_by_last_name
  FROM borrow_records br
  JOIN books b ON b.id = br.book_id
  JOIN users u ON u.id = br.user_id
  LEFT JOIN users issuer ON issuer.id = br.issued_by
`;

async function findById(id, conn = null) {
  const rows = conn
    ? (await conn.execute(`${BASE_SELECT} WHERE br.id = ?`, [id]))[0]
    : await db.query(`${BASE_SELECT} WHERE br.id = :id`, { id });
  return rows[0] || null;
}

async function activeLoanCount(userId, conn = null) {
  const rows = conn
    ? (await conn.execute(`SELECT COUNT(*) AS cnt FROM borrow_records WHERE user_id = ? AND status IN ('borrowed','overdue')`, [userId]))[0]
    : await db.query(`SELECT COUNT(*) AS cnt FROM borrow_records WHERE user_id = :userId AND status IN ('borrowed','overdue')`, { userId });
  return Number(rows[0].cnt);
}

async function activeLoanForBookAndUser(bookId, userId) {
  const rows = await db.query(
    `SELECT * FROM borrow_records WHERE book_id = :bookId AND user_id = :userId AND status IN ('borrowed','overdue')`,
    { bookId, userId }
  );
  return rows[0] || null;
}

async function createBorrow({ bookId, userId, issuedBy, borrowDate, dueDate }, conn) {
  const [result] = await conn.execute(
    `INSERT INTO borrow_records (book_id, user_id, issued_by, borrow_date, due_date, status)
     VALUES (?, ?, ?, ?, ?, 'borrowed')`,
    [bookId, userId, issuedBy, borrowDate, dueDate]
  );
  return result.insertId;
}

async function markReturned({ id, returnedTo, returnDate }, conn) {
  await conn.execute(
    `UPDATE borrow_records SET status = 'returned', return_date = ?, returned_to = ? WHERE id = ?`,
    [returnDate, returnedTo, id]
  );
}

async function markLost(id, conn) {
  await conn.execute(`UPDATE borrow_records SET status = 'lost' WHERE id = ?`, [id]);
}

async function renew({ id, newDueDate }, conn) {
  const executor = conn || db;
  if (conn) {
    await conn.execute(
      `UPDATE borrow_records SET due_date = ?, renewal_count = renewal_count + 1 WHERE id = ?`,
      [newDueDate, id]
    );
  } else {
    await db.query(
      `UPDATE borrow_records SET due_date = :newDueDate, renewal_count = renewal_count + 1 WHERE id = :id`,
      { newDueDate, id }
    );
  }
}

async function markOverdueRecords() {
  const result = await db.query(
    `UPDATE borrow_records SET status = 'overdue' WHERE status = 'borrowed' AND due_date < CURDATE()`
  );
  return result;
}

async function list({ page = 1, limit = 20, status, userId, bookId, overdueOnly }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = {};

  if (status) { conditions.push('br.status = :status'); params.status = status; }
  if (userId) { conditions.push('br.user_id = :userId'); params.userId = userId; }
  if (bookId) { conditions.push('br.book_id = :bookId'); params.bookId = bookId; }
  if (overdueOnly === 'true' || overdueOnly === true) {
    conditions.push(`br.status IN ('borrowed','overdue') AND br.due_date < CURDATE()`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await db.query(
    `${BASE_SELECT} ${where} ORDER BY br.created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit: Number(limit), offset: Number(offset) }
  );
  const [{ total }] = await db.query(
    `SELECT COUNT(*) AS total FROM borrow_records br ${where}`,
    params
  );
  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}

module.exports = {
  findById, activeLoanCount, activeLoanForBookAndUser, createBorrow,
  markReturned, markLost, renew, markOverdueRecords, list
};
