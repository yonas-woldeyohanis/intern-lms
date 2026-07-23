const dayjs = require('dayjs');
const AppError = require('../utils/AppError');
const reservationRepository = require('../repositories/reservationRepository');
const bookRepository = require('../repositories/bookRepository');
const settingsRepository = require('../repositories/settingsRepository');
const auditService = require('../services/auditService');
const borrowService = require('./borrowService');

async function reserveBook(bookId, userId, req) {
  const book = await bookRepository.findById(bookId);
  if (!book) throw AppError.notFound('Book not found.');
  if (book.available_copies > 0) {
    throw AppError.badRequest('This book currently has available copies — please borrow it directly instead of reserving.');
  }
  const existing = await reservationRepository.findActiveForBookAndUser(bookId, userId);
  if (existing) throw AppError.conflict('You already have an active reservation for this book.');

  const holdHours = await settingsRepository.getNumber('reservation_hold_hours', 48);
  const expiresAt = dayjs().add(holdHours, 'hour').format('YYYY-MM-DD HH:mm:ss');

  const reservation = await reservationRepository.create({ bookId, userId, expiresAt });
  await auditService.record({ userId, action: 'RESERVATION_CREATED', entityType: 'reservation', entityId: reservation.id, req });
  return reservation;
}

async function cancelReservation(id, actorId, req) {
  const reservation = await reservationRepository.findById(id);
  if (!reservation) throw AppError.notFound('Reservation not found.');
  if (reservation.status !== 'pending') throw AppError.badRequest('Only pending reservations can be cancelled.');
  const updated = await reservationRepository.updateStatus(id, 'cancelled');
  await auditService.record({ userId: actorId, action: 'RESERVATION_CANCELLED', entityType: 'reservation', entityId: id, req });
  return updated;
}

async function fulfillReservation(id, actorId, req) {
  const reservation = await reservationRepository.findById(id);
  if (!reservation) throw AppError.notFound('Reservation not found.');
  if (reservation.status !== 'pending') throw AppError.badRequest('Only pending reservations can be fulfilled.');
  
  // Automatically borrow the book for the user when their reservation is fulfilled
  await borrowService.issueBook({ bookId: reservation.book_id, userId: reservation.user_id }, actorId, req);
  
  const updated = await reservationRepository.updateStatus(id, 'fulfilled');
  await auditService.record({ userId: actorId, action: 'RESERVATION_FULFILLED', entityType: 'reservation', entityId: id, req });
  return updated;
}

async function listReservations(query) {
  return reservationRepository.list(query);
}

module.exports = { reserveBook, cancelReservation, fulfillReservation, listReservations };
