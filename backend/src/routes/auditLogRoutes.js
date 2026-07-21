const express = require('express');
const catchAsync = require('../utils/catchAsync');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const auditService = require('../services/auditService');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/', catchAsync(async (req, res) => {
  const { page, limit, action, userId, from, to, search } = req.query;
  const result = await auditService.list({ page, limit, action, userId, from, to, search });
  res.status(200).json({ success: true, data: result });
}));

module.exports = router;
