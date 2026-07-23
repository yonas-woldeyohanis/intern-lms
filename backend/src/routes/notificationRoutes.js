const express = require('express');
const catchAsync = require('../utils/catchAsync');
const authenticate = require('../middleware/authenticate');
const db = require('../config/database');

const router = express.Router();
const authorize = require('../middleware/authorize');
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Returns actionable notifications for the current user:
 *  - Overdue borrow records (admin/librarian)
 *  - Books due today or tomorrow (admin/librarian)
 *  - Pending reservations that are ready to fulfill (admin/librarian)
 *  - User's own loans that are overdue or due soon (user role)
 */
router.get('/', catchAsync(async (req, res) => {
  const { id: userId, role } = req.user;
  const notifications = [];

  if (role === 'admin' || role === 'librarian') {
    // Overdue borrow records
    const overdue = await db.query(
      `SELECT br.id, u.first_name, u.last_name, b.title, br.due_date
       FROM borrow_records br
       JOIN users u ON u.id = br.user_id
       JOIN books b ON b.id = br.book_id
       WHERE br.status = 'overdue'
       ORDER BY br.due_date ASC
       LIMIT 10`
    );
    overdue.forEach((r) => {
      notifications.push({
        id: `overdue-${r.id}`,
        type: 'overdue',
        severity: 'danger',
        title: 'Overdue Book',
        message: `"${r.title}" borrowed by ${r.first_name} ${r.last_name} is overdue (due ${new Date(r.due_date).toLocaleDateString()}).`,
        createdAt: r.due_date
      });
    });

    // Books due within 2 days
    const dueSoon = await db.query(
      `SELECT br.id, u.first_name, u.last_name, b.title, br.due_date
       FROM borrow_records br
       JOIN users u ON u.id = br.user_id
       JOIN books b ON b.id = br.book_id
       WHERE br.status = 'borrowed'
         AND br.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 DAY)
       ORDER BY br.due_date ASC
       LIMIT 10`
    );
    dueSoon.forEach((r) => {
      notifications.push({
        id: `duesoon-${r.id}`,
        type: 'due_soon',
        severity: 'warning',
        title: 'Due Soon',
        message: `"${r.title}" borrowed by ${r.first_name} ${r.last_name} is due on ${new Date(r.due_date).toLocaleDateString()}.`,
        createdAt: r.due_date
      });
    });

    // Pending reservations awaiting fulfillment
    const pendingRes = await db.query(
      `SELECT res.id, u.first_name, u.last_name, b.title, res.created_at
       FROM reservations res
       JOIN users u ON u.id = res.user_id
       JOIN books b ON b.id = res.book_id
       WHERE res.status = 'pending'
       ORDER BY res.created_at ASC
       LIMIT 5`
    );
    pendingRes.forEach((r) => {
      notifications.push({
        id: `res-${r.id}`,
        type: 'reservation',
        severity: 'info',
        title: 'Pending Reservation',
        message: `${r.first_name} ${r.last_name} is waiting for "${r.title}".`,
        createdAt: r.created_at
      });
    });
  } else {
    // User-specific: their own overdue or due-soon loans
    const myOverdue = await db.query(
      `SELECT br.id, b.title, br.due_date
       FROM borrow_records br
       JOIN books b ON b.id = br.book_id
       WHERE br.user_id = :userId AND br.status = 'overdue'
       ORDER BY br.due_date ASC`,
      { userId }
    );
    myOverdue.forEach((r) => {
      notifications.push({
        id: `my-overdue-${r.id}`,
        type: 'overdue',
        severity: 'danger',
        title: 'Your Book is Overdue',
        message: `"${r.title}" was due on ${new Date(r.due_date).toLocaleDateString()}. Please return it immediately.`,
        createdAt: r.due_date
      });
    });

    const myDueSoon = await db.query(
      `SELECT br.id, b.title, br.due_date
       FROM borrow_records br
       JOIN books b ON b.id = br.book_id
       WHERE br.user_id = :userId AND br.status = 'borrowed'
         AND br.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
       ORDER BY br.due_date ASC`,
      { userId }
    );
    myDueSoon.forEach((r) => {
      notifications.push({
        id: `my-duesoon-${r.id}`,
        type: 'due_soon',
        severity: 'warning',
        title: 'Book Due Soon',
        message: `"${r.title}" is due on ${new Date(r.due_date).toLocaleDateString()}. Consider renewing it.`,
        createdAt: r.due_date
      });
    });

    const myFulfilledRes = await db.query(
      `SELECT r.id, b.title, r.updated_at
       FROM reservations r
       JOIN books b ON b.id = r.book_id
       WHERE r.user_id = :userId AND r.status = 'fulfilled'
         AND r.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY r.updated_at DESC`,
      { userId }
    );
    myFulfilledRes.forEach((r) => {
      notifications.push({
        id: `my-res-fulfilled-${r.id}`,
        type: 'reservation_fulfilled',
        severity: 'info',
        title: 'Reservation Fulfilled & Borrowed',
        message: `Your reservation for "${r.title}" has been fulfilled, and the book is now checked out to you.`,
        createdAt: r.updated_at
      });
    });
  }
  // Fetch recent broadcasts applicable to this user's role (or 'all'), excluding those sent by the current user
  const broadcasts = await db.query(
    `SELECT id, title, message, severity, created_at
     FROM broadcasts
     WHERE (target_role = 'all' OR target_role = :role)
       AND sender_id != :userId
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY created_at DESC`,
    { role, userId }
  );

  broadcasts.forEach((b) => {
    notifications.push({
      id: `broadcast-${b.id}`,
      type: 'broadcast',
      severity: b.severity,
      title: b.title,
      message: b.message,
      createdAt: b.created_at
    });
  });

  // Fetch dismissed notifications for this user
  const dismissedRows = await db.query(
    `SELECT notification_id FROM user_dismissed_notifications WHERE user_id = :userId`,
    { userId }
  );
  const dismissedIds = new Set(dismissedRows.map(r => r.notification_id));

  // Filter out dismissed notifications
  const activeNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  // Sort: danger first, then warning, then info
  const order = { danger: 0, warning: 1, info: 2 };
  activeNotifications.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  res.status(200).json({ success: true, data: { notifications: activeNotifications, count: activeNotifications.length } });
}));

