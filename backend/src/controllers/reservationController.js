const catchAsync = require('../utils/catchAsync');
const reservationService = require('../services/reservationService');

const create = catchAsync(async (req, res) => {
  const userId = req.user.role === 'user' ? req.user.id : req.body.userId;
  const reservation = await reservationService.reserveBook(req.body.bookId, userId, req);
  res.status(201).json({ success: true, data: { reservation } });
});

const cancel = catchAsync(async (req, res) => {
  const reservation = await reservationService.cancelReservation(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { reservation } });
});

const fulfill = catchAsync(async (req, res) => {
  const reservation = await reservationService.fulfillReservation(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { reservation } });
});

const list = catchAsync(async (req, res) => {
  const { page, limit, status, bookId } = req.query;
  const userId = req.user.role === 'user' ? req.user.id : req.query.userId;
  const result = await reservationService.listReservations({ page, limit, status, userId, bookId });
  res.status(200).json({ success: true, data: result });
});

module.exports = { create, cancel, fulfill, list };
