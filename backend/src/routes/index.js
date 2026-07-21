const express = require('express');

const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const userRoutes = require('./userRoutes');
const borrowRoutes = require('./borrowRoutes');
const reservationRoutes = require('./reservationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const settingsRoutes = require('./settingsRoutes');
const qrRoutes = require('./qrRoutes');
const notificationRoutes = require('./notificationRoutes');
const {
  authorsRouter, publishersRouter, categoriesRouter, shelvesRouter, departmentsRouter
} = require('./lookupRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/users', userRoutes);
router.use('/borrow-records', borrowRoutes);
router.use('/reservations', reservationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);
router.use('/qr', qrRoutes);
router.use('/notifications', notificationRoutes);
router.use('/authors', authorsRouter);
router.use('/publishers', publishersRouter);
router.use('/categories', categoriesRouter);
router.use('/shelves', shelvesRouter);
router.use('/departments', departmentsRouter);

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

module.exports = router;
