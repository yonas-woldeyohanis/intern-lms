const db = require('../config/database');

const BASE_SELECT = `
  SELECT b.id, b.title, b.isbn, b.edition, b.publication_year, b.language, b.description,
         b.cover_image_url, b.qr_code_path, b.total_copies, b.available_copies, b.status,
         b.created_at, b.updated_at,
         a.id AS author_id, a.full_name AS author_name,
         p.id AS publisher_id, p.name AS publisher_name,
         c.id AS category_id, c.name AS category_name,
         s.id AS shelf_id, s.code AS shelf_code
  FROM books b
  LEFT JOIN authors a ON a.id = b.author_id
  LEFT JOIN publishers p ON p.id = b.publisher_id
  LEFT JOIN categories c ON c.id = b.category_id
  LEFT JOIN shelves s ON s.id = b.shelf_id
`;

async function findById(id) {
  const rows = await db.query(`${BASE_SELECT} WHERE b.id = :id`, { id });
  return rows[0] || null;
}

async function findByIsbn(isbn) {
  const rows = await db.query(`SELECT id FROM books WHERE isbn = :isbn`, { isbn });
  return rows[0] || null;
}

async function search({ page = 1, limit = 20, q, categoryId, authorId, publisherId, shelfId, status, sortBy = 'created_at', sortDir = 'DESC' }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = {};

  if (q) {
    conditions.push(`(b.title LIKE :q OR b.isbn LIKE :q OR a.full_name LIKE :q OR p.name LIKE :q OR c.name LIKE :q OR s.code LIKE :q)`);
    params.q = `%${q}%`;
  }
  if (categoryId) { conditions.push('b.category_id = :categoryId'); params.categoryId = categoryId; }
  if (authorId) { conditions.push('b.author_id = :authorId'); params.authorId = authorId; }
  if (publisherId) { conditions.push('b.publisher_id = :publisherId'); params.publisherId = publisherId; }
  if (shelfId) { conditions.push('b.shelf_id = :shelfId'); params.shelfId = shelfId; }
  if (status) { conditions.push('b.status = :status'); params.status = status; }
  else { conditions.push(`b.status != 'archived'`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSort = ['title', 'publication_year', 'created_at', 'available_copies'];
  const sortColumn = allowedSort.includes(sortBy) ? `b.${sortBy}` : 'b.created_at';
  const direction = sortDir && sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const rows = await db.query(
    `${BASE_SELECT} ${where} ORDER BY ${sortColumn} ${direction} LIMIT :limit OFFSET :offset`,
    { ...params, limit: Number(limit), offset: Number(offset) }
  );
  const [{ total }] = await db.query(
    `SELECT COUNT(*) AS total FROM books b
     LEFT JOIN authors a ON a.id = b.author_id
     LEFT JOIN publishers p ON p.id = b.publisher_id
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN shelves s ON s.id = b.shelf_id
     ${where}`,
    params
  );

  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}

async function create(book) {
  const result = await db.query(
    `INSERT INTO books (title, isbn, author_id, publisher_id, category_id, shelf_id, edition,
       publication_year, language, description, cover_image_url, total_copies, available_copies, status, added_by)
     VALUES (:title, :isbn, :authorId, :publisherId, :categoryId, :shelfId, :edition,
       :publicationYear, :language, :description, :coverImageUrl, :totalCopies, :availableCopies, :status, :addedBy)`,
    book
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const allowed = [
    'title', 'isbn', 'author_id', 'publisher_id', 'category_id', 'shelf_id', 'edition',
    'publication_year', 'language', 'description', 'cover_image_url', 'qr_code_path',
    'total_copies', 'available_copies', 'status'
  ];
  const sets = [];
  const params = { id };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      sets.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (sets.length === 0) return findById(id);
  await db.query(`UPDATE books SET ${sets.join(', ')} WHERE id = :id`, params);
  return findById(id);
}

async function setQrPath(id, qrPath) {
  await db.query(`UPDATE books SET qr_code_path = :qrPath WHERE id = :id`, { id, qrPath });
}

async function archive(id) {
  await db.query(`UPDATE books SET status = 'archived' WHERE id = :id`, { id });
}

async function adjustAvailableCopies(bookId, delta, conn = null) {
  const executor = conn || db.pool;
  await executor.execute(
    `UPDATE books SET available_copies = available_copies + ? WHERE id = ?`,
    [delta, bookId]
  );
}

async function dashboardCounts() {
  const [totals] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM books WHERE status != 'archived') AS total_books,
      (SELECT COALESCE(SUM(available_copies),0) FROM books WHERE status != 'archived') AS available_copies,
      (SELECT COALESCE(SUM(total_copies - available_copies),0) FROM books WHERE status != 'archived') AS borrowed_copies,
      (SELECT COUNT(*) FROM borrow_records WHERE status = 'borrowed' AND due_date < CURDATE()) AS overdue_count,
      (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_members
  `);
  return totals;
}

async function popularBooks(limit = 5) {
  return db.query(
    `SELECT b.id, b.title, COUNT(br.id) AS borrow_count
     FROM borrow_records br
     JOIN books b ON b.id = br.book_id
     GROUP BY b.id, b.title
     ORDER BY borrow_count DESC
     LIMIT :limit`,
    { limit: Number(limit) }
  );
}

async function categoryDistribution() {
  return db.query(
    `SELECT c.name AS category, COUNT(b.id) AS book_count
     FROM categories c
     LEFT JOIN books b ON b.category_id = c.id AND b.status != 'archived'
     GROUP BY c.id, c.name
     ORDER BY book_count DESC`
  );
}

async function monthlyBorrowStats(months = 6) {
  return db.query(
    `SELECT DATE_FORMAT(borrow_date, '%Y-%m') AS month, COUNT(*) AS total
     FROM borrow_records
     WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
     GROUP BY month
     ORDER BY month ASC`,
    { months: Number(months) }
  );
}

module.exports = {
  findById, findByIsbn, search, create, update, setQrPath, archive,
  adjustAvailableCopies, dashboardCounts, popularBooks, categoryDistribution, monthlyBorrowStats
};