/**
 * POST /api/v1/notifications/dismiss
 * Dismiss one or all notifications for the current user.
 */
router.post('/dismiss', catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ success: false, error: { message: 'notificationId is required.' } });
  }

  if (Array.isArray(notificationId)) {
    for (const nid of notificationId) {
      await db.query(
        `INSERT IGNORE INTO user_dismissed_notifications (user_id, notification_id) VALUES (:userId, :nid)`,
        { userId, nid }
      );
    }
  } else {
    await db.query(
      `INSERT IGNORE INTO user_dismissed_notifications (user_id, notification_id) VALUES (:userId, :notificationId)`,
      { userId, notificationId }
    );
  }

  res.status(200).json({ success: true, data: { message: 'Notifications dismissed.' } });
}));

/**
 * POST /api/v1/notifications/broadcast
 * Send a broadcast message to a specific role or all users.
 */
router.post('/broadcast', authorize('admin'), catchAsync(async (req, res) => {
  const { title, message, targetRole = 'all', severity = 'info' } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ success: false, error: { message: 'Title and message are required.' } });
  }

  const result = await db.query(
    `INSERT INTO broadcasts (sender_id, target_role, title, message, severity)
     VALUES (:senderId, :targetRole, :title, :message, :severity)`,
    { senderId: req.user.id, targetRole, title, message, severity }
  );

  res.status(201).json({ success: true, data: { message: 'Broadcast sent successfully.', id: result.insertId } });
}));

module.exports = router;
