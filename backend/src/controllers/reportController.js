const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const reportService = require('../services/reportService');
const { sendExcel, sendPdf } = require('../utils/exportUtils');
const auditService = require('../services/auditService');

const REPORTS = {
  daily: {
    label: 'Daily Borrowing Report',
    fetch: (q) => reportService.dailyBorrowing(q.date),
    columns: [
      { header: 'Book Title', key: 'title', width: 30 },
      { header: 'ISBN', key: 'isbn', width: 16 },
      { header: 'Borrower', key: 'first_name', width: 20 },
      { header: 'Employee ID', key: 'employee_id', width: 16 },
      { header: 'Borrow Date', key: 'borrow_date', width: 14 },
      { header: 'Due Date', key: 'due_date', width: 14 },
      { header: 'Status', key: 'status', width: 12 }
    ]
  },
  monthly: {
    label: 'Monthly Borrowing Report',
    fetch: (q) => reportService.monthlyBorrowing(q.year || new Date().getFullYear(), q.month || new Date().getMonth() + 1),
    columns: [
      { header: 'Book Title', key: 'title', width: 30 },
      { header: 'ISBN', key: 'isbn', width: 16 },
      { header: 'Borrower', key: 'first_name', width: 20 },
      { header: 'Borrow Date', key: 'borrow_date', width: 14 },
      { header: 'Due Date', key: 'due_date', width: 14 },
      { header: 'Return Date', key: 'return_date', width: 14 },
      { header: 'Status', key: 'status', width: 12 }
    ]
  },
  overdue: {
    label: 'Overdue Books Report',
    fetch: () => reportService.overdueBooks(),
    columns: [
      { header: 'Book Title', key: 'title', width: 30 },
      { header: 'ISBN', key: 'isbn', width: 16 },
      { header: 'Borrower', key: 'first_name', width: 20 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'Due Date', key: 'due_date', width: 14 },
      { header: 'Days Overdue', key: 'days_overdue', width: 14 }
    ]
  },
  lost: {
    label: 'Lost Books Report',
    fetch: () => reportService.lostBooks(),
    columns: [
      { header: 'Book Title', key: 'title', width: 30 },
      { header: 'ISBN', key: 'isbn', width: 16 },
      { header: 'Borrower', key: 'first_name', width: 20 },
      { header: 'Borrow Date', key: 'borrow_date', width: 14 },
      { header: 'Due Date', key: 'due_date', width: 14 }
    ]
  },
  inventory: {
    label: 'Inventory Report',
    fetch: () => reportService.inventoryReport(),
    columns: [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'ISBN', key: 'isbn', width: 16 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Shelf', key: 'shelf', width: 10 },
      { header: 'Total Copies', key: 'total_copies', width: 12 },
      { header: 'Available', key: 'available_copies', width: 12 },
      { header: 'Status', key: 'status', width: 12 }
    ]
  },
  'most-borrowed': {
    label: 'Most Borrowed Books Report',
    fetch: (q) => reportService.mostBorrowedBooks(q.limit || 20),
    columns: [
      { header: 'Title', key: 'title', width: 34 },
      { header: 'ISBN', key: 'isbn', width: 16 },
      { header: 'Times Borrowed', key: 'times_borrowed', width: 16 }
    ]
  },
  'active-members': {
    label: 'Active Members Report',
    fetch: () => reportService.activeMembers(),
    columns: [
      { header: 'Name', key: 'first_name', width: 20 },
      { header: 'Employee ID', key: 'employee_id', width: 16 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Total Loans', key: 'total_loans', width: 12 },
      { header: 'Active Loans', key: 'active_loans', width: 12 }
    ]
  },
  departments: {
    label: 'Department Statistics Report',
    fetch: () => reportService.departmentStatistics(),
    columns: [
      { header: 'Department', key: 'department', width: 24 },
      { header: 'Members', key: 'member_count', width: 12 },
      { header: 'Total Loans', key: 'total_loans', width: 12 }
    ]
  }
};

const generate = catchAsync(async (req, res) => {
  const { type, format } = req.params;
  const report = REPORTS[type];
  if (!report) throw AppError.notFound('Unknown report type.');
  if (!['pdf', 'excel'].includes(format)) throw AppError.badRequest('Format must be "pdf" or "excel".');

  const rows = await report.fetch(req.query);
  const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}`;

  await auditService.record({
    userId: req.user.id, action: 'REPORT_GENERATED', entityType: 'report',
    description: `${report.label} (${format})`, req
  });

  if (format === 'excel') {
    return sendExcel(res, { filename, title: report.label, columns: report.columns, rows });
  }
  return sendPdf(res, { filename, title: report.label, columns: report.columns, rows });
});

const listReportTypes = catchAsync(async (req, res) => {
  const types = Object.entries(REPORTS).map(([key, r]) => ({ key, label: r.label }));
  res.status(200).json({ success: true, data: { types } });
});

module.exports = { generate, listReportTypes };
