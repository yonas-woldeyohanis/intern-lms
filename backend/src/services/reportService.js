const dayjs = require('dayjs');
const db = require('../config/database');

async function dailyBorrowing(date) {
  const targetDate = date || dayjs().format('YYYY-MM-DD');
  return db.query(
    `SELECT br.id, b.title, b.isbn, u.first_name, u.last_name, u.employee_id, br.borrow_date, br.due_date, br.status
     FROM borrow_records br JOIN books b ON b.id = br.book_id JOIN users u ON u.id = br.user_id
     WHERE br.borrow_date = :date ORDER BY br.created_at DESC`,
    { date: targetDate }
  );
}

async function monthlyBorrowing(year, month) {
  return db.query(
    `SELECT br.id, b.title, b.isbn, u.first_name, u.last_name, u.employee_id, br.borrow_date, br.due_date, br.return_date, br.status
     FROM borrow_records br JOIN books b ON b.id = br.book_id JOIN users u ON u.id = br.user_id
     WHERE YEAR(br.borrow_date) = :year AND MONTH(br.borrow_date) = :month
     ORDER BY br.borrow_date DESC`,
    { year, month }
  );
}

async function overdueBooks() {
  return db.query(
    `SELECT br.id, b.title, b.isbn, u.first_name, u.last_name, u.employee_id, u.email, br.due_date,
            DATEDIFF(CURDATE(), br.due_date) AS days_overdue
     FROM borrow_records br JOIN books b ON b.id = br.book_id JOIN users u ON u.id = br.user_id
     WHERE br.status IN ('borrowed','overdue') AND br.due_date < CURDATE()
     ORDER BY days_overdue DESC`
  );
}

async function lostBooks() {
  return db.query(
    `SELECT br.id, b.title, b.isbn, u.first_name, u.last_name, u.employee_id, br.borrow_date, br.due_date
     FROM borrow_records br JOIN books b ON b.id = br.book_id JOIN users u ON u.id = br.user_id
     WHERE br.status = 'lost' ORDER BY br.updated_at DESC`
  );
}

async function inventoryReport() {
  return db.query(
    `SELECT b.id, b.title, b.isbn, a.full_name AS author, c.name AS category, s.code AS shelf,
            b.total_copies, b.available_copies, b.status
     FROM books b
     LEFT JOIN authors a ON a.id = b.author_id
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN shelves s ON s.id = b.shelf_id
     WHERE b.status != 'archived'
     ORDER BY b.title ASC`
  );
}

async function mostBorrowedBooks(limit = 20) {
  return db.query(
    `SELECT b.title, b.isbn, COUNT(br.id) AS times_borrowed
     FROM borrow_records br JOIN books b ON b.id = br.book_id
     GROUP BY b.id, b.title, b.isbn
     ORDER BY times_borrowed DESC LIMIT :limit`,
    { limit: Number(limit) }
  );
}

async function activeMembers() {
  return db.query(
    `SELECT u.id, u.first_name, u.last_name, u.employee_id, d.name AS department,
            COUNT(br.id) AS total_loans,
            SUM(CASE WHEN br.status IN ('borrowed','overdue') THEN 1 ELSE 0 END) AS active_loans
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN borrow_records br ON br.user_id = u.id
     WHERE u.status = 'active'
     GROUP BY u.id, u.first_name, u.last_name, u.employee_id, d.name
     ORDER BY total_loans DESC`
  );
}

async function departmentStatistics() {
  return db.query(
    `SELECT d.name AS department, COUNT(DISTINCT u.id) AS member_count, COUNT(br.id) AS total_loans
     FROM departments d
     LEFT JOIN users u ON u.department_id = d.id
     LEFT JOIN borrow_records br ON br.user_id = u.id
     GROUP BY d.id, d.name
     ORDER BY total_loans DESC`
  );
}

module.exports = {
  dailyBorrowing, monthlyBorrowing, overdueBooks, lostBooks,
  inventoryReport, mostBorrowedBooks, activeMembers, departmentStatistics
};
