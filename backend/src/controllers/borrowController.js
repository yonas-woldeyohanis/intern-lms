const catchAsync = require('../utils/catchAsync');
const borrowService = require('../services/borrowService');

const issue = catchAsync(async (req, res) => {
  const record = await borrowService.issueBook(req.body, req.user.id, req);
  res.status(201).json({ success: true, data: { record } });
});

const returnBook = catchAsync(async (req, res) => {
  const record = await borrowService.returnBook(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { record } });
});

const renew = catchAsync(async (req, res) => {
  const record = await borrowService.renewBook(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { record } });
});

const markLost = catchAsync(async (req, res) => {
  const record = await borrowService.markLost(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { record } });
});

const list = catchAsync(async (req, res) => {
  const { page, limit, status, userId, bookId, overdueOnly } = req.query;
  // Non-privileged users can only see their own borrowing history
  const effectiveUserId = req.user.role === 'user' ? req.user.id : (userId || undefined);
  const result = await borrowService.listBorrowRecords({ page, limit, status, userId: effectiveUserId, bookId, overdueOnly });
  res.status(200).json({ success: true, data: result });
});

module.exports = { issue, returnBook, renew, markLost, list };
