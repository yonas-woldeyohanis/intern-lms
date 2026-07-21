const dayjs = require('dayjs');
const db = require('../config/database');
const AppError = require('../utils/AppError');
const borrowRepository = require('../repositories/borrowRepository');
const bookRepository = require('../repositories/bookRepository');
const settingsRepository = require('../repositories/settingsRepository');
const auditService = require('../services/auditService');

async function issueBook({ bookId, userId }, issuedBy, req) {
  const maxLoans = await settingsRepository.getNumber('max_books_per_user', 3);
  const loanPeriodDays = await settingsRepository.getNumber('loan_period_days', 14);

  const activeCount = await borrowRepository.activeLoanCount(userId);
  if (activeCount >= maxLoans) {
    throw AppError.badRequest(`This member already has the maximum of ${maxLoans} active loans.`);
  }

  const existingLoan = await borrowRepository.activeLoanForBookAndUser(bookId, userId);
  if (existingLoan) {
    throw AppError.conflict('This member already has an active loan for this book.');
  }

  const borrowDate = dayjs().format('YYYY-MM-DD');
  const dueDate = dayjs().add(loanPeriodDays, 'day').format('YYYY-MM-DD');

  const recordId = await db.withTransaction(async (conn) => {
    const [bookRows] = await conn.execute(`SELECT available_copies FROM books WHERE id = ? FOR UPDATE`, [bookId]);
    if (!bookRows[0]) throw AppError.notFound('Book not found.');
    if (bookRows[0].available_copies < 1) {
      throw AppError.badRequest('No available copies of this book to borrow.');
    }
    const id = await borrowRepository.createBorrow({ bookId, userId, issuedBy, borrowDate, dueDate }, conn);
    await bookRepository.adjustAvailableCopies(bookId, -1, conn);
    return id;
  });

  await auditService.record({ userId: issuedBy, action: 'BORROW_RECORD_CREATED', entityType: 'borrow_record', entityId: recordId, req });
  return borrowRepository.findById(recordId);
}

async function returnBook(recordId, returnedTo, req) {
  const record = await borrowRepository.findById(recordId);
  if (!record) throw AppError.notFound('Borrow record not found.');
  if (record.status === 'returned') throw AppError.badRequest('This book has already been returned.');

  const returnDate = dayjs().format('YYYY-MM-DD');

  await db.withTransaction(async (conn) => {
    await borrowRepository.markReturned({ id: recordId, returnedTo, returnDate }, conn);
    await bookRepository.adjustAvailableCopies(record.book_id, 1, conn);
  });

  await auditService.record({ userId: returnedTo, action: 'BORROW_RECORD_RETURNED', entityType: 'borrow_record', entityId: recordId, req });
  return borrowRepository.findById(recordId);
}

async function renewBook(recordId, actorId, req) {
  const record = await borrowRepository.findById(recordId);
  if (!record) throw AppError.notFound('Borrow record not found.');
  if (record.status === 'returned') throw AppError.badRequest('Cannot renew a book that has already been returned.');

  const maxRenewals = await settingsRepository.getNumber('max_renewals', 2);
  if (record.renewal_count >= maxRenewals) {
    throw AppError.badRequest(`This loan has already reached the maximum of ${maxRenewals} renewals.`);
  }

  const loanPeriodDays = await settingsRepository.getNumber('loan_period_days', 14);
  const newDueDate = dayjs().add(loanPeriodDays, 'day').format('YYYY-MM-DD');

  await borrowRepository.renew({ id: recordId, newDueDate });
  await auditService.record({ userId: actorId, action: 'BORROW_RECORD_RENEWED', entityType: 'borrow_record', entityId: recordId, req });
  return borrowRepository.findById(recordId);
}

async function markLost(recordId, actorId, req) {
  const record = await borrowRepository.findById(recordId);
  if (!record) throw AppError.notFound('Borrow record not found.');
  if (record.status === 'returned') throw AppError.badRequest('Cannot mark a returned book as lost.');

  await db.withTransaction(async (conn) => {
    await borrowRepository.markLost(recordId, conn);
    // Lost book permanently reduces total & available copies (does not restore availability)
    await conn.execute(`UPDATE books SET total_copies = GREATEST(total_copies - 1, 0) WHERE id = ?`, [record.book_id]);
  });

  await auditService.record({ userId: actorId, action: 'BORROW_RECORD_LOST', entityType: 'borrow_record', entityId: recordId, req });
  return borrowRepository.findById(recordId);
}

async function listBorrowRecords(query) {
  return borrowRepository.list(query);
}

module.exports = { issueBook, returnBook, renewBook, markLost, listBorrowRecords };
