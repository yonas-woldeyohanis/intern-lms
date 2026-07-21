const catchAsync = require('../utils/catchAsync');
const bookRepository = require('../repositories/bookRepository');
const db = require('../config/database');

const summary = catchAsync(async (req, res) => {
  const counts = await bookRepository.dashboardCounts();
  const popular = await bookRepository.popularBooks(5);
  const categoryDist = await bookRepository.categoryDistribution();
  const monthly = await bookRepository.monthlyBorrowStats(6);

  const recentActivity = await db.query(
    `SELECT a.id, a.action, a.description, a.created_at, u.first_name, u.last_name
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT 10`
  );

  res.status(200).json({
    success: true,
    data: {
      totals: {
        totalBooks: Number(counts.total_books),
        availableBooks: Number(counts.available_copies),
        borrowedBooks: Number(counts.borrowed_copies),
        overdueBooks: Number(counts.overdue_count),
        activeMembers: Number(counts.active_members)
      },
      popularBooks: popular,
      categoryDistribution: categoryDist,
      monthlyBorrowStats: monthly,
      recentActivity
    }
  });
});

module.exports = { summary };
