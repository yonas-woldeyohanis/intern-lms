const catchAsync = require('../utils/catchAsync');
const bookRepository = require('../repositories/bookRepository');
const db = require('../config/database');

const summary = catchAsync(async (req, res) => {
  const counts = await bookRepository.dashboardCounts();
  const popular = await bookRepository.popularBooks(8);
  const categoryDist = await bookRepository.categoryDistribution();
  const monthly = await bookRepository.monthlyBorrowStats(8);

  // Borrow status breakdown (borrowed vs returned vs overdue) per month
  const statusTimeline = await db.query(`
    SELECT
      DATE_FORMAT(borrow_date, '%Y-%m') AS month,
      SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned,
      SUM(CASE WHEN status IN ('borrowed') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'overdue' OR (status = 'borrowed' AND due_date < CURDATE()) THEN 1 ELSE 0 END) AS overdue
    FROM borrow_records
    WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL 8 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  // Top authors by borrow count
  const topAuthors = await db.query(`
    SELECT a.full_name AS author, COUNT(br.id) AS borrow_count
    FROM borrow_records br
    JOIN books b ON b.id = br.book_id
    JOIN authors a ON a.id = b.author_id
    GROUP BY a.id, a.full_name
    ORDER BY borrow_count DESC
    LIMIT 6
  `);

  // Utilization rate per category
  const categoryUtilization = await db.query(`
    SELECT c.name AS category,
      COALESCE(SUM(b.total_copies),0) AS total,
      COALESCE(SUM(b.total_copies - b.available_copies),0) AS borrowed
    FROM categories c
    LEFT JOIN books b ON b.category_id = c.id AND b.status != 'archived'
    GROUP BY c.id, c.name
    HAVING total > 0
    ORDER BY borrowed DESC
    LIMIT 6
  `);

  // Reservations per month
  const reservationTrend = await db.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
    FROM reservations
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 8 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  const recentActivity = await db.query(
    `SELECT a.id, a.action, a.description, a.created_at, u.first_name, u.last_name
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT 12`
  );

  res.status(200).json({
    success: true,
    data: {
      totals: {
        totalBooks:     Number(counts.total_books),
        availableBooks: Number(counts.available_copies),
        borrowedBooks:  Number(counts.borrowed_copies),
        overdueBooks:   Number(counts.overdue_count),
        activeMembers:  Number(counts.active_members)
      },
      popularBooks: popular,
      categoryDistribution: categoryDist,
      monthlyBorrowStats: monthly,
      statusTimeline,
      topAuthors,
      categoryUtilization,
      reservationTrend,
      recentActivity
    }
  });
});

module.exports = { summary };
